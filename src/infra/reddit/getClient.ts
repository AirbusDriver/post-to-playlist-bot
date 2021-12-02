import CacheIO         from '@fns/CacheIO';
import getRedditConfig from '@infra/reddit/config';
import Snoowrap        from 'snoowrap';


export const getClient = () => getRedditConfig()
    .ifLeft(console.error)
    .map(config => new Snoowrap(config));

export const getClientCache = CacheIO.of(() => getClient());
