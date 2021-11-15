import { SpotifyItem, TrackInfo } from '@/music/types';
import { SpotifyError }           from '@infra/spotify';
import { EitherAsync }            from 'purify-ts';
import { TrackSearchResponse }    from './codecs';


export type QueryParams = {
    offset: number,
    limit: number,
}


export type SearchTrackDTO = {
    title: string;
    artist: string;
}


export type SearchForTrackCommandTask = (track: SearchTrackDTO, query?: QueryParams) => EitherAsync<SpotifyError, SpotifyItem<TrackInfo>[]>


export interface SearchService {
    searchForTrack: SearchForTrackCommandTask;
}


export { TrackSearchResponse };
