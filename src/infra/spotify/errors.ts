import { RawError }                                        from '@/shared';
import { SpotifyErrorResponse, spotifyErrorResponseCodec } from '@infra/spotify/spotifyWebApiUtils';
import * as R                                              from 'ramda';


export enum SpotifyErrorNames {
    AUTH = 'AUTH',
    BAD_REQUEST = 'BAD_REQUEST',
    CONFIG = 'CONFIG',
    ERROR_RESPONSE = 'ERROR_RESPONSE',
    EXTERNAL = 'EXTERNAL',
    NO_RESULT = 'NO_RESULT',
    PERSISTENCE = 'PERSISTENCE',
    RUNTIME = 'RUNTIME',
    UNKNOWN_RESPONSE = 'UNKNOWN_RESPONSE',
    RATE_LIMIT = 'RATE_LIMIT'
}


export type SpotifyError = RawError<SpotifyErrorNames>

export const responseErrorToSpotifyError: (err: SpotifyErrorResponse) => SpotifyError = err => {
    return spotifyErrorResponseCodec.decode(err)
        .map(err => {
            switch (err.statusCode) {
            case 429:
                return errorFactory.rateLimit(err.message, err);
            default:
                return errorFactory.unknown(err.message);
            }
        })
        .mapLeft(errorFactory.unknown)
        .extract();
};

export const createError:
    (name: SpotifyErrorNames) => <T>(message: string, orig?: T) => SpotifyError =
    name => (message, orig?) => ({
        message,
        name,
        orig: R.ifElse(R.isNil, R.always(null), R.identity)(orig),
    });


// todo: move to fns
export const errorFactory = {
    runtime: createError(SpotifyErrorNames.RUNTIME),
    auth: createError(SpotifyErrorNames.AUTH),
    external: createError(SpotifyErrorNames.EXTERNAL),
    badRequest: createError(SpotifyErrorNames.BAD_REQUEST),
    persistence: createError(SpotifyErrorNames.PERSISTENCE),
    config: createError(SpotifyErrorNames.CONFIG),
    unknown: createError(SpotifyErrorNames.UNKNOWN_RESPONSE),
    errorResponse: (errResp: SpotifyErrorResponse): SpotifyError => ({
        name: SpotifyErrorNames.ERROR_RESPONSE,
        message: errResp.message,
        orig: errResp
    }),
    noResult: createError(SpotifyErrorNames.NO_RESULT),
    rateLimit: createError(SpotifyErrorNames.RATE_LIMIT),
};