import { getClient }                                    from '@/infra/reddit';
import { searchSongPostJsonController }                 from '@/music/searchForSongPosts.controller.json.express';
import { searchForSongPostsRoot }                       from '@/music/searchForSongPosts.root';
import { searchForTrackInfoControllerJsonExpress }      from '@/music/searchForTrackInfo.controller.json.express';
import { getSongPostsFromSubredditTaskRoot }            from '@infra/reddit/songPosts';
import { createSearchService, getAuthorizedClientTask } from '@infra/spotify';
import getRootLogger                                    from '@shared/logger';
import { json, Router }                                 from 'express';
import { EitherAsync }                                  from 'purify-ts';


const logger = getRootLogger().child({module: 'music-api'});


export const musicRouterFactoryTask = EitherAsync<any, Router>(async ctx => {
    const router = Router();

    router.use(json());

    const redditClient = await ctx.liftEither(getClient());

    const spotifyService = await ctx.fromPromise(getAuthorizedClientTask
        .ifLeft(console.error)
        .run());

    const searchService = createSearchService(spotifyService);


    // Controllers

    const searchForSongPostsController = searchSongPostJsonController(searchForSongPostsRoot({
        spotifySearch: searchService,
        getSongPosts: getSongPostsFromSubredditTaskRoot(redditClient)
    }));


    // Routes

    router.get('/song-posts', async (req, res) => {

        await searchForSongPostsController(req)
            .ifRight(resp => res.json(resp))
            .ifLeft(err => res.status(err.error.code).json(err))
            .void()
            .run();
    });

    router.post('/search/tracks', async (req, res) => {

        logger.info(req.body);

        await searchForTrackInfoControllerJsonExpress({searchService})(req)
            .ifRight(resp => res.json(resp))
            .ifLeft(err => res.status(500).json(err)).run();

    });

    return router;

});

export default musicRouterFactoryTask;