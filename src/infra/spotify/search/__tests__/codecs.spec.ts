import { makeOkayResponseFromRawResponse }    from '@infra/spotify/__tests__/testUtils';
import { spotifyApiTrackSearchResponseCodec } from '@infra/spotify/spotifyCodecs';
import P                                      from 'purify-ts';
import trackSearch_empty_response             from './sampleResponses/trackSearch.emptyResult.raw.json';
import trackSearch_nonempty_response          from './sampleResponses/trackSearch.nonEmptyResult.raw.json';


describe('spotifyApiTrackSearchResponseCodec', () => {

    describe('when passed an empty response', () => {
        const result = spotifyApiTrackSearchResponseCodec.decode(makeOkayResponseFromRawResponse(trackSearch_empty_response));

        const value = result.extract() as P.GetType<typeof spotifyApiTrackSearchResponseCodec>;

        it('should return a Right(response)', () => {
            expect(result.isRight()).toBe(true);
        });

        it('should return empty array of items', () => {
            expect(value.body.tracks.items).toEqual([]);
        });

        it('should have href', () => {
            expect(value.body.tracks.href).toBe('https://api.spotify.com/v1/search?query=track%3Apickle+artist%3Aoh+sleeper&type=track&offset=0&limit=10');
        });
    });

    describe('when passed an non-empty response', () => {
        const result = spotifyApiTrackSearchResponseCodec.decode(makeOkayResponseFromRawResponse(trackSearch_nonempty_response));

        const value = result.extract() as P.GetType<typeof spotifyApiTrackSearchResponseCodec>;

        it('should return a Right(response)', () => {
            expect(result.isRight()).toBe(true);
        });

        it('should return an array of tracks', () => {
            expect(value.body.tracks.items.length).toBe(1);
        });

        it('should return item details', () => {
            const item = value.body.tracks.items[0];

            expect(item.name).toBe('Hush Yael');
        });

        it('should return artist details', () => {
            const artists = value.body.tracks.items[0].artists;

            expect(artists[0].name).toBe('Oh, Sleeper');
        });
    });


});