import P                             from 'purify-ts';
import { trackSearchResponseCodec }  from '../spotifyCodecs';
import trackSearch_empty_response    from './sampleResponses/trackSearch.emptyResult.raw.json';
import trackSearch_nonempty_response from './sampleResponses/trackSearch.nonEmptyResult.raw.json';


describe('trackSearchResponseCodec', () => {

    describe('when passed an empty response', () => {
        const result = trackSearchResponseCodec.decode(trackSearch_empty_response);

        const value = result.extract() as P.GetType<typeof trackSearchResponseCodec>;

        it('should return a Right(response)', () => {
            expect(result.isRight()).toBe(true);
        });

        it('should return empty array of items', () => {
            expect(value.tracks.items).toEqual([]);
        });

        it('should have href', () => {
            expect(value.tracks.href).toBe('https://api.spotify.com/v1/search?query=track%3Apickle+artist%3Aoh+sleeper&type=track&offset=0&limit=10');
        });
    });

    describe('when passed an non-empty response', () => {
        const result = trackSearchResponseCodec.decode(trackSearch_nonempty_response);

        const value = result.extract() as P.GetType<typeof trackSearchResponseCodec>;

        it('should return a Right(response)', () => {
            expect(result.isRight()).toBe(true);
        });

        it('should return an array of tracks', () => {
            expect(value.tracks.items.length).toBe(1);
        });

        it('should return item details', () => {
            const item = value.tracks.items[0];

            expect(item.name).toBe('Hush Yael');
        });

        it('should return artist details', () => {
            const artists = value.tracks.items[0].artists;

            expect(artists[0].name).toBe('Oh, Sleeper');
        });
    });


});