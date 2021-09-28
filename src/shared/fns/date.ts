import * as P from "purify-ts";
import * as R from "ramda";

/**
 * Return true if provided string can be parsed into Date
 *
 * @param s iso string
 */
export const isDateString = (s: string) => {
    return R.allPass([
        R.is(String),
        R.pipe(R.split(""), R.length, R.equals(24)),
        s => {
            return (new Date(Date.parse(s))).toJSON() === s;
        }
    ])(s);
};
export const parseDateStringSafe: (dateStr: string) => P.Either<string, Date> = R.ifElse(isDateString,
    s => P.Right(new Date(Date.parse(s))),
    e => P.Left(`invalid isoString: ${e}`)
);