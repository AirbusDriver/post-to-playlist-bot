import SpotifyWebApi                   from 'spotify-web-api-node';
import { createSearchForTrackCommand } from './searchForTrack.command';
import { SearchService }               from './types';


export {
    SearchService
};

// todo: inline a caching fn

/**
 * Return a SearchService with an authorized client
 *
 * @param {SpotifyWebApi} client
 * @return {SearchService}
 */
export const createSearchService = (client: SpotifyWebApi): SearchService => {

    return {
        searchForTrack: createSearchForTrackCommand(client)
    };
};