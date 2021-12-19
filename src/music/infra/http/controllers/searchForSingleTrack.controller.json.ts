import { SearchForTrackCommandResponse, SearchService, SearchTrackDTO }       from '@/music/ports';
import { GetRight }                                                           from '@fns';
import { ApiErrorResponse, ApiResponse, createErrorResponse, createResponse } from '@shared/apiResponses';
import { PromiseValue }                                                       from '@shared/utils/utilityTypes';
import { Request, Response }                                                  from 'express';
import { isNaN }                                                              from 'lodash';
import * as P                                                                 from 'purify-ts';
import * as R                                                                 from 'ramda';
import { ifElse }                                                             from 'ramda';


type SearchTrackJsonResponse = ApiResponse<GetRight<PromiseValue<SearchForTrackCommandResponse>>>

export const searchForSingleTrackControllerJson = (searchService: SearchService) =>
    (req: Request, res: Response): Promise<P.Either<ApiErrorResponse, SearchTrackJsonResponse>> => {

        const transform = R.evolve({
            limit: R.pipe(parseInt, ifElse(isNaN, R.always(5), R.identity)) as (s: string) => number,
            offset: R.pipe(parseInt, ifElse(isNaN, R.always(0), R.identity)) as (s: string) => number,
        });

        const defaults: Partial<SearchTrackDTO> = {
            params: {
                limit: 5,
                offset: 0,
            }
        };

        const todto: (req: Request) => SearchTrackDTO = req => P.Maybe.of(req.query)
            .map(transform)
            .map(R.assoc('params', R.__))
            .map(R.assocPath([ 'track', 'artist' ], req.query.artist))
            .map(R.assocPath([ 'track', 'title' ], req.query.title))
            .map(R.mergeRight(defaults))
            .extract() as SearchTrackDTO;

        return searchService.searchForTrack(todto(req))
            .mapLeft(createErrorResponse)
            .ifLeft(err => res.status(err.error.code).json(err))
            .map(resp => createResponse(resp, {self: req.originalUrl}))
            .ifRight(resp => res.json(resp))
            .run();
    };


//
// type UseCase<Dto, L, R> = (dto: Dto) => EitherAsync<L, R>
//
// // todo: experimental for now, a links mapper needs to be made up Resp -> Req -> Links
// const controller = <T extends UseCase<Dto, any, any>, Dto = Parameters<T>>(reqTrans: (req: Request) => Dto) =>
// (task: T) => (req: Request, res: Response) => { const dto = reqTrans(req);  return task(dto);

