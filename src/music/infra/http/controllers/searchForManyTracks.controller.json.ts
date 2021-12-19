import { SearchForManyTracksTaskResponse, SearchService }                     from '@/music/ports';
import { ApiErrorResponse, ApiResponse, createErrorResponse, createResponse } from '@shared/apiResponses';
import { Request, Response }                                                  from 'express';
import { Either }                                                             from 'purify-ts';


type SearchForTrackInfoControllerJsonExpress =
    (searchService: SearchService) => (req: Request, res: Response) => Promise<Either<ApiErrorResponse, ApiResponse<SearchForManyTracksTaskResponse>>>

export const searchForManyTracksControllerJson: SearchForTrackInfoControllerJsonExpress = searchService => (req, res) => {

    return searchService.searchForManyTracks(req.body as any)
        .map(r => createResponse(r, {self: req.originalUrl}))
        .ifRight(resp => res.json(resp))
        .mapLeft(createErrorResponse)
        .ifLeft(err => res.status(err.error.code).json(err))
        .run();
};