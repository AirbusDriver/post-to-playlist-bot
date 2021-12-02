import { searchForSingleTrackControllerJson } from '@/music/http/controllers/searchForSingleTrack.controller.json';
import searchForSongPostsUseCase              from '@/music/useCases/searchForSongPosts';
import { getSearchServiceTask }               from '@infra/spotify/adapters/searchService';
import getRootLogger                          from '@shared/logger';
import { json, Router }                       from 'express';
import { EitherAsync }                        from 'purify-ts';
import { searchForManyTracksControllerJson }  from './controllers/searchForManyTracks.controller.json';
import { searchSongPostJsonController }       from './controllers/searchForSongPosts.controller.json';


const logger = getRootLogger().child({module: 'music-api'});


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