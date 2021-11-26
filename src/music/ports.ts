import { SpotifyItem, SpotifyPlaylistInfo, TrackInfo } from '@/music/types';
import { RedditError }                                 from '@infra/reddit/errors';
import { GetSongPostsTask }                            from '@infra/reddit/songPosts/getSongPostsFromSubreddit.root';
import { TrackSubmissionSummary }                      from '@infra/reddit/types';
import { SpotifyError }                                from '@infra/spotify';
import { QueryParams }                                 from '@infra/spotify/search/searchForTrack.root';
import * as P                                          from 'purify-ts';
import { EitherAsync }                                 from 'purify-ts';


export type SearchTrackDTO = { track: TrackInfo, params?: QueryParams }
export type SearchForTrackCommandResponse = EitherAsync<SpotifyError, SpotifyItem<TrackInfo>[]>
export type SearchForTrackCommandTask = (track: SearchTrackDTO, query?: QueryParams) => SearchForTrackCommandResponse


export type SearchForManyTracksDto = {
    tracks: TrackInfo[],
}
export type TrackSearchResponseItem = { track: TrackInfo, results: SpotifyItem<TrackInfo>[] }
export type SearchForManyTracksTaskResponse = TrackSearchResponseItem[]
export type SearchForManyTracksTask = (dto: SearchForManyTracksDto) => P.EitherAsync<SpotifyError, SearchForManyTracksTaskResponse>


export interface SearchService {
    searchForTrack: SearchForTrackCommandTask;
    searchForManyTracks: SearchForManyTracksTask;
}


export interface SongPostsService {
    getSongPostsTask: GetSongPostsTask;
}


export type SearchForPlaylistById = (id: string) => EitherAsync<SpotifyError, SpotifyPlaylistInfo | null>


export interface PlaylistService {
    searchForPlaylistById: SearchForPlaylistById;
}