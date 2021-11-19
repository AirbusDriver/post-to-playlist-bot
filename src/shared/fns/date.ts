import * as P                           from "purify-ts";
import { always, Just, Maybe, Nothing } from "purify-ts";
import * as R                           from "ramda";


export const parseDateSafe: (s: string) => Maybe<Date> = s => P.Maybe.fromNullable(s)
    .map(Date.parse)
    .chain(R.ifElse(
        isNaN,
        always(Nothing),
        (n: number) => Just(new Date(n))));

/**
 * Return true if provided string can be parsed into Date
 *
 * @param s iso string
 */
export const isDateString = (s: string) => {
    return parseDateSafe(s).isJust();
};
