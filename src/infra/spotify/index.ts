import { SpotifyError }                     from '@infra/spotify/errors';
import { getClientWithAuthCredentialsTask } from '@infra/spotify/getClient';
import { createAuthTokenService }           from '@infra/spotify/tokens';
import { EitherAsync }                      from 'purify-ts';
import CacheIO                              from '@fns/CacheIO';
import SpotifyWebApi                        from 'spotify-web-api-node';


export const getAuthorizedClientTask = EitherAsync<SpotifyError, SpotifyWebApi>(async ctx => {
    const client = await ctx.fromPromise(getClientWithAuthCredentialsTask.run());
    const authService = createAuthTokenService(client);

    await ctx.fromPromise(authService.refreshTokens.run());

    await ctx.fromPromise(authService.start.run());

    return client;
});

/** A cached IO Task that will return only one instance of an authorized SpotifyWebApi client.
 *
 * Use
 *
 * @type {CacheIO<Promise<Either<SpotifyError, SpotifyWebApi>>>}
 */
export const getAuthorizedClientCache = CacheIO.of(() => getAuthorizedClientTask.run());

export default getAuthorizedClientCache;


export { SpotifyError, SpotifyErrorNames } from './errors';
export { SpotifyWebApi };

export { createSearchService }  from './search';
export {createAuthTokenService} from './tokens'