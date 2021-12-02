declare global {
    namespace NodeJS {
        interface ProcessEnv {
            NODE_ENV?: 'development' | 'production';
            PORT?: string;
            REDDIT_SECRET?: string;
            REDDIT_CLIENT_ID?: string;
            REDDIT_USER_AGENT?: string;
            REDDIT_USERNAME?: string;
            REDDIT_PASSWORD?: string;
            SPOTIFY_CLIENT_ID?: string;
            SPOTIFY_SECRET?: string;
            PLAYLIST_DIR?: string;
        }
    }
}

export {};