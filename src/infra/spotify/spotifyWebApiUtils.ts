import { errorFactory, SpotifyError } from "@infra/spotify/errors";
import { PromiseValue }               from "@shared/utils/utilityTypes";
import * as P                         from "purify-ts";
import SpotifyWebApi                  from "spotify-web-api-node";


// Interfaces

type SpotifyApiMethodName = keyof SpotifyWebApi;

type SpotifyApiResponse<T extends SpotifyApiMethodName> = ReturnType<SpotifyWebApi[T]>;

export type SpotifyApiPromiseValue<T extends SpotifyApiMethodName> = PromiseValue<SpotifyApiResponse<T>>


// Errors

export type SpotifyErrorResponse = {
    body: unknown;
    message: string;
    headers: {
        [header: string]: string
    },
    statusCode: number,
}

type SpotifyErrorResponseCodec = P.Codec<P.FromType<SpotifyErrorResponse>>;

export const spotifyErrorResponseCodec: SpotifyErrorResponseCodec = P.Codec.interface({
    body: P.unknown,
    message: P.string,
    headers: P.record(P.string, P.string),
    statusCode: P.number,
});


// Concrete Response Codecs

type SpotifyCodeGrantResponseCodec = P.Codec<P.FromType<Pick<SpotifyApiPromiseValue<"authorizationCodeGrant">, "body">>>

export const spotifyCodeGrantResponseCodec: SpotifyCodeGrantResponseCodec = P.Codec.interface({
    body: P.Codec.interface({
        access_token: P.string,
        refresh_token: P.string,
        expires_in: P.number,
        token_type: P.string,
        scope: P.string,
    }),
});


export type RefreshAccessTokenResponse = {
    body: {
        access_token: string;
        expires_in: number;
        refresh_token?: string | undefined,
        scope: string;
        token_type: string;
    }
}

type SpotifyRefreshTokenResponseCodec = P.Codec<P.FromType<RefreshAccessTokenResponse>>

export const spotifyRefreshTokenResponseCodec: SpotifyRefreshTokenResponseCodec = P.Codec.interface({
    body: P.Codec.interface({
        access_token: P.string,
        expires_in: P.number,
        token_type: P.string,
        scope: P.string,
        refresh_token: P.optional(P.string),
    }),
}) as SpotifyRefreshTokenResponseCodec;


/** Return a SpotifyError from some SpotifyWebApi error response*/
export const mapSpotifyErrorResponseToSpotifyError = (resp: unknown): SpotifyError => {
    return spotifyErrorResponseCodec.decode(resp)
        .map<SpotifyError>(errorFactory.errorResponse)
        .mapLeft<SpotifyError>(err => errorFactory.unknown("received an unknown error response", err)).extract();
};


/** Return a codec that is wrapped in the `body` parameter as returned by the SpotifyWebApi */
export const spotifyWebApiCodecFactory = <T>(codec: P.Codec<T>) => P.Codec.interface({
    body: codec,
    statusCode: P.number,
    headers: P.record(P.string, P.string),
});