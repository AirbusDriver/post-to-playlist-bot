import { SearchForSongPostsTask, SearchSongPostsDto }         from '@/music/searchForSongPosts.root';
import { createErrorResponse, createResponse, LinksResponse } from '@/shared/apiResponses';
import { Request, Response }                                  from 'express';
import * as R                                                 from 'ramda';


export { searchForSongPostsRoot, Env } from '@/music/searchForSongPosts.root';


export const transformRequest = (req: Request): Partial<SearchSongPostsDto> => {

    const evolved = R.evolve({
        limit: R.pipe(parseInt, R.ifElse(isNaN, R.always(50), R.identity)),
        time: R.toLower
    }, req.query);

    return R.mergeAll([ req.query, evolved ]);
};

export const searchSongPostJsonController = (task: SearchForSongPostsTask) => (req: Request, res: Response) => {

    const validDto = transformRequest(req) as SearchSongPostsDto;

    const links: LinksResponse = {
        self: req.originalUrl,
        next: null,
        previous: null,
    };

    return task(validDto)
        .map(resp => createResponse(resp, links))
        .ifRight(resp => res.json(resp))
        .mapLeft(createErrorResponse)
        .ifLeft(err => res.status(err.error.code).json(err))
        .run();

};


