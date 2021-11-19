import { sleep }                                          from "@fns/delay";
import * as P                                             from "purify-ts";
import { always, Either, EitherAsync, Maybe, MaybeAsync } from "purify-ts";
import * as R                                             from "ramda";


export {
    always, Either, EitherAsync, Right, Left, Maybe, Just, Nothing, NonEmptyList, curry, DecodeError, Tuple
} from "purify-ts";

export { pipe } from "ramda";

// Type helpers

/** extract the Right type of an Either */
export type GetRight<T extends Either<any, any> | EitherAsync<any, any>> = T extends Either<infer L, infer R> ? R
    : T extends EitherAsync<infer L, infer RA>
        ? RA
        : never;

/** extract the Left type of an Either */
export type GetLeft<T extends Either<any, any> | EitherAsync<any, any>> = T extends Either<infer L, infer R> ? L
    : T extends EitherAsync<infer LA, infer RA>
        ? LA
        : never;
/** extract the Just type of a Maybe */
export type GetJust<T extends Maybe<any> | MaybeAsync<any>> = T extends Maybe<infer J> ? J
    : T extends MaybeAsync<infer JA>
        ? JA
        : never;


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


// Async Task reducers with delays

export type LeftRightAccum<L, R> = { lefts: readonly L[], rights: readonly R[] }

const leftLens = R.lensProp<LeftRightAccum<any, any>>("lefts");

const rightLens = R.lensProp<LeftRightAccum<any, any>>("rights");


/**
 *
 * Run an array of EitherAsync tasks and return an accumulator separated into
 * lefts and rights. This runs the tasks in parallel after the milliseconds
 * provided. If delay = 0, it will begins the tasks immediately. This is most
 * useful for running tasks that do not depend on each other.
 *
 * @param {number} delay
 * @return {<L, R>(tasks: EitherAsync<L, R>[]) => Promise<LeftRightAccum<L, R>>}
 */
export const runEAsyncsWithDelayPara = (delay = 0) => async <L, R>(tasks: P.EitherAsync<L, R>[]): Promise<LeftRightAccum<L, R>> => {
    return R.reduce(async (memo, t) => {

        await sleep(delay);

        const result = await t.run();

        const accum = await memo;

        const acc = result
            .map<LeftRightAccum<L, R>>(v => R.over(rightLens, R.append(v), accum))
            .mapLeft<LeftRightAccum<L, R>>(v => R.over(leftLens, R.append(v), accum))
            .extract();


        return acc as LeftRightAccum<L, R>;

    }, Promise.resolve({lefts: [], rights: []} as LeftRightAccum<L, R>), tasks);
};


/**
 *
 * Run an array of EitherAsync tasks and return an accumulator separated into
 * lefts and rights. This runs the tasks in sequence after the milliseconds
 * provided. If delay = 0, it will begins the tasks immediately. This is most
 * useful for rate limiting tasks that do not depend on each other.
 *
 * @param {number} delay
 * @return {<L, R>(tasks: EitherAsync<L, R>[]) => Promise<LeftRightAccum<L, R>>}
 */
export const runEAsyncsWithDelaySeq = (delay = 0) => async <L, R>(tasks: P.EitherAsync<L, R>[]): Promise<LeftRightAccum<L, R>> => {
    return R.reduce(async (memo, t) => {

        const accum = await memo;

        await sleep(delay);

        const result = await t.run();

        return result
            .map<LeftRightAccum<L, R>>(v => R.over(rightLens, R.append(v), accum))
            .mapLeft<LeftRightAccum<L, R>>(v => R.over(leftLens, R.append(v), accum))
            .extract();

    }, Promise.resolve({lefts: [], rights: []} as LeftRightAccum<L, R>), tasks);
};


/**
 *
 * Run an array of MaybeAsync tasks and return an array of the Just values.
 * This runs the tasks in sequence after the milliseconds
 * provided. If delay = 0, it will begins the tasks immediately. This is most
 * useful for rate limiting tasks that do not depend on each other.
 *
 * @param {number} delay
 * @return {<J>(tasks: MaybeAsync<J>[]) => Promise<J[]>}
 */
export const runMAsyncsWithDelaySeq = (delay = 0) => async <J>(tasks: P.MaybeAsync<J>[]): Promise<J[]> => {
    return R.reduce(async (memo, t) => {

        const accum = await memo;

        await sleep(delay);

        const result = await t.run();

        return result
            .map<J[]>(v => [ ...accum, v ] as J[])
            .orDefault(accum);

    }, Promise.resolve([] as J[]), tasks);
};


/**
 *
 * Run an array of MaybeAsync tasks and return an array of the Just values.
 * This runs the tasks in parallel after the milliseconds
 * provided. If delay = 0, it will begins the tasks immediately. This is most
 * useful for rate limiting tasks that do not depend on each other.
 *
 * @param {number} delay
 * @return {<J>(tasks: MaybeAsync<J>[]) => Promise<J[]>}
 */
export const runMAsyncWithDelayPara = (delay = 0) => async <J>(tasks: P.MaybeAsync<J>[]): Promise<J[]> => {
    return R.reduce(async (memo, t) => {

        await sleep(delay);

        const result = await t.run();

        const accum = await memo;

        return result
            .map<J[]>(v => [ ...accum, v ] as J[])
            .orDefault(accum);

    }, Promise.resolve([] as J[]), tasks);
};

