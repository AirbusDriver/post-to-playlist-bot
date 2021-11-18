import { SpotifyItem, TrackInfo }                   from '@/music/types';
import CacheIO                                      from '@fns/CacheIO';
import getSpotifyLogger                             from '@infra/spotify/logger';
import { createMemoryCache, Hasher, KeyValueCache } from '@shared/memoryCache';
import nodeCache                                    from 'node-cache';
import * as R                                       from 'ramda';



const logger = getSpotifyLogger().child({module: 'spotify/search/trackCache'})


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

export type SpotifyTrackItemCache = KeyValueCache<TrackInfo, SpotifyItem<TrackInfo>[]>;

export const songMemoryCacheCacheIO: CacheIO<KeyValueCache<TrackInfo, SpotifyItem<TrackInfo>[]>> = CacheIO.of(() => {
    const songCache = new nodeCache({stdTTL: 60 * 180, maxKeys: 10000, forceString: true});

    return createMemoryCache<TrackInfo, SpotifyItem<TrackInfo>[]>(hashTrack)(songCache, logger);
});


export default songMemoryCacheCacheIO;

