import {RedditAuthCredentials, ServerSettings, SettingsGuard} from "@/config/settings.interfaces";
import {makeSettingsGuard} from "@config/helpers";
import dotenv from "dotenv";
import * as defaults from "./settings.defaults";

const _env = dotenv.config();

if (_env.error != null) {
    throw new Error(`error loading config\n${_env.error}`);
}

export const server: ServerSettings = {
    port: process.env.PORT || defaults.server.port
};

export const redditAuth: Partial<RedditAuthCredentials> = {
    agent: process.env.REDDIT_USER_AGENT || defaults.redditAuth.agent!,
    id: process.env.REDDIT_CLIENT_ID!,
    userName: process.env.REDDIT_USERNAME!,
    password: process.env.REDDIT_PASSWORD!,
    secret: process.env.REDDIT_SECRET!,
};

export const isFinalRedditAuthSettings: SettingsGuard<RedditAuthCredentials> = makeSettingsGuard(
    ["agent", "id", "userName", "password", "secret"]
);

export const spotify = {
    credsFile: process.env.SPOTIFY_CREDENTIALS_FILE || `${process.cwd()}/${defaults.spotifyCredentialsFilename}`
};