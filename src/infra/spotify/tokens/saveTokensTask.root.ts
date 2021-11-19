import { writeToFileSyncSafe }                        from "@fns/fileIO";
import { stringifyJsonSafe }                          from "@fns/json";
import { getSpotifyConfigSafe, GetSpotifyConfigSafe } from "@infra/spotify/config";
import { errorFactory, SpotifyError }                 from "@infra/spotify/errors";
import { encodeAuthTokensDomainSafe }                 from "@infra/spotify/tokens/codecs";
import { AuthTokens, SaveTokensTask }                 from "@infra/spotify/tokens/types";
import { Either, EitherAsync }                        from "purify-ts";


export type SaveFn = (tokens: AuthTokens) => EitherAsync<SpotifyError, void>

export const encodeTokensSafe: (tokens: AuthTokens) => Either<SpotifyError, string> = (tokens: AuthTokens) => {

    return encodeAuthTokensDomainSafe(tokens)
        .chain(encodedTokens => stringifyJsonSafe(2)(encodedTokens))
        .mapLeft(err => errorFactory.persistence(`could not encode tokens => ${ tokens }`, err));

};

export type CreateSaveAuthTokensTaskRoot =
    (saveFn: SaveFn) => SaveTokensTask

export const createSaveAuthTokensRoot: CreateSaveAuthTokensTaskRoot =
    saveFn => tokens => {
        return saveFn(tokens);
    };

export const saveTokensToFileRoot: (getConfig: GetSpotifyConfigSafe) => SaveFn =
    getConfig =>
        tokens => EitherAsync(async (helpers) => {

            const {liftEither: le} = helpers;

            const filePath = await le(getConfig()
                .map(config => config.authTokenFile));

            const jsonString = await le(encodeTokensSafe(tokens));

            return le(writeToFileSyncSafe(filePath)(jsonString)
                .mapLeft(err => errorFactory.persistence(err.message, err)));
        });

export const saveTokensToFile: SaveFn = saveTokensToFileRoot(getSpotifyConfigSafe);
