/**
 *
 * Module containing three main tasks. One task that creates an unauthorized client
 * from the configurations found in the settings and .env files related to the parent project.
 *
 * Another task that takes the result of that task and binds additional credentials
 * onto the client to prepare it for subsequent operations that require the authorization
 * credentials to be ont he client instance.
 *
 * A third binds the two asynchronously as a service and re-exports the whole shit-heap
 * as a single thing.
 *
 *
 *
 * ... this module throws no runtime errors. All operations are performed and typed
 * to return either EitherAsync monads or MaybeAsync monads.
 *
 * ... no logging is natively performed but can be wrapped in logging operations
 * with task.ifLeft(() -> console.error('you really screwed something up').run() without
 * affecting the type signatures of the tasks
 *
 */
import { EitherAsync }          from "@/shared/fns";
import { FetchAuthTokensTask }  from "@infra/spotify/tokens";
import SpotifyWebApi            from "spotify-web-api-node";
import { GetSpotifyConfigSafe } from "./config";
import { SpotifyError }         from "./errors";


/**
 * Task that returns a SpotifyWebApi instance that does not guarantee it is ready for
 * authorized requests
 */
export type GetClientTask = EitherAsync<SpotifyError, SpotifyWebApi>


type AddAuthorizationToClientRoot = (fetchTokens: FetchAuthTokensTask) => (getClient: GetClientTask) => GetClientTask;

export const addAuthorizationToClientRoot: AddAuthorizationToClientRoot =
    fetchTokens => getClientTask => EitherAsync(async (ctx) => {

        const client = await ctx.fromPromise(getClientTask.run());

        const tokens = await ctx.fromPromise(fetchTokens.run());

        const {accessToken, refreshToken} = tokens;

        client.setAccessToken(accessToken);
        client.setRefreshToken(refreshToken);

        return client;
    });


export type CreateUnauthorizedClientRoot = (getConfig: GetSpotifyConfigSafe) => GetClientTask;


export const createUnauthorizedClientRoot: CreateUnauthorizedClientRoot = getConfig => EitherAsync(async (ctx) => {
    const config = await ctx.liftEither(getConfig());

    const {clientId, clientSecret, callback, scopes, state} = config;

    return new SpotifyWebApi({
        clientId,
        clientSecret,
        redirectUri: callback,
    });
});

