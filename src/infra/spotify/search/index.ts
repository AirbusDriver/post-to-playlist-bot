import SpotifyWebApi                   from 'spotify-web-api-node';
import { createSearchForManyTracks }   from './searchForManyTracks.factory';
import { createSearchForTrackCommand } from './searchForTrack.factory';
import { SearchService }               from './types';


export {
    SearchService
};


/**
 * Return a SearchService with an authorized client
 *
 * @param {SpotifyWebApi} client
 * @return {SearchService}
 */
export const createSearchService = (client: SpotifyWebApi): SearchService => {

    return {
        searchForTrack: createSearchForTrackCommand(client),
        searchForManyTracks: createSearchForManyTracks(client),
    };
};