import { SearchService }                       from '@infra/ports';
import { createErrorResponse, createResponse } from '@shared/apiResponses';
import { Request }                             from 'express';
import { EitherAsync }                         from 'purify-ts';


export type SearchForTrackControllerEnv = {
    searchService: SearchService;
}

type SearchForTrackInfoControllerJsonExpress = (env: SearchForTrackControllerEnv) => (req: Request) => EitherAsync<any, any>

export const searchForTrackInfoControllerJsonExpress: SearchForTrackInfoControllerJsonExpress = env => req => {
    return EitherAsync(async ctx => {

        return ctx.fromPromise(env.searchService.searchForManyTracks(req.body as any)
            .mapLeft(createErrorResponse)
            .map(r => createResponse(r, {self: req.originalUrl})).run());
    });
};