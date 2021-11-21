import { SearchService }               from '@/music/ports';
import SpotifyWebApi                   from 'spotify-web-api-node';
import { createSearchForManyTracks }   from './searchForManyTracks.factory';
import { createSearchForTrackCommand } from './searchForTrack.factory';


export {
    SearchService
};


/**
 * Return a SearchService with an authorized client
 *
 * @param {SpotifyWebApi} client
 * @return {SearchService}
 */
export const createSearchServiceFromClient = (client: SpotifyWebApi): SearchService => {

    return {
        searchForTrack: createSearchForTrackCommand(client),
        searchForManyTracks: createSearchForManyTracks(client),
    };
};