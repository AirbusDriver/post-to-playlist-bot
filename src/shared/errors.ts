import * as P from 'purify-ts';


// todo: remove this and its usages in favor of the primitive error string that can be wrapped up
/**
 * An Error representing a failed Codec parse operation
 */
export class CodecError extends Error {
    protected constructor(errMsg: string, public readonly err: P.DecodeError) {
        super(errMsg);
    }

    static fromErrorString(str: string) {
        return new CodecError(str, P.parseError(str));
    }
}


// todo: move this to all controllers
export enum ApplicationErrorNames {
    BAD_REQUEST = 'BAD_REQUEST',
    SERVICE_ERROR = 'SERVICE_ERROR',
    CONFIG = 'CONFIG',
    UNKNOWN = 'UNKNOWN',
}


export interface RawError<T extends string> {
    name: T;
    orig: any,
    message: string;
}


export type ApplicationError = RawError<ApplicationErrorNames>
