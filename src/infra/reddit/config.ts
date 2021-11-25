import { remapKeys, safeGetEnvIO }         from '@fns/envIO';
import { RedditConfig }                    from '@infra/reddit/types';
import { Either, Right }                   from 'purify-ts';
import * as R                              from 'ramda';
import { redditConfigCodec }               from './codecs';
import { RedditError, redditErrorFactory } from './errors';


const defaults: Partial<RedditConfig> = {
    userAgent: 'BleghBot: a metalcore playlist maker',
};

const envValsToPropMap: Map<string, keyof RedditConfig> = new Map([
    [ 'REDDIT_SECRET', 'clientSecret' ],
    [ 'REDDIT_CLIENT_ID', 'clientId' ],
    [ 'REDDIT_USERNAME', 'username' ],
    [ 'REDDIT_PASSWORD', 'password' ]
]);

const mapEnvToConfigKeys = remapKeys(envValsToPropMap);

const getSpotifyEnv: () => Either<RedditError, Partial<RedditConfig>> = () => {
    return safeGetEnvIO().toEither(redditErrorFactory.config('could not retrieve env settings'))
        .map(mapEnvToConfigKeys);
};


export type GetRedditConfig = () => Either<RedditError, RedditConfig>

type GetConfigRoot = (envVals: Partial<RedditConfig>) => (defaults: Partial<RedditConfig>) => GetRedditConfig;

export const getConfigRoot: GetConfigRoot = envVals => defaults => () => {

    const merged = R.mergeAll([ defaults, envVals ]);

    return redditConfigCodec.decode(merged)
        .mapLeft(redditErrorFactory.config);

};

// composition

export const getRedditConfig: GetRedditConfig = () => getSpotifyEnv().ap(Right(getConfigRoot)).chain(fn => fn(defaults)());

export default getRedditConfig;