import { SpotifyErrorResponse } from '@infra/spotify/spotifyApiUtils';
import * as R                   from 'ramda';


export enum SpotifyErrorNames {
    AUTH = 'AUTH',
    BAD_REQUEST = 'BAD_REQUEST',
    CONFIG = 'CONFIG',
    ERROR_RESPONSE = 'ERROR_RESPONSE',
    EXTERNAL = 'EXTERNAL',
    NO_RESULT = "NO_RESULT",
    PERSISTENCE = 'PERSISTENCE',
    RUNTIME = 'RUNTIME',
    UNKNOWN_RESPONSE = 'UNKNOWN_RESPONSE',
}


// todo: there has to be a better way to type the orig field
export type SpotifyError = {
    message: string;
    name: SpotifyErrorNames;
    orig: any;
}

const createError:
    (name: SpotifyErrorNames) => <T>(message: string, orig?: T) => SpotifyError =
    name => (message, orig?) => ({
        message,
        name,
        orig: R.ifElse(R.isNil, R.always(null), R.identity)(orig),
    });


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
    noResult: createError(SpotifyErrorNames.NO_RESULT)
};