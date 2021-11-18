import {
    ApiErrorResponse,
    ApiResponse,
    createErrorResponse,
    createResponse,
    LinksResponse
}                                                                              from '@/shared/apiResponses';
import { Request }                                                             from 'express';
import { EitherAsync }                                                         from 'purify-ts';
import * as R                                                                  from 'ramda';
import { SearchForSongPostsTask, SearchSongPostsDto, SearchSongPostsResponse } from './searchForSongPosts.root';


export { searchForSongPostsRoot, Env } from './searchForSongPosts.root';


export const transformRequest = (req: Request): Partial<SearchSongPostsDto> => {

    const evolved = R.evolve({
        limit: R.pipe(parseInt, R.ifElse(isNaN, R.always(50), R.identity)),
        time: R.toLower
    }, req.query);

    return R.mergeAll([ req.query, evolved ]);
};

export const searchSongPostJsonController = (task: SearchForSongPostsTask) => (req: Request) => {
    return EitherAsync<ApiErrorResponse, ApiResponse<SearchSongPostsResponse>>(async ctx => {

        const validDto = transformRequest(req) as SearchSongPostsDto;

        const links: LinksResponse = {
            self: req.originalUrl,
            next: null,
            previous: null,
        };

        const result = await task(validDto)
            .map(resp => createResponse(resp, links))
            .mapLeft(createErrorResponse)
            .run();

        return ctx.liftEither(result);

    });
};


