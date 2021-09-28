import { SpotifyItem, TrackInfo } from '@/music/types';
import { SpotifyError }           from '@infra/spotify';
import { errorFactory }           from '@infra/spotify/errors';
import getSpotifyLogger           from '@infra/spotify/logger';
import {
    spotifyApiTrackSearchResponseCodec,
    TrackItem
}                                 from '@infra/spotify/search/codecs';
import {
    QueryParams,
    SearchForTrackCommandTask,
    SearchTrackDTO,
    TrackSearchResponse
}                                 from '@infra/spotify/search/types';
import {
    mapSpotifyErrorResponseToSpotifyError,
    SpotifyApiPromiseValue
}                                 from '@infra/spotify/spotifyApiUtils';
import { EitherAsync }            from 'purify-ts';
import R                          from 'ramda';
import SpotifyWebApi              from 'spotify-web-api-node';


const logger = getSpotifyLogger().child({module: 'searchForTrack'});


const defaultQueryParams: QueryParams = {
    limit: 10,
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

export type SearchResponseResult = SpotifyApiPromiseValue<'searchTracks'>

const trackDtoToSearchString = (dto: SearchTrackDTO): string => {
    const {title, artist} = dto;
    return `track:${ title } artist:${ artist }`;
};


// SpotifyWebApi -> SearchForTrackTask
export const searchForTrackWithClient = (client: SpotifyWebApi): DoSearchForTrackTask => (track, query) => {
    return EitherAsync(async ctx => {
        const queryString = trackDtoToSearchString(track);

        const queryParams = query || defaultQueryParams;

        const resp = await ctx.fromPromise(EitherAsync(() => client.searchTracks(queryString, queryParams))
            .mapLeft(mapSpotifyErrorResponseToSpotifyError).run());

        return ctx.liftEither(spotifyApiTrackSearchResponseCodec.decode(resp)
            .mapLeft<SpotifyError>(errorFactory.unknown));
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