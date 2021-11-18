import CacheIO                       from '@fns/CacheIO';
import { createMemoryCache, Hasher } from '@shared/memoryCache';
import { SpotifyItem, TrackInfo }    from '@/music/types';
import nodeCache                     from 'node-cache';
import * as R                        from 'ramda';


const trackHashTransforms = {
    title: R.pipe(R.toUpper, R.trim),
    artist: R.pipe(R.toUpper, R.trim)
};

const hashTrack: Hasher<TrackInfo> = (track: TrackInfo): string => {
    return R.pipe(
        (x: TrackInfo) => x,
        R.evolve(trackHashTransforms),
        R.toPairs,
        R.sortBy(x => x[0]),
        R.flatten,
        R.join('-'),
    )(track);
};


export const songMemoryCacheCacheIO = CacheIO.of(() => {
    const songCache = new nodeCache({stdTTL: 60 * 180, maxKeys: 10000, forceString: true});

    return createMemoryCache<TrackInfo, SpotifyItem<TrackInfo>[]>(hashTrack)(songCache);
});


export default songMemoryCacheCacheIO;
