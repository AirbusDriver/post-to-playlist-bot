import { Either, EitherAsync, liftEA }           from '@/shared/fns/purifyUtils';
import { stringifyJsonSafe }                     from '@fns/json';
import getLogger                                 from '@infra/spotify/logger';
import {
    RefreshAccessTokenResponse,
    spotifyCodeGrantResponseCodec,
    spotifyRefreshTokenResponseCodec,
}                                                from '@infra/spotify/spotifyWebApiUtils';
import { SaveFn }                                from '@infra/spotify/tokens/saveTokensTask.root';
import { AuthTokens }                            from '@infra/spotify/tokens/types';
import { Maybe }                                 from 'purify-ts';
import * as R                                    from 'ramda';
import SpotifyWebApi                             from 'spotify-web-api-node';
import {
    SpotifyError,
    SpotifyErrorNames,
}                                                from '../errors';
import { spotifyAuthEventEmitter as authEvents } from './authEvents';


const logger = getLogger().child({module: 'refreshTokens'});

export const parseTokenResponseToDomainAuthTokens = (resp: unknown | RefreshAccessTokenResponse, refreshToken?: string): Either<string, AuthTokens> => {
    const toExpiresAt = (exp: number) => new Date(exp * 1000 + Date.now());

    return Maybe.fromNullable<string>((resp as RefreshAccessTokenResponse).body.refresh_token)
        .alt(Maybe.fromNullable(refreshToken))
        .toEither('missing refresh token in response and it was not passed')
        .map((refresh): RefreshAccessTokenResponse => R.assocPath([ 'body', 'refresh_token' ], refresh, resp as RefreshAccessTokenResponse))
        .chain(resp => spotifyCodeGrantResponseCodec.decode(resp)
            .map((resp): AuthTokens => {
                return {
                    accessToken: resp.body.access_token,
                    refreshToken: resp.body.refresh_token,
                    expiresAt: toExpiresAt(resp.body.expires_in),
                };
            }));
};


export type RefreshAuthTokensTaskIO = (client: SpotifyWebApi) =>
    EitherAsync<SpotifyError, RefreshAccessTokenResponse>


export const refreshAuthTokensTask: RefreshAuthTokensTaskIO = client => EitherAsync(async ctx => {

    logger.info('attempting token refresh with Spotify service')

    const getTokensTask = EitherAsync(() => client.refreshAccessToken())
        .ifLeft(res => logger.debug(`... refreshAccessTokenTask failed. Response: ${ res }`))
        .ifRight(res => logger.debug(`received fresh tokens from service => ${res.body}`))

    const getTokensResp = await getTokensTask.run();

    const result: Either<SpotifyError, RefreshAccessTokenResponse> = getTokensResp
        .mapLeft((err): SpotifyError => ({
            name: SpotifyErrorNames.AUTH,
            orig: err,
            message: 'could not refresh access token',
        }))
        .chain(resp => spotifyRefreshTokenResponseCodec.decode(resp)
            .mapLeft((errStr): SpotifyError => ({
                name: SpotifyErrorNames.EXTERNAL,
                orig: errStr,
                message: errStr,
            })))
        .ifRight(tokens => client.setAccessToken(tokens.body.access_token))
        .ifRight(tokens => tokens.body.refresh_token && client.setRefreshToken(tokens.body.refresh_token))

    return ctx.liftEither(result);
});


export type RefreshAndPersistTokensRoot = (saveTokens: SaveFn) => (client: SpotifyWebApi) => EitherAsync<SpotifyError, void>;

export const refreshAndPersistTokensRoot: RefreshAndPersistTokensRoot =
    (saveTokens: SaveFn) =>
        (client: SpotifyWebApi) =>
            refreshAuthTokensTask(client)
                .chain(resp => liftEA(parseTokenResponseToDomainAuthTokens(resp, client.getRefreshToken() as string))
                    .ifLeft(s => {
                        logger.debug(`could not parse response to auth tokens. received...\n${ stringifyJsonSafe(2)(s) }`);
                        logger.debug(`the client's refresh token was explicitly passed as: ${ client.getRefreshToken() }`);
                    })
                    .mapLeft<SpotifyError>(msg => ({message: msg, orig: null, name: SpotifyErrorNames.AUTH})))
                .chain(tokens => saveTokens(tokens).ifRight(() => authEvents.emit('tokensRefreshed')));
