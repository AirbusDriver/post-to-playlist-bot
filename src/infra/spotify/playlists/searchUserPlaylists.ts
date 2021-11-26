import { SearchForPlaylistById }                                             from '@/music/ports';
import { SpotifyPlaylistInfo, SpotifyTrack }                                 from '@/music/types';
import { errorFactory, SpotifyError }                                        from '@infra/spotify/errors';
import { spotifyApiGetMyPlaylistsResponseCodec, SpotifyPlaylistSummaryItem } from '@infra/spotify/spotifyCodecs';
import { mapSpotifyErrorResponseToSpotifyError }                             from '@infra/spotify/spotifyWebApiUtils';
import { EitherAsync }                                                       from 'purify-ts';
import SpotifyWebApi                                                         from 'spotify-web-api-node';
import * as P                                                                from 'purify-ts';
import * as R                                                                from 'ramda';


type SearchUserPlaylistsEnv = {
    client: SpotifyWebApi
}

/**
 * Filtering predicate. Return true if the SpotifyPlaylistSummaryItem is what you're looking for.
 */
export type PlaylistItemIsResult = (item: SpotifyPlaylistSummaryItem) => boolean;

// do the search and return the raw response from the api
const getUserPlaylistsSummaries = (client: SpotifyWebApi, itemCheck: PlaylistItemIsResult) => EitherAsync<SpotifyError, SpotifyPlaylistSummaryItem | null>(async lifts => {

    const recurse = (limit: number, offset: number): EitherAsync<SpotifyError, SpotifyPlaylistSummaryItem | null> => EitherAsync(async () => {

        const playlistsResponse = await lifts.fromPromise(
            EitherAsync(() => client.getUserPlaylists({offset, limit}))
                .mapLeft(mapSpotifyErrorResponseToSpotifyError)
                .run());

        const playlists = await lifts.liftEither(spotifyApiGetMyPlaylistsResponseCodec.decode(playlistsResponse)
            .mapLeft(errorFactory.external));

        const result = playlists.body.items.find(itemCheck) || null;

        const isMore = playlists.body.next != null;

        if (!isMore || result != null) {
            return result;
        }
        return lifts.fromPromise(recurse(limit, offset + limit).run());
    });

    return lifts.fromPromise(recurse(10, 0).run());

});


// pull tracks from api and parse them into domain SpotifyItem<TrackInfo> items
const getTracks = (client: SpotifyWebApi, playlistItem: SpotifyPlaylistSummaryItem) => EitherAsync<SpotifyError, SpotifyPlaylistInfo | null>(async lifts => {

    const recurse = (limit: number, offset: number, tracks: SpotifyTrack[] = []): EitherAsync<SpotifyError, SpotifyTrack[]> => EitherAsync(async () => {
        const resp = await lifts.fromPromise(EitherAsync(
            () => client.getPlaylistTracks(playlistItem.id, {offset, limit}))
            .mapLeft(mapSpotifyErrorResponseToSpotifyError)
            .run());

        const newTracks = resp.body.items.map(item => ({
            id: item.track.id,
            uri: item.track.uri,
            item: {
                title: item.track.name,
                artist: item.track.artists[0].name
            }
        }));

        const accumTracks = [ ...tracks, ...newTracks ];

        if (resp.body.next == null) {
            return accumTracks;
        }
        return lifts.fromPromise(recurse(limit, offset + limit, accumTracks).run());
    });

    const tracks = await lifts.fromPromise(recurse(20, 0, []).run());

    const resp: SpotifyPlaylistInfo = {
        id: playlistItem.id,
        uri: playlistItem.uri,
        item: {
            tracks,
            name: playlistItem.name,
            description: playlistItem.description
        }
    };

    return resp;
});


export const searchUserPlaylistsWithRoot = (env: SearchUserPlaylistsEnv) => (checker: PlaylistItemIsResult) =>
    EitherAsync<SpotifyError, SpotifyPlaylistInfo | null>(async lifts => {

        const playlistResultItem = await lifts.fromPromise(
            getUserPlaylistsSummaries(env.client, checker)
                .run());

        if (playlistResultItem == null) {
            return null;
        }

        return lifts.fromPromise(getTracks(env.client, playlistResultItem).run());
    });

export const searchUserPlaylistById: (env: SearchUserPlaylistsEnv) => SearchForPlaylistById = env => id => {
    return searchUserPlaylistsWithRoot(env)(R.propEq('id', id));
};