import {ServerSettings, RedditAuthCredentials} from "@/config/settings.interfaces";

export const server: ServerSettings = {
    port: 42069
}

export const redditAuth: Pick<RedditAuthCredentials, "agent"> = {
    agent: "reddit _spotify channel"
}

export const spotifyCredentialsFilename = ".spotifyCreds.json"