import nodeCache from 'node-cache';
import * as P    from 'purify-ts';
import * as R    from 'ramda';


export type KeyValueCache<K, T> = Readonly<{
    cache: nodeCache;
    itemHasher: (item: K) => string;
    get(hashable: K): P.Maybe<T>;
    getMany(hashable: K[]): P.Maybe<T>[]
    set(hashable: K, val: T): P.Either<Error, T>;
    setMany(info: [ K, T ][]): P.Either<Error, T>[];
}>

export type Hasher<T> = (item: T) => string;

const getItemFromCache = <K, T>(hasher: Hasher<K>) => (cache: nodeCache) => (hashable: K): P.Maybe<T> => {
    return P.Either.encase(() => hasher(hashable))
        .ifLeft(_ => console.log(`could not hash item`))
        .ifLeft(console.error)
        .toMaybe()
        .chainNullable(key => cache.get<T>(key));
};

const getManyItemsFromCache = <K, T>(hasher: Hasher<K>) => (cache: nodeCache) => (hashables: K[]): P.Maybe<T>[] => {
    return hashables.map(item => getItemFromCache<K, T>(hasher)(cache)(item));
};

const setItemToCache = <K, T>(hasher: Hasher<K>) => (cache: nodeCache) => (hashable: K, val: T): P.Either<Error, T> => {
    return P.Either.encase(() => hasher(hashable))
        .map(R.pipe(
            (key: string) => cache.set(key, val),
            R.ifElse(
                R.equals(true),
                (k) => console.debug(`setItemToCache: ${ k } success`),
                (k) => console.error(`setItemToCache: ${ k } failed`)
            )
        ))
        .map(R.always(val))
        .ifLeft(_ => console.error(`could not hash item`))
        .ifLeft(console.error);
};

const setManyItemsToCache = <K, T>(hasher: Hasher<K>) => (cache: nodeCache) => (entries: [ K, T ][]): P.Either<Error, T>[] => {
    return entries.map(([ k, v ]) => setItemToCache<K, T>(hasher)(cache)(k, v));
};

export const createMemoryCache = <K, T>(itemHasher: Hasher<K>) => (cache: nodeCache): KeyValueCache<K, T> => {
    return {
        cache,
        itemHasher,
        get: getItemFromCache<K, T>(itemHasher)(cache),
        set: setItemToCache<K, T>(itemHasher)(cache),
        setMany: setManyItemsToCache<K, T>(itemHasher)(cache),
        getMany: getManyItemsFromCache<K, T>(itemHasher)(cache),
    };
};