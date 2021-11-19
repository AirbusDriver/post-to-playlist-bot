import { getSpotifyConfigSafe }                                                      from "./config";
import { fetchAuthTokensTask }                                                       from "@infra/spotify/tokens";
import { GetClientTask, addAuthorizationToClientRoot, createUnauthorizedClientRoot } from "./getClient.root";


/** A task that when run, will resolve with a client without the authorization credentials */
export const createUnauthorizedClientTask: GetClientTask = createUnauthorizedClientRoot(getSpotifyConfigSafe);

/**
 * A task that when run, will resolve to Either<SpotifyError, SpotifyWebApi>. The API will be ready to make its first
 * authorized request.
 *
 * @type {GetClientTask}
 */
export const getClientWithAuthCredentialsTask: GetClientTask = addAuthorizationToClientRoot(fetchAuthTokensTask)(createUnauthorizedClientTask);