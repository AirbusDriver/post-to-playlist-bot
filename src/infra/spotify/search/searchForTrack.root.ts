import { SearchForTrackCommandTask, SearchTrackDTO }            from '@/music/ports';
import { SpotifyItem, TrackInfo }                               from '@/music/types';
import { liftMA }                                               from '@fns';
import { SpotifyError, SpotifyErrorNames }                      from '@infra/spotify';
import { errorFactory }                                         from '@infra/spotify/errors';
import getSpotifyLogger                                         from '@infra/spotify/logger';
import { spotifyApiTrackSearchResponseCodec, SpotifyTrackItem } from '@infra/spotify/search/spotifyCodecs';
import { SpotifyTrackSearchResponse }                           from '@infra/spotify/search/types';
import { mapSpotifyErrorResponseToSpotifyError }                from '@infra/spotify/spotifyWebApiUtils';
import * as P                                                   from 'purify-ts';
import { EitherAsync, Maybe }                                   from 'purify-ts';
import R                                                        from 'ramda';
import SpotifyWebApi                                            from 'spotify-web-api-node';
import { songMemoryCacheCacheIO, SpotifyTrackItemCache }        from './trackCache';


const logger = getSpotifyLogger().child({module: 'spotify/search/searchForTrack'});


export type QueryParams = {
    offset: number,
    limit: number,
}

const defaultQueryParams: QueryParams = {
    limit: 5,
    offset: 0,
};

const searchForTrackDtoCodec: P.Codec<P.FromType<SearchTrackDTO>> = P.Codec.interface({
    track: P.Codec.interface({
        title: P.string,
        artist: P.string,
    }),
    params: P.optional(P.Codec.interface({
        offset: P.number,
        limit: P.number,
    }))
});

/**
 * Actual client search
 */
export type DoSearchForTrackTask = (track: SearchTrackDTO, query?: QueryParams) => EitherAsync<SpotifyError, SpotifyTrackSearchResponse>;

export type SearchForTrackCommandEnv = {
    search: DoSearchForTrackTask,
    cache: SpotifyTrackItemCache | null
}


const trackDtoToSearchString = (dto: SearchTrackDTO): string => {
    const {title, artist} = dto.track;
    return `track:${ title } artist:${ artist }`;
};


export const searchForTrackWithClient = (client: SpotifyWebApi): DoSearchForTrackTask => (dto: SearchTrackDTO) => {
    return EitherAsync(async ctx => {

        const validatedDto = await ctx.liftEither(searchForTrackDtoCodec.decode(dto).mapLeft(err => ({
            message: err,
            name: SpotifyErrorNames.BAD_REQUEST,
            orig: P.parseError(err)
        }))) as SearchTrackDTO;

        const queryString = trackDtoToSearchString(validatedDto);

        const queryParams = validatedDto.params || defaultQueryParams;

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
            result: results.body.tracks.items
        });

        return results;
    });
};


export const itemToTrackInfo: (item: SpotifyTrackItem) => SpotifyItem<TrackInfo> = item => ({
    item: {
        title: item.name,
        artist: item.artists[0].name,
    },
    uri: item.uri,
    id: item.id,
});


export const responseToTrackInfo: (resp: SpotifyTrackSearchResponse) => SpotifyItem<TrackInfo>[] = R.pipe(
    (x: SpotifyTrackSearchResponse) => x.body.tracks.items,
    R.map(itemToTrackInfo)
);


type SearchForTrackCommandRoot = (fnCtx: SearchForTrackCommandEnv) => SearchForTrackCommandTask;

export const searchForTrackCommandRoot: SearchForTrackCommandRoot =
    fnCtx => (dto) => EitherAsync(async ctx => {

        const respPromise = liftMA(Maybe.fromNullable(fnCtx.cache))
            .chain(cache => liftMA(cache.get(dto.track)))
            .ifJust(() => logger.debug('returned from cache', {
                track: dto.track
            }))
            .toEitherAsync('noooope')
            .chainLeft(() => fnCtx.search(dto)
                .map(responseToTrackInfo)
                .ifRight(resp => fnCtx.cache?.set(dto.track, resp)))
            .run();

        return ctx.fromPromise(respPromise);
    });


