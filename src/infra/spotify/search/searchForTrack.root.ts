import { SpotifyItem, TrackInfo }                from '@/music/types';
import { SpotifyError, SpotifyErrorNames }       from '@infra/spotify';
import { errorFactory }                          from '@infra/spotify/errors';
import getSpotifyLogger                          from '@infra/spotify/logger';
import {
    spotifyApiTrackSearchResponseCodec,
    TrackItem
}                                                from '@infra/spotify/search/codecs';
import {
    QueryParams,
    SearchForTrackCommandTask,
    SearchTrackDTO,
    TrackSearchResponse
}                                                from '@infra/spotify/search/types';
import { mapSpotifyErrorResponseToSpotifyError } from '@infra/spotify/spotifyApiUtils';
import * as P                                    from 'purify-ts';
import { EitherAsync }                           from 'purify-ts';
import R                                         from 'ramda';
import SpotifyWebApi                             from 'spotify-web-api-node';


const logger = getSpotifyLogger().child({module: 'spotify/search/searchForTrack'});


const defaultQueryParams: QueryParams = {
    limit: 5,
    offset: 0,
};


export type DoSearchForTrackTask = (track: SearchTrackDTO, query?: QueryParams) => EitherAsync<SpotifyError, TrackSearchResponse>;


/**
 * Dependency root
 */
export type SearchForTrackCommandContext = {
    searchForTrackTaskFactory: (client: SpotifyWebApi) => DoSearchForTrackTask;
    client: SpotifyWebApi,
}


const trackDtoToSearchString = (dto: SearchTrackDTO): string => {
    const {title, artist} = dto;
    return `track:${ title } artist:${ artist }`;
};


const searchForTrackDtoCodec: P.Codec<P.FromType<SearchTrackDTO>> = P.Codec.interface({
    title: P.string,
    artist: P.string,
});


export const searchForTrackWithClient = (client: SpotifyWebApi): DoSearchForTrackTask => (track, query) => {
    return EitherAsync(async ctx => {

        const validatedDto = await ctx.liftEither(searchForTrackDtoCodec.decode(track).mapLeft(err => ({
            message: err,
            name: SpotifyErrorNames.BAD_REQUEST,
            orig: P.parseError(err)
        })));

        const queryString = trackDtoToSearchString(validatedDto);

        const queryParams = query || defaultQueryParams;

        const resp = await ctx.fromPromise(EitherAsync(() => client.searchTracks(queryString, queryParams))
            .ifLeft(logger.error)
            .mapLeft(mapSpotifyErrorResponseToSpotifyError).run());

        const results = await ctx.liftEither(spotifyApiTrackSearchResponseCodec.decode(resp)
            .mapLeft<SpotifyError>(errorFactory.unknown));

        logger.debug('spotify track search results', {
            input: {
                dto: validatedDto,
                searchString: queryString,
                params: queryParams
            },
            result: results.body.tracks.items[0]
        });

        return results;
    });
};


export const itemToTrackInfo: (item: TrackItem) => SpotifyItem<TrackInfo> = item => ({
    item: {
        title: item.name,
        artist: item.artists[0].name,
    },
    uri: item.uri,
    id: item.id,
});


export const responseToTrackInfo: (resp: TrackSearchResponse) => SpotifyItem<TrackInfo>[] = R.pipe(
    (x: TrackSearchResponse) => x.body.tracks.items,
    R.map(itemToTrackInfo)
);


type SearchForTrackCommandRoot = (fnCtx: SearchForTrackCommandContext) => SearchForTrackCommandTask;


export const searchForTrackCommandRoot: SearchForTrackCommandRoot =
    fnCtx => (track, query) => EitherAsync(async ctx => {

        return ctx.fromPromise(
            fnCtx.searchForTrackTaskFactory(fnCtx.client)(track, query)
                .map(responseToTrackInfo)
                .run());

    });

export { SearchForTrackCommandTask };