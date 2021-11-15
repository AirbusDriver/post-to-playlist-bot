import { ApplicationErrorNames, RawError } from '@shared/errors';
import * as R                              from 'ramda';


export type LinksResponse = {
    self: string | null
    next: string | null;
    previous: string | null;
}


export interface ApiResponse<T> {
    data: T;
    links: LinksResponse;
}


export type ApiError = {
    code: number;
    title?: string;
    detail?: string;
}


export interface ApiErrorResponse {
    error: ApiError;
}


export const createResponse = <T>(data: T, links: Partial<LinksResponse> = {}): ApiResponse<T> => ({
    data,
    links: {
        self: R.propOr(null, 'self', links),
        next: R.propOr(null, 'next', links),
        previous: R.propOr(null, 'previous', links),
    }
});

const toCode = <T extends ApplicationErrorNames>(s: T) => {
    let out: number;

    switch (s) {
        case ApplicationErrorNames.BAD_REQUEST:
            out = 400;
            break;
        default:
            out = 500;
    }
    return out;

};

const makeApiError = (error: RawError<any>, code?: number): ApiError => {
    return {
        code: code || toCode(error.name),
        detail: error.message,
        title: error.name,
    };
};

export const createErrorResponse = <T extends RawError<any>>(error: RawError<any>, code?: number): ApiErrorResponse => {
    const error_ = makeApiError(error, code);

    return {
        error: {
            ...error_
        }
    };
};