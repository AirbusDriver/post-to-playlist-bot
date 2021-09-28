import {Maybe} from "purify-ts";
import dotenv from "dotenv";

export {server, redditAuth, isFinalRedditAuthSettings} from "./settings";
export {ServerSettings, RedditAuthCredentials} from "./settings.interfaces";


export enum NodeEnv {
    production = "production",
    development = "development",
}

type getIsProduction = () => boolean;
export const getIsProduction: getIsProduction = () => Maybe
    .fromNullable(process.env.NODE_ENV)
    .mapOrDefault(value => value === NodeEnv.production, false);


const _loadEnv = (debug = false) => {
    let loaded = false;
    return (): boolean => {
        if (loaded) return false;
        dotenv.config({debug});
        loaded = true;
        return true;
    };
};

// todo: this should not be required with -r dotenv/config
export const loadEnv = _loadEnv(!getIsProduction());