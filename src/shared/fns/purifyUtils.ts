import { always, Either, EitherAsync, Maybe, MaybeAsync } from 'purify-ts';


export {
    always, Either, EitherAsync, Right, Left, Maybe, Just, Nothing, NonEmptyList, curry, DecodeError, Tuple
} from 'purify-ts';

export { pipe } from 'ramda';

// Type helpers

/** extract the Right type of an Either */
export type GetRight<T extends Either<any, any>> = T extends Either<infer L, infer R> ? R : never;

/** extract the Left type of an Either */
type GetLeft<T extends Either<any, any>> = T extends Either<infer L, infer R> ? L : never;

/** extract the Just type of a Maybe */
type GetJust<T extends Maybe<any>> = T extends Maybe<infer J> ? J : never;


// Maybe utils

export const chainM = <J, J2>(fn: (x: J) => Maybe<J2>) => (maybe: Maybe<J>) => maybe.chain(fn);

export const mapM = <J, J2>(fn: (x: J) => Maybe<J2>) => (maybe: Maybe<J>) => maybe.map(fn);


// MaybeAsync Utils

export const liftMA = MaybeAsync.liftMaybe;

export const fromPromiseMA = MaybeAsync.fromPromise;


// Either utils

export const mapE = <L, R, R2>(fn: (x: R) => R2) => (either: Either<L, R>) => either.map(fn);

export const chainE = <L, R, L2, R2>(fn: (x: R) => Either<L2, R2>) => (either: Either<L, R>) => either.chain(fn);


// EitherAsync Utils

export const liftEA = EitherAsync.liftEither;

export const fromPromiseEA = EitherAsync.fromPromise;

