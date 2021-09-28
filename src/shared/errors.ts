import * as P from "purify-ts";

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


export {ValueObjectPropsError} from "./ValueObject";
