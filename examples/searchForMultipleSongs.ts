/**
 *
 * When calling out to track search service, any recently searched TrackInfo items
 * will be cached in memory. Unless you're planing on doing your own rate limiting,
 * use the searchService to offload from Spotify API so you arent pressed up against
 * rate limit errors
 *
 */
import { createSearchService, getAuthorizedClientCache } from '@/infra/spotify';
import getSpotifyLogger                                  from '@infra/spotify/logger';
import songMemoryCacheCacheIO                            from '@infra/spotify/search/trackCache';
import { stringifyJsonUnsafe }                           from '@shared/fns/json';
import { EitherAsync }                                   from 'purify-ts';


const prog = EitherAsync<any, any>(async ctx => {

    const client = await ctx.fromPromise(getAuthorizedClientCache.getLazy());

    const searchService = createSearchService(client);

    getSpotifyLogger().info('service started');

    const songsDtos = [
        {title: 'cowboy dan', artist: 'modest mouse'},
        {title: 'decimation', artist: 'oh sleeper'},
        {title: 'counting worms', artist: 'knocked loose'},
        {title: 'zzzzpooperofoer', artist: 'duperscooper'}
    ];

    const cache = songMemoryCacheCacheIO.getLazy(); // you should never need to interact with this directly

    const initStats = cache.cache.getStats();

    const task = EitherAsync(async ctx => {
        const start = Date.now();
        const result = await searchService.searchForManyTracks({tracks: songsDtos})
            .run();
        const stop = Date.now();

        return {
            results: result,
            time: stop - start,
        };
    });

    const result_01 = await task.run();
    const result_02 = await task.run();
    const result_03 = await task.run();

    const results = {
        run_01: result_01,
        run_02: result_02,
        run_03: result_03,
        initStats,
        stats: cache.cache.getStats()
    };

    console.log(stringifyJsonUnsafe(2)(results));

});


prog.run();

/**
 ...
 {
  "run_01": {
    "results": 3,
    "time": 1394
  },
  "run_02": {
    "results": 3,
    "time": 3
  },
  "run_03": {
    "results": 3,
    "time": 2
  },
  "initStats": {
    "hits": 6,
    "misses": 3,
    "keys": 3,
    "ksize": 111,
    "vsize": 9897
  },
  "stats": {
    "hits": 6,
    "misses": 3,
    "keys": 3,
    "ksize": 111,
    "vsize": 9897
  }
}

 */