import { InvalidArgumentError } from 'commander';
import fs                       from 'fs';
import * as P                   from 'purify-ts';
import { ifElse }               from 'ramda';
import * as R                   from 'ramda';


export { createCommand, createOption, createArgument, Command } from 'commander';


export type CommanderParser<T, U> = (item: T, prev?: T) => U

export type Validator<T> = (arg: string) => T;

/**
 * Throw a commander.InvalidArgumentError from the message or message factory provided. This
 * exits the cliCommands command parser
 */
export const invalid = (msgFn: ((arg: string) => string) | string) => (arg: string) => {
    const msg = typeof msgFn === 'function' ? msgFn(arg) : msgFn as string;

    throw new InvalidArgumentError(msg);
};


export const validatePathExists: CommanderParser<string, string> = R.pipe(
    R.ifElse(
        fs.existsSync,
        P.identity,
        invalid(p => `${ p } does not exist`))
);

export const intOrInvalid: Validator<number> = R.pipe(
    parseInt,
    ifElse(
        isNaN,
        invalid(n => `expected a number, received: ${ n }`),
        R.identity));


/** Validate an array from items, and after validation, concat with previous values */
export const accumWith = <T>(validator: Validator<T>) => (path: string, paths: T[]): T[] => R.concat(paths, [ validator(path) ]);


