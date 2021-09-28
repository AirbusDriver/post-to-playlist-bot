import SpotifyWebApi                   from 'spotify-web-api-node';
import { SearchService }               from './types';
import { createSearchForTrackCommand } from './searchForTrack.command';


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