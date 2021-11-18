import SpotifyWebApi              from 'spotify-web-api-node';
import {
    SearchForManyTracksDto,
    SearchForManyTracksTask,
    SearchForManyTracksTaskEnv,
    SearchForManyTracksTaskResponse,
    searchForManyTracksTaskRoot
}                                 from './searchForManyTracks.root';
import { songMemoryCacheCacheIO } from './trackCache';


export const createSearchForManyTracks = (client: SpotifyWebApi) => {
    const env: SearchForManyTracksTaskEnv = {
        client,
        cache: songMemoryCacheCacheIO.getLazy()
    };

    return searchForManyTracksTaskRoot(env);
};

export default createSearchForManyTracks;

export { SearchForManyTracksDto, SearchForManyTracksTaskResponse, SearchForManyTracksTask };