import { EitherAsync, fromPromiseEA, Just, Left, liftEA, liftMA, Maybe, Nothing, Right } from '@fns/purifyUtils';
import { Either, MaybeAsync }                                                            from 'purify-ts';
import * as P                                                                            from 'purify-ts';
import readline, { Interface }                                                           from 'readline';
import * as R                                                                            from 'ramda';


export { Interface };


export type WithReadlineInterfaceTaskIO<T = void> = (iface: Interface) => T;


/**
 * write with an interface
 *
 * @param {string} s the string to print
 * @param {string} trailing the string to end the line with. Defaults to new line
 * @returns {(iface) => void} - a function that takes an interface
 */
export const printIO: (s: string, trailing?: string) => WithReadlineInterfaceTaskIO = (s, trailing = '\n') => iface => {
    iface.write(`${ s }${ trailing }`);
};


type PrintWithInterfaceSafeIO = (s: string, trailing?: string) => (printer: Interface) => Either<Error, string>;
export const printWithInterfaceSafeIO: PrintWithInterfaceSafeIO = (s, trailing) => printer => {
    return Either.encase(() => {
        printIO(s, trailing)(printer);
        return s;
    });
};


// Promisified Interface Functions

export const promisePrompt = (prompt: string) => (iFace: Interface) => {
    return new Promise<string>((res, rej) => {
        try {
            iFace.question(prompt, res);
        }
        catch (e) {
            rej(e);
        }
    });
};

type MaybeAsyncPromptSafeIO = (prompt: string) => WithReadlineInterfaceTaskIO<MaybeAsync<string>>
export const maybeAsyncPrompt: MaybeAsyncPromptSafeIO = (prompt: string) =>
    (iFace: Interface) =>
        MaybeAsync<string>(() => promisePrompt(prompt)(iFace))
            .chain(s => s.length > 0 ? liftMA(Just(s)) : liftMA<string>(Nothing));

// Interface apply functions

type ApplyInterfaceSyncIO = (ifaceFactory: () => Interface) => <T>(task: WithReadlineInterfaceTaskIO<T>) => T

export const applyInterfaceSyncIO: ApplyInterfaceSyncIO = ifaceFactory => task => {

    const rlIface = ifaceFactory();

    try {
        return task(rlIface);
    }
    catch (e) {
        rlIface.close();
        throw e;
    }
};

export type PromptWithInterfaceTaskIO = (prompt: string) => WithReadlineInterfaceTaskIO<Promise<string>>

export const promptWithInterfaceTaskIO: PromptWithInterfaceTaskIO = prompt => iface => {
    return new Promise<string>((resolve) => {
        iface.question(
            prompt,
            resolve,
        );
    });
};


// Concrete interface factories

export const stdInOutIfaceFactory = () => readline.createInterface(process.stdin, process.stdout);

export const applyWStdInOutIO = applyInterfaceSyncIO(stdInOutIfaceFactory);
