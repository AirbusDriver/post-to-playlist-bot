import { SpotifyConfig, SpotifyEnvSettings } from "@infra/spotify/config/types";
import * as P                                from "purify-ts";
import { Codec }                             from "purify-ts";


export const configCodec: P.Codec<P.FromType<SpotifyConfig>> = Codec.interface({
    authTokenFile: P.string,
    clientId: P.string,
    clientSecret: P.string,
    scopes: P.array(P.string),
    callback: P.string,
    state: P.string,
});

export const envCodec: Codec<SpotifyEnvSettings> = Codec.interface(
    {
        SPOTIFY_CLIENT_ID: P.string,
        SPOTIFY_SECRET: P.string,
    },
);
