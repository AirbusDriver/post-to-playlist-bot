import { getClient }                          from '@/infra/reddit';
import { searchForSingleTrackControllerJson } from '@/music/http/controllers/searchForSingleTrack.controller.json';
import { getSongPostsFromSubredditTaskRoot }  from '@infra/reddit/songPosts';
import { getSearchServiceTask }               from '@infra/spotify/adapters/searchService';
import getRootLogger                          from '@shared/logger';
import { json, Router }                       from 'express';
import { EitherAsync }                        from 'purify-ts';
import { searchForSongPostsRoot }             from '../searchForSongPosts.root';
import { searchForManyTracksControllerJson }  from './controllers/searchForManyTracks.controller.json';
import { searchSongPostJsonController }       from './controllers/searchForSongPosts.controller.json';


const logger = getRootLogger().child({module: 'music-api'});


export const musicRouterFactoryTask = EitherAsync<any, Router>(async ctx => {
    const router = Router();

    router.use(json());

    const redditClient = await ctx.liftEither(getClient());

    const searchService = await ctx.fromPromise(getSearchServiceTask.run());


    router.get('/song-posts',
        searchSongPostJsonController(searchForSongPostsRoot({
            spotifySearch: searchService,
            getSongPosts: getSongPostsFromSubredditTaskRoot(redditClient)
        })));

    router.post('/search/tracks', searchForManyTracksControllerJson(searchService));

    router.get('/search/tracks', searchForSingleTrackControllerJson(searchService));

    return router;
    
});

export default musicRouterFactoryTask;