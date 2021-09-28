import * as P           from 'purify-ts';
import { RedditConfig } from './types';


export const redditConfigCodec: P.Codec<P.FromType<RedditConfig>> = P.Codec.interface({
    clientSecret: P.string,
    clientId: P.string,
    username: P.string,
    password: P.string,
    userAgent: P.string,
});