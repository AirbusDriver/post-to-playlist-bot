import { SpotifyError, SpotifyErrorNames } from '@infra/spotify/errors';
import { AuthTokens, AuthTokensDto }       from '@infra/spotify/tokens/types';
import * as P                              from 'purify-ts';


export const authTokensDomainCodec: P.Codec<P.FromType<AuthTokens>> = P.Codec.interface({
    accessToken: P.string,
    refreshToken: P.string,
    expiresAt: P.date,
});

export const encodeAuthTokensDomainSafe: (tokens: AuthTokens) => P.Either<Error, AuthTokensDto> = tokens => P.Either.encase(
    () => authTokensDomainCodec.encode(tokens) as AuthTokensDto,
);

export const decodeAuthTokensDtoSafe: (tokens: AuthTokensDto | unknown) => P.Either<SpotifyError, AuthTokens> = tokens => {
    return authTokensDomainCodec.decode(tokens)
        .mapLeft<SpotifyError>(s => ({
            name: SpotifyErrorNames.AUTH,
            message: s,
            orig: s,
        }));
};