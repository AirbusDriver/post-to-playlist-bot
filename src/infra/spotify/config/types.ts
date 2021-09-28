export type SpotifyConfig = {
    authTokenFile: string;
    clientId: string;
    clientSecret: string;
    scopes: string[];
    callback: string;
    state: string;
}

export type SpotifyEnvSettings = {
    SPOTIFY_CLIENT_ID: string;
    SPOTIFY_SECRET: string;
}
