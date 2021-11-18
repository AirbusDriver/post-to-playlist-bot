import { Logger } from '@shared/logger';
import nodeCache  from 'node-cache';
import * as P     from 'purify-ts';
import * as R     from 'ramda';


export type KeyValueCache<K, T> = Readonly<{
    _cache: nodeCache;
    _itemHasher: (item: K) => string;
    _logger?: Logger;
    get(hashable: K): P.Maybe<T>;
    getMany(hashable: K[]): P.Maybe<T>[]
    set(hashable: K, val: T): P.Either<Error, T>;
    setMany(info: [ K, T ][]): P.Either<Error, T>[];
}>

export type Hasher<T> = (item: T) => string;

const getItemFromCache = <K, T>(hasher: Hasher<K>) => (cache: nodeCache, logger?: Logger) => (hashable: K): P.Maybe<T> => {
    return P.Either.encase(() => hasher(hashable))
        .ifLeft(err => logger?.error(`could not hash item`, {item: hashable, error: err}))
        .toMaybe()
        .chainNullable(key => cache.get<T>(key));
};

const getManyItemsFromCache = <K, T>(hasher: Hasher<K>) => (cache: nodeCache, logger?: Logger) => (hashables: K[]): P.Maybe<T>[] => {
    return hashables.map(item => getItemFromCache<K, T>(hasher)(cache, logger)(item));
};

const setItemToCache = <K, T>(hasher: Hasher<K>) => (cache: nodeCache, logger?: Logger) => (hashable: K, val: T): P.Either<Error, T> => {
    return P.Either.encase(() => hasher(hashable))
        .map(R.pipe(
            (key: string) => cache.set(key, val),
            R.ifElse(
                R.equals(true),
                (k) => logger?.debug(`setItemToCache: success`, {item: hashable}),
                (k) => logger?.error(`setItemToCache: failed`, {item: hashable})
            )
        ))
        .map(R.always(val))
        .ifLeft(err => logger?.error(`setItemToCache: failed`, {item: hashable, error: err}));
};

const setManyItemsToCache = <K, T>(hasher: Hasher<K>) => (cache: nodeCache, logger?: Logger) => (entries: [ K, T ][]): P.Either<Error, T>[] => {
    return entries.map(([ k, v ]) => setItemToCache<K, T>(hasher)(cache)(k, v));
};

export const createMemoryCache = <K, T>(itemHasher: Hasher<K>) => (cache: nodeCache, logger?: Logger): KeyValueCache<K, T> => {

    return {
        _cache: cache,
        _itemHasher: itemHasher,
        get: getItemFromCache<K, T>(itemHasher)(cache, logger),
        set: setItemToCache<K, T>(itemHasher)(cache, logger),
        setMany: setManyItemsToCache<K, T>(itemHasher)(cache, logger),
        getMany: getManyItemsFromCache<K, T>(itemHasher)(cache, logger),
    };
};