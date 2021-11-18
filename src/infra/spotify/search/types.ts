import { SearchForTrackCommandTask }  from '@infra/spotify/search/searchForTrack.root';
import { SearchForManyTracksTask }    from './searchForManyTracks.factory';
import { SpotifyTrackSearchResponse } from './spotifyCodecs';


export interface SearchService {
    searchForTrack: SearchForTrackCommandTask;
    searchForManyTracks: SearchForManyTracksTask;
}


export { SpotifyTrackSearchResponse };

