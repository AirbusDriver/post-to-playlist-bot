import { SearchForTrackCommandTask }                                                     from '@/music/ports';
import SpotifyWebApi                                                                     from 'spotify-web-api-node';
import { SearchForTrackCommandEnv, searchForTrackCommandRoot, searchForTrackWithClient } from './searchForTrack.root';
import { songMemoryCacheCacheIO }                                                        from './trackCache';


export { searchForTrackCommandRoot } from './searchForTrack.root';


export const createSearchForTrackCommand = (client: SpotifyWebApi): SearchForTrackCommandTask => {
    const ctx: SearchForTrackCommandEnv = {
        search: searchForTrackWithClient(client),
        cache: songMemoryCacheCacheIO.getLazy()
    };

    return searchForTrackCommandRoot(ctx);
};
