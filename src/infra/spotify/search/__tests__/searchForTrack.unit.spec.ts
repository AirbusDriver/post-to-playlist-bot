import { SearchForTrackCommandResponse, SearchTrackDTO }                                 from '@/music/ports';
import { GetRight }                                                                      from '@fns';
import { SpotifyError }                                                                  from '@infra/spotify';
import {
    makeErrorReponseFromRawResponse,
    makeOkayResponseFromRawResponse
}                                                                                        from '@infra/spotify/__tests__/testUtils';
import { SpotifyTrackItemCache }                                                         from '@infra/spotify/search/trackCache';
import { SpotifyTrackSearchResponse }                                                    from '@infra/spotify/search/types';
import { PromiseValue }                                                                  from '@shared/utils/utilityTypes';
import * as P                                                                            from 'purify-ts';
import { Either }                                                                        from 'purify-ts';
import SpotifyWebApi                                                                     from 'spotify-web-api-node';
import { SearchForTrackCommandEnv, searchForTrackCommandRoot, searchForTrackWithClient } from '../searchForTrack.root';
import emptyResponse
    from './sampleResponses/trackSearch.emptyResult.raw.json';
import nonEmptyResponse
    from './sampleResponses/trackSearch.nonEmptyResult.raw.json';


describe('searchForTrackWithClient', () => {

    const mock_searchTracks = jest.fn();
    const mock_client = {
        searchTracks: mock_searchTracks
    } as unknown as SpotifyWebApi;

    const task = searchForTrackWithClient(mock_client);

    let result: Either<SpotifyError, SpotifyTrackSearchResponse>;

    const dto: SearchTrackDTO = {
        track: {
            title: 'the title',
            artist: 'the artist',
        }
    };

    const expectedString = 'track:the title artist:the artist';
    const expectedErrorMsg = 'some kind of error message';

    const expectedQueryParams = {
        limit: 5,
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

    describe('when called with a good dto and the client returns an empty response', () => {
        beforeAll(async () => {
            mock_searchTracks.mockResolvedValue(makeOkayResponseFromRawResponse(emptyResponse));
            result = await task(dto).run();
        });

        it('should return a Right', () => {
            expect(result.isRight()).toBe(true);
        });

        it('should have an empty items array', () => {
            expect((result.extract() as GetRight<typeof result>).body).toEqual(emptyResponse);
        });
    });
});


describe('searchForTrackCommand', () => {

    const mock_search = jest.fn();

    const mock_cacheGet = jest.fn();
    const mock_cacheSet = jest.fn();

    const mock_cache: SpotifyTrackItemCache = {
        get: mock_cacheGet,
        set: mock_cacheSet,
    } as unknown as SpotifyTrackItemCache;

    const mockEnv: SearchForTrackCommandEnv = {
        search: mock_search,
        cache: null,
    };

    const command = searchForTrackCommandRoot(mockEnv);

    const track = {
        title: 'hush yael',
        artist: 'oh sleeper',
    };

    const dto = {
        track
    };


    describe('when cache is null', () => {

        let result: PromiseValue<SearchForTrackCommandResponse>;

        describe('and the track search returns an item', () => {

            beforeAll(async () => {
                mock_search.mockImplementation((dto: any) => {
                    return P.EitherAsync(async () => {
                        return makeOkayResponseFromRawResponse(nonEmptyResponse);
                    });
                });

                mockEnv.cache = null;

                result = await command(dto).run();
            });

            afterAll(() => {
                jest.clearAllMocks();
            });


            it('should call the search fn with proper dto', () => {

                expect(mock_search).toHaveBeenCalledWith(dto);

            });

            it('should return an array of items', () => {

                expect(result.isRight()).toBe(true);

                const val = result.extract() as GetRight<typeof result>;
                expect(val.length).toEqual(1);
                expect(val[0].id).toEqual('6YdznQRWvWTAHGv5hDGkA8');
                expect(val[0].uri).toEqual('spotify:track:6YdznQRWvWTAHGv5hDGkA8');
            });
        });

        describe('and the track search does not return an item', () => {

            beforeAll(async () => {
                mock_search.mockImplementation((dto: any) => {
                    return P.EitherAsync(async () => {
                        return makeOkayResponseFromRawResponse(emptyResponse);
                    });
                });

                mockEnv.cache = null;

                result = await command(dto).run();
            });


            it('should call the search fn with proper dto', () => {

                expect(mock_search).toHaveBeenCalledWith(dto);

            });

            it('should return an array of items', () => {

                expect(result.isRight()).toBe(true);

                const val = result.extract() as GetRight<typeof result>;
                expect(val.length).toEqual(0);
            });
        });

    });

    describe('when the cache is used', () => {

        describe('and the track is in the cache', () => {

            const cacheValue = [ 'expected results' ];

            let result: PromiseValue<SearchForTrackCommandResponse>;

            beforeAll(async () => {
                mock_cacheGet.mockImplementation((dto) => {
                    return P.Maybe.of(cacheValue);
                });

                mockEnv.cache = mock_cache;

                result = await command(dto).run();
            });

            it('should pass the dto track to the cache.get', async () => {
                expect(mock_cacheGet).toHaveBeenCalledWith(dto.track);
            });

            it('should return the cached result when cache.get returns a value array', () => {
                expect(result.isRight()).toBe(true);
                expect(result.extract()).toEqual(cacheValue);
            });

            it('should not set the track again to the cache', () => {
                expect(mock_cacheSet).not.toBeCalled();
            });
        });


        describe('and the track is not in the cache', () => {

            let result: PromiseValue<SearchForTrackCommandResponse>;

            beforeAll(async () => {
                mock_cacheGet.mockImplementation((dto) => {
                    return P.Nothing;
                });

                mockEnv.cache = mock_cache;

                mock_search.mockImplementation(dto => {
                    return P.EitherAsync(async () => {
                        return makeOkayResponseFromRawResponse(nonEmptyResponse);
                    });
                });

                result = await command(dto).run();
            });

            it('should pass the dto track to the cache.get', async () => {
                expect(mock_cacheGet).toHaveBeenCalledWith(dto.track);
            });

            it('should return the cached result when cache.get returns a value array', () => {
                expect(result.isRight()).toBe(true);
            });

            it('should set the track again to the cache', () => {
                expect(mock_cacheSet.mock.calls[0][0]).toEqual(dto.track);
                expect(mock_cacheSet.mock.calls[0][1][0].id).toEqual('6YdznQRWvWTAHGv5hDGkA8');
            });
        });

    });
});


