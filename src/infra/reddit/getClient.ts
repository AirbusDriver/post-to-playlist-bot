import getRedditConfig from '@infra/reddit/config';
import { RedditError } from '@infra/reddit/errors';
import { Either }      from 'purify-ts';
import Snoowrap        from 'snoowrap';


export type GetClient = () => Either<RedditError, Snoowrap>

export const getClient = () => getRedditConfig()
    .map(config => new Snoowrap(config));

