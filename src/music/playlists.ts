import { SearchSongPostsDto }               from '@/music/useCases/searchForSongPosts';
import { spotifyTrackEq }                   from '@/music/tracks';
import { PlaylistDefinition, SpotifyTrack } from '@/music/types';
import * as R                               from 'ramda';


enum PlaylistTrackAction {
    ADD = 'ADD',
    REMOVE = 'REMOVE',
    REMAIN = 'REMAIN',
}


export type PlaylistActions = {
    [PlaylistTrackAction.ADD]: SpotifyTrack[];
    [PlaylistTrackAction.REMOVE]: SpotifyTrack[];
    [PlaylistTrackAction.REMAIN]: SpotifyTrack[];
}

// get the tracks that appear in the playlistTracks but do not appear in search results
export const getRemoveTracks = (playlistTracks: SpotifyTrack[]) => R.differenceWith(spotifyTrackEq, playlistTracks);

// get the tracks that do not appear in the playlistTracks but appear in the search result tracks
export const getAddTracks = (playlistTracks: SpotifyTrack[]) => R.curry(R.flip(R.differenceWith(spotifyTrackEq)))(playlistTracks);

export const getRemainTracks = (playlistTracks: SpotifyTrack[]) => R.innerJoin(spotifyTrackEq, playlistTracks);

/** Return a Record<PlaylistTrackAction, SpotifyTrack[]> indicating the actions needed to update a playlist
 *
 * @param {SpotifyTrack[]} playlistTracks
 * @return {(results: SpotifyTrack[]) => PlaylistActions}
 */
export const getActions = (playlistTracks: SpotifyTrack[]) => (results: SpotifyTrack[]): PlaylistActions => {
    return R.pipe(
        R.assoc(PlaylistTrackAction.ADD, getAddTracks(playlistTracks)(results)),
        R.assoc(PlaylistTrackAction.REMAIN, getRemainTracks(playlistTracks)(results)),
        R.assoc(PlaylistTrackAction.REMOVE, getRemoveTracks(playlistTracks)(results))
    )({});
};


export const playlistSourceToSearchDto = (rule: PlaylistDefinition['rules']['sources'][0]): SearchSongPostsDto => {

    switch (rule.rule.type) {
    case 'top':
        return {
            type: rule.rule.type,
            limit: rule.rule.number,
            subreddit: rule.subreddit,
            time: rule.rule.timeframe
        };
    default :
        return {
            type: rule.rule.type,
            limit: rule.rule.number,
            subreddit: rule.subreddit,
        };
    }
};
