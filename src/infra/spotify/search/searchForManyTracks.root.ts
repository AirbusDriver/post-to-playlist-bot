import { trackInfoCodec }                                      from "@/music/codecs";
import { SpotifyItem, TrackInfo }                              from "@/music/types";
import { runEAsyncsWithDelaySeq }                              from "@fns";
import { perSecond }                                           from "@fns/delay";
import { SpotifyError }                                        from "@infra/spotify";
import { errorFactory }                                        from "@infra/spotify/errors";
import getSpotifyLogger                                        from "@infra/spotify/logger";
import * as P                                                  from "purify-ts";
import * as R                                                  from "ramda";
import SpotifyWebApi                                           from "spotify-web-api-node";
import { searchForTrackCommandRoot, searchForTrackWithClient } from "./searchForTrack.root";
import { SpotifyTrackItemCache }                               from "./trackCache";


const logger = getSpotifyLogger().child({module: "spotify/search/searchForManyTracks"});

const DELAY = perSecond(6);


export type SearchForManyTracksDto = {
    tracks: TrackInfo[],
}

type SearchForManyTracksDtoCodec = P.Codec<P.FromType<SearchForManyTracksDto>>;

export const searchForManyTracksDtoCodec: SearchForManyTracksDtoCodec = P.Codec.interface({
    tracks: P.array(trackInfoCodec)
});

type TrackSearchResponseItem = { track: TrackInfo, resp: SpotifyItem<TrackInfo>[] }

export type SearchForManyTracksTaskResponse = TrackSearchResponseItem[]

export type SearchForManyTracksTask = (dto: SearchForManyTracksDto) => P.EitherAsync<SpotifyError, SearchForManyTracksTaskResponse>

export type SearchForManyTracksTaskEnv = {
    client: SpotifyWebApi,
    cache: SpotifyTrackItemCache | null,
}

export const searchForManyTracksTaskRoot = (env: SearchForManyTracksTaskEnv): SearchForManyTracksTask => dto => {
    return P.EitherAsync(async ctx => {
        const validDto = await ctx.liftEither(searchForManyTracksDtoCodec.decode(dto)
            .mapLeft(errorFactory.badRequest));

        const tracks = validDto.tracks;

        const cacheResults = P.Maybe.fromNullable(env.cache)
            .map(cache => tracks.map(
                track => P.Tuple.fanout(R.identity, cache.get, track)))
            .orDefault([]);

        const toGetFromClient = cacheResults.filter(tup => tup.snd().isNothing()) as unknown as P.Tuple<TrackInfo, null>[];

        const clientFetcher = searchForTrackCommandRoot({
            search: searchForTrackWithClient(env.client),
            cache: env.cache
        });

        const tasks = toGetFromClient.map(tup =>
            clientFetcher({track: tup.fst()})
                .map(resp => P.Tuple(tup.fst(), resp)));

        const clientResults = await runEAsyncsWithDelaySeq(DELAY)(tasks);

        const cacheRights = cacheResults
            .map(t => t.map(mb => mb.extractNullable()))
            .filter(t => R.complement(R.isNil)(t.snd())) as P.Tuple<TrackInfo, SpotifyItem<TrackInfo>[]>[];

        const clientRights = clientResults.rights;

        P.Maybe.fromNullable(env.cache)
            .map(cache => clientRights.forEach(tup => cache.set(...tup.toArray())));

        const resp: SearchForManyTracksTaskResponse = [ ...cacheRights, ...clientRights ].map(tup => {
            return ({
                track: tup.fst(),
                resp: tup.snd(),
            });
        });

        return resp;
    });
};