import SpotifyWebApi from 'spotify-web-api-node';
import {
    SearchForTrackCommandContext,
    searchForTrackCommandRoot,
    SearchForTrackCommandTask,
    searchForTrackWithClient
}                    from './searchForTrack.root';


export { searchForTrackCommandRoot } from './searchForTrack.root';

export const createSearchForTrackCommand = (client: SpotifyWebApi): SearchForTrackCommandTask => {
    const ctx: SearchForTrackCommandContext = {
        client,
        searchForTrackTaskFactory: searchForTrackWithClient
    };

    return searchForTrackCommandRoot(ctx);
};

