import { SpotifyTrack }                                               from '@/music/types';
import { getActions, getAddTracks, getRemainTracks, getRemoveTracks } from '../playlists';


const playlistTracks: SpotifyTrack[] = [
    {
        id: '123',
        uri: 'uri:123',
        item: {
            title: 'i am colossus',
            artist: 'meshuggah'
        }
    },
    { // should be removed
        id: '234',
        uri: 'uri:234',
        item: {
            title: 'dream house',
            artist: 'deafheaven'
        }
    },
    {
        id: '345',
        uri: 'uri:345',
        item: {
            title: 'Left Hand Assurance',
            artist: 'Johhny Booth'
        }
    }
];

const searchResults: SpotifyTrack[] = [
    { // remain
        id: '123',
        uri: 'uri:123',
        item: {
            title: 'i am colossus',
            artist: 'meshuggah'
        }
    },
    { // new
        id: '567',
        uri: 'uri:567',
        item: {
            title: 'Being able to Feel Nothing',
            artist: 'Oathbreaker'
        }
    },
    { // remain
        id: '345',
        uri: 'uri:345',
        item: {
            title: 'Left Hand Assurance',
            artist: 'Johhny Booth'
        }
    }
];

describe('getRemoveTracks', () => {
    it('should return the tracks that do not appear in search', () => {
        const exp = [ playlistTracks[1] ];

        const result = getRemoveTracks(playlistTracks)(searchResults);

        expect(result).toEqual(exp);
    });
});

describe('getAddTracks', () => {

    it('should return the tracks that appear in the search but not the playlist', () => {

        const exp = [ searchResults[1] ];

        const result = getAddTracks(playlistTracks)(searchResults);

        expect(result).toEqual(exp);
    });
});

describe('getRemainTracks', () => {

    it('should return the tracks that appear in the search any the playlist', () => {

        const exp = [ searchResults[0], searchResults[2] ];

        const result = getRemainTracks(playlistTracks)(searchResults);

        expect(result).toEqual(exp);
    });
});

describe('getActions', () => {
    const expAdd = [ searchResults[1] ];
    const expRemain = [ searchResults[0], searchResults[2] ];
    const expRemove = [ playlistTracks[1] ];

    const results = getActions(playlistTracks)(searchResults);

    it('parses actions', () => {
        expect(results.ADD).toEqual(expAdd);
        expect(results.REMAIN).toEqual(expRemain);
        expect(results.REMOVE).toEqual(expRemove);
    });
});