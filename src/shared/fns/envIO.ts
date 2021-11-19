import * as P    from "purify-ts";
import { Maybe } from "purify-ts";
import * as R    from "ramda";


export type GetEnvIO = () => P.Maybe<typeof process.env>
export const safeGetEnvIO: GetEnvIO = () => {
    return P.Maybe.fromNullable({...process.env});
};


type GetEnvOrThrowIO = <T>(err?: unknown) => () => typeof process.env | never;
/**
 * Throw any error if the env cannot be loaded from process.env
 *
 * @param err - the error to throw, can be anything
 */
export const getEnvOrThrowIO: GetEnvOrThrowIO = (err?) => () =>
    safeGetEnvIO()
        .ifNothing(() => {
            P.Maybe.of(err)
                .alt(P.Just(new Error("failed to load env")))
                .map((e) => {
                    throw e;
                });
        })
        .extract() as typeof process.env;
/**
 * Return a Record(string, string) with the keys remapped from a keyMap and the values
 * from the original record. This is useful for renaming possible keys from an env and
 * mapping them to a domain specific record. This does not guarantee membership
 *
 * @param {Map<string, string>} keyMap - a Map of input -> renamed keys
 * @param {Record<string, string | undefined>} record - record with original key value pairs
 * @return {Record<string, string>} - a re-keyed record
 */
export const remapKeys: (keyMap: Map<string, string>) => (record: Record<string, string | undefined>) => Record<string, string> =
    (keyMap) => (record) => {

        const entries = [ ...keyMap.entries() ];

        const reducer = (acc: Record<string, string>, val: [ string, string ]): Record<string, string> => {

            const [ envKey, configKey ] = val;

            return Maybe.fromNullable(R.prop(envKey, record))
                .map(v => R.assoc(configKey, v, acc))
                .toEither(acc)
                .extract();
        };
        return R.reduce(reducer, {}, entries);
    };