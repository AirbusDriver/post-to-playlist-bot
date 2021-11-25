import { SpotifyTrack } from '@/music/types';
import {
    deDupeSpotifyTracks,
    findSpotifyTrack,
    makeTrackSlug,
    slugifyString,
    spotifyTrackEq,
    trackEq
}                       from '../tracks';


const tracks: SpotifyTrack[] = [
    {
        id: '123',
        uri: 'uri:123',
        item: {
            title: 'a song',
            artist: 'an Artist',
        }
    },
    {
        id: '123',
        uri: 'uri:123',
        item: {
            title: 'a Song',
            artist: 'An Artist',
        }
    },
    {
        id: '234',
        uri: 'uri:234',
        item: {
            title: 'another song',
            artist: 'another Artist',
        }
    }
];

describe('slugifyString', () => {
    it('should return a slugified string', () => {
        const input = 'Oh, Sleeper';
        const expected = 'oh_sleeper';
        const result = slugifyString(input);

        expect(result).toEqual(expected);
    });
});

describe('makeTrackSlug', () => {

    it.each([
        [
            {
                artist: 'Oh, Sleeper',
                title: 'Decimation & Burial',
            }, 'artist:oh_sleeper&title:decimation_burial'
        ],
        [
            {
                artist: '',
                title: '',
            },
            'artist:&title:'
        ],
        [
            {
                artist: 'Vein',
                title: 'Virus://Vibrance'
            },
            'artist:vein&title:virus_vibrance'
        ]
    ])('should make a slug with tracks with commas', (inp, exp) => {

        expect(makeTrackSlug(inp)).toEqual(exp);
    });

});

describe('trackEq', () => {
    it('should return true when tracks equal', () => {

        const track1 = {
            title: 'decimation & burial',
            artist: 'oh sleeper'
        };

        const track2 = {
            title: 'Decimation & burial',
            artist: 'Oh, Sleeper'
        };

        expect(trackEq(track1, track2)).toBe(true);
    });

    it('should compare false when tracks unequal', () => {

        const track1 = {
            title: 'decimation & burial',
            artist: 'oh, sleeper'
        };

        const track2 = {
            title: 'Decimation & Bbburial',
            artist: 'Oh, Sleeper'
        };

        expect(trackEq(track1, track2)).toBe(false);
    });
});

describe('spotifyTrackEq', () => {

    const trackRef = {
        id: 'test123',
        uri: 'uri:test123',
        item: {
            title: 'decimation & burial',
            artist: 'oh sleeper'
        }
    };

    it.each<SpotifyTrack>([
        {
            id: 'test123',
            uri: 'uri:test123',
            item: {
                title: 'decimation & burial',
                artist: 'oh sleeper'
            }
        },
        {
            id: 'test124',
            uri: 'uri:test124',
            item: {
                title: 'decimation & burial',
                artist: 'oh sleeper'
            }
        }
    ])('should return equal', (a) => {
        expect(spotifyTrackEq(trackRef, a)).toBe(true);
    });

});

test('deDupeSpotifyTracks', () => {

    const results = deDupeSpotifyTracks(tracks);

    expect(results).toEqual([ tracks[0], tracks[2] ]);
});

test('findSpotifyTrack', () => {
    const t = [ tracks[1], tracks[2] ];

    const result = findSpotifyTrack(tracks[0], t);

    expect(result.isJust()).toBe(true);
    expect(result.extract()).toEqual(tracks[1]);
});