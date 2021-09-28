import { or } from 'ramda';


export enum RedditErrorTypes {
    CONFIG = 'CONFIG',
    UNKNOWN = 'UNKNOWN',
    INVALID_REQUEST = 'INVALID_REQUEST'
}


export type RedditError = {
    name: RedditErrorTypes;
    message: string;
    orig: any;
}

export const redditErrorFactory = {
    config: (msg: string, orig?: any): RedditError => ({
        message: msg,
        orig: orig || null,
        name: RedditErrorTypes.CONFIG,
    }),
    unknown: (msg: string, orig?: any): RedditError => ({
        message: msg,
        orig: orig || null,
        name: RedditErrorTypes.UNKNOWN,
    }),
    invalidRequest: (msg: string, orig?: any): RedditError => ({
        message: msg,
        orig: orig || null,
        name: RedditErrorTypes.INVALID_REQUEST
    })
};