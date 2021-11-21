import { SearchForManyTracksDto, SearchForManyTracksTask, SearchForManyTracksTaskResponse } from '@/music/ports';
import SpotifyWebApi                                                                        from 'spotify-web-api-node';
import {
    SearchForManyTracksTaskEnv,
    searchForManyTracksTaskRoot
}                                                                                           from './searchForManyTracks.root';
import { songMemoryCacheCacheIO }                                                           from './trackCache';


export const createSearchForManyTracks = (client: SpotifyWebApi) => {
    const env: SearchForManyTracksTaskEnv = {
        client,
        cache: songMemoryCacheCacheIO.getLazy()
    };

    return searchForManyTracksTaskRoot(env);
};

export default createSearchForManyTracks;

export { SearchForManyTracksDto, SearchForManyTracksTaskResponse, SearchForManyTracksTask };