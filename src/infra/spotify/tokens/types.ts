import { SpotifyError } from "@infra/spotify/errors";
import { EitherAsync }  from "purify-ts";


/** Domain representation of the relevant information needed to make authorized requests */
export type AuthTokens = {
    accessToken: string;
    refreshToken: string;
    expiresAt: Date;
}

/** JSON representation of AuthTokens */
export type AuthTokensDto = {
    accessToken: string;
    refreshToken: string;
    expiresAt: string;
}

/**
 * Task to persist AuthTokens
 */
export type SaveTokensTask = (tokens: AuthTokens) => EitherAsync<SpotifyError, void>;
/**
 * Task to refresh tokens from the API
 */
export type RefreshTokensTask = EitherAsync<SpotifyError, void>;
/**
 * Task to retrieve the tokens from persistence
 */
export type FetchAuthTokensTask = EitherAsync<SpotifyError, AuthTokens>
/**
 * Task that starts an interval task that checks that the tokens are valid, and refreshes them if
 * they are not
 */
export type CheckTokensEveryTask = (milli: number) => EitherAsync<SpotifyError, NodeJS.Timer>


export interface SpotifyAuthTokenService {
    /** Task that refreshes and persists the the tokens on the client */
    refreshTokens: RefreshTokensTask;
    /** Task that fetches and returns the tokens from the API service */
    fetchTokens: FetchAuthTokensTask;
    /**
     * Task that starts the automatic authentication and resolves when the
     * first refresh request has completed
     */
    start: EitherAsync<SpotifyError, void>;
    /**
     * Stop the automatic refreshing of the auth tokens
     */
    stop: EitherAsync<SpotifyError, void>;
}