import { playlistDefinitionCodec }                                from '@/music/codecs';
import { getActions, PlaylistActions, playlistSourceToSearchDto } from '@/music/playlists';
import { SearchForPlaylistById }                                  from '@/music/ports';
import { PlaylistDefinition, SpotifyPlaylistInfo }                from '@/music/types';
import { ApplicationError, ApplicationErrorNames, RawError }      from '@/shared';
import { liftEA }                                                 from '@fns';
import getAuthorizedClientCache                                   from '@infra/spotify';
import { searchUserPlaylistById }                                 from '@infra/spotify/playlists/searchUserPlaylists';
import { mapSpotifyErrorResponseToSpotifyError }                  from '@infra/spotify/spotifyWebApiUtils';
import getRootLogger                                              from '@shared/logger';
import * as P                                                     from 'purify-ts';
import { EitherAsync, Left, Right }                               from 'purify-ts';
import * as R                                                     from 'ramda';
import SpotifyWebApi                                              from 'spotify-web-api-node';
import { musicEventEmitter }                                      from '../events';
import { SearchForSongPostsTask, searchForSongPostsUseCase }      from './searchForSongPosts';


const logger = getRootLogger().child({module: 'syncPlaylist'});


export enum PlaylistErrorReasons {
    DOES_NOT_EXIST = 'DOES_NOT_EXIST',
}


export type PlaylistError = RawError<PlaylistErrorReasons>


export type SyncPlaylistResponse = {
    playlist: SpotifyPlaylistInfo,
    actions: PlaylistActions,
}


export type SyncPlaylistTaskDto = PlaylistDefinition;

export type SyncPlaylistTask = (dto: SyncPlaylistTaskDto) => EitherAsync<PlaylistError | ApplicationError, SyncPlaylistResponse>


export type SyncPlaylistTaskEnv = {
    searchSongPosts: SearchForSongPostsTask,
    searchForPlaylist: SearchForPlaylistById,
    client: SpotifyWebApi
}


export const syncPlaylistTaskRoot = (env: SyncPlaylistTaskEnv): SyncPlaylistTask => dto => {
    return EitherAsync(async lifts => {
        const validDto = await lifts.liftEither(
            playlistDefinitionCodec
                .decode(dto)
                .mapLeft(err => ({
                    name: ApplicationErrorNames.BAD_REQUEST,
                    orig: err,
                    message: err,
                }))
        );

        const playlist = await lifts
            .fromPromise(
                env.searchForPlaylist(validDto.id)
                    .mapLeft<ApplicationError>(err => ({
                        name: ApplicationErrorNames.SERVICE_ERROR,
                        orig: err,
                        message: 'error occurred while searching for playlist'
                    }))
                    .chain<PlaylistError, SpotifyPlaylistInfo>(value => liftEA(value == null
                        ? Left<PlaylistError>({
                            name: PlaylistErrorReasons.DOES_NOT_EXIST,
                            orig: null,
                            message: `playlist does not exist for id ${ validDto.id }`
                        }) : Right(value)))
                    .ifRight(_ => logger.info(`found playlist ${ _.item.name }`))
                    .run());

        const searchTasks = R.pipe(
            () => validDto.rules.sources,
            R.map(playlistSourceToSearchDto),
            R.map(env.searchSongPosts),
        )();

        const actions = await lifts.fromPromise(
            EitherAsync.sequence(searchTasks)
                .mapLeft<ApplicationError>(err => ({
                    name: ApplicationErrorNames.SERVICE_ERROR,
                    orig: err,
                    message: err.message
                }))
                .map(R.flatten)
                .map(R.map(R.prop('spotify')))
                .map(getActions(playlist.item.tracks))
                .run()
        );


        await EitherAsync.sequence<any, any>([
            P.EitherAsync(async () =>
                P.NonEmptyList.fromArray(actions.ADD.map(r => r.uri))
                    .ifJust(() => logger.info(`adding ${ actions.ADD.length } tracks to ${ playlist.item.name }`))
                    .map(async tracks => await env.client.addTracksToPlaylist(playlist.id, tracks))
                    .extractNullable())
                .mapLeft(mapSpotifyErrorResponseToSpotifyError),

            P.EitherAsync(async () =>
                P.NonEmptyList.fromArray(actions.REMOVE.map(r => ({uri: r.uri})))
                    .ifJust(() => logger.info(`removing ${ actions.REMOVE.length } tracks to ${ playlist.item.name }`))
                    .map(async tracks => await env.client.removeTracksFromPlaylist(playlist.id, tracks))
                    .extractNullable())
                .mapLeft(mapSpotifyErrorResponseToSpotifyError),

            P.EitherAsync(async () => env.client.changePlaylistDetails(playlist.id, {
                name: validDto.name,
                description: validDto.description,
            }))
        ])
            .mapLeft<ApplicationError>(err => ({
                name: ApplicationErrorNames.SERVICE_ERROR,
                orig: err,
                message: 'an error occurred while performing tasks on playlist'
            }))
            .map(P.always(actions))
            .ifLeft(err => musicEventEmitter.emit(
                'playlistUpdateFailed',
                playlist,
                err,
                `could not update playlist: ${ playlist.item.name })`))
            .ifRight(actions => musicEventEmitter.emit('playlistUpdated', playlist, actions))
            .run();

        return {
            playlist,
            actions,
        };
    });
};


export const syncPlaylistUseCase: SyncPlaylistTask = dto => {
    return EitherAsync(async lifts => {
        const client = await lifts.fromPromise(getAuthorizedClientCache.getLazy());

        return syncPlaylistTaskRoot({
            searchSongPosts: searchForSongPostsUseCase,
            client,
            searchForPlaylist: searchUserPlaylistById({client})

        });
    })
        .mapLeft(err => ({
            name: ApplicationErrorNames.CONFIG,
            orig: err,
            message: 'could not load dependencies for syncPlaylist'
        }))
        .ifLeft(logger.error)
        .chain(fn => fn(dto));
};

export default syncPlaylistUseCase;