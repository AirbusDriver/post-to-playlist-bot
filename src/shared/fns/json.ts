import { CodecError } from "@shared/errors";
import * as P         from "purify-ts";
import { Codec }      from "purify-ts";


export type JsonTransform = (this: any, key: any, value: any) => any;

export const stringifyJsonSafe = (space = 2, replacer?: JsonTransform) =>
    (obj: unknown) =>
        P.Either.encase(
            () => JSON.stringify(obj, replacer, space)
        );

export const stringifyJsonUnsafe = (space = 2, replacer?: JsonTransform) =>
    (obj: unknown) => JSON.stringify(obj, replacer, space);


export const parseJsonSafe = (reviver?: JsonTransform) =>
    (text: string) =>
        P.Either.encase<Error, unknown>(() => JSON.parse(text, reviver));


type ParseJsonWithCodec = <T>(ctx: { codec: Codec<T>, reviver?: JsonTransform }) => (jsonString: string) => P.Either<Error | CodecError, T>

export const parseJsonWithCodec: ParseJsonWithCodec = <T>(ctx: {
    codec: Codec<T>,
    reviver?: JsonTransform,
}) => str =>
    P.Right(str)
        .chain((parseJsonSafe(ctx.reviver)))
        .chain(
            v => ctx.codec.decode(v)
                .mapLeft(CodecError.fromErrorString)
        );

