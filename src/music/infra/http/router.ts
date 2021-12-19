import searchForSongPostsUseCase from '@/music/useCases/searchForSongPosts';
import { getSearchServiceTask }  from '@infra/spotify/adapters/searchService';
import {
    json,
    Router
}                                from 'express';
import { EitherAsync }           from 'purify-ts';
import {
    searchForManyTracksControllerJson,
    searchForSingleTrackControllerJson,
    searchSongPostJsonController
}                                from './controllers';


export const musicRouterFactoryTask = EitherAsync<any, Router>(async ctx => {
    const router = Router();

    router.use(json());

    const searchService = await ctx.fromPromise(getSearchServiceTask.run());

    router.get('/song-posts',
        searchSongPostJsonController(searchForSongPostsUseCase));

    router.post('/search/tracks', searchForManyTracksControllerJson(searchService));

    router.get('/search/tracks', searchForSingleTrackControllerJson(searchService));

    return router;

});

export default musicRouterFactoryTask;