import { SpotifyItem, SpotifyPlaylistInfo, TrackInfo } from '@/music/types';
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


export type GetPlaylistByName = (name: string) => EitherAsync<SpotifyError, SpotifyPlaylistInfo | null>


export interface PlaylistService {
    getPlaylistByName: GetPlaylistByName;
}