import { SpotifyError }                                                     from '@infra/spotify';
import { SearchTrackDTO, TrackSearchResponse }                              from '@infra/spotify/search/types';
import { makeErrorReponseFromRawResponse, makeOkayResponseFromRawResponse } from '@infra/spotify/testUtils';
import { Either }                                                           from 'purify-ts';
import SpotifyWebApi                                                        from 'spotify-web-api-node';
import { searchForTrackWithClient }                                         from '../searchForTrack.root';
import nonEmptyResponse
                                                                            from './sampleResponses/trackSearch.nonEmptyResult.raw.json';


describe('searchForTrackWithClient', () => {

    const mock_searchTracks = jest.fn();
    const mock_client = {
        searchTracks: mock_searchTracks
    } as unknown as SpotifyWebApi;

    const task = searchForTrackWithClient(mock_client);

    let result: Either<SpotifyError, TrackSearchResponse>;

    const dto: SearchTrackDTO = {
        title: 'the title',
        artist: 'the artist',
    };

    const expectedString = 'track:the title artist:the artist';
    const expectedErrorMsg = 'some kind of error message';

    const expectedQueryParams = {
        limit: 10,
        offset: 0
    };

    describe('when called with good dto and the client returns a good response', () => {
        beforeAll(async () => {
            mock_searchTracks.mockResolvedValue(makeOkayResponseFromRawResponse(nonEmptyResponse));
            result = await task(dto).run();

        });

        it('should return a Right', () => {
            expect(result.isRight()).toBe(true);
        });

        it('should call the API with the expected query string', () => {
            expect(mock_searchTracks).toHaveBeenCalledWith(expectedString, expectedQueryParams);
        });

        it('should return a Right(`searchTracks` response)', () => {
            result.map(resp => {
                expect(resp.body.tracks!.items.length).toEqual(1);
            });
        });

        describe('when called with good dto and the client returns an error response', () => {
            beforeAll(async () => {
                mock_searchTracks.mockRejectedValue(makeErrorReponseFromRawResponse(expectedErrorMsg));
                result = await task(dto).run();
            });

            it('should return a Left', () => {
                expect(result.isLeft()).toBe(true);
            });

            it('should call the API with a good query string', () => {
                expect(mock_searchTracks).toHaveBeenCalledWith(expectedString, expectedQueryParams);
            });

            it('should return a Left(SpotifyErrorResponse)', () => {
                result.mapLeft(resp => {
                    expect(resp.message).toEqual(expectedErrorMsg);
                });
            });
        });
    });
});
