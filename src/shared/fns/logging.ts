type ConsoleOp<T> = (msg: T | string) => void;

export type Logger<T = any> = {
    log: ConsoleOp<T>;
    debug: ConsoleOp<T>;
    info: ConsoleOp<T>;
    trace: ConsoleOp<T>;
    error: ConsoleOp<T>;
}

const noOp = (...args: any[]) => () => {
    return;
};

export const noOpLogger: Logger = {
    debug: noOp,
    error: noOp,
    info: noOp,
    log: noOp,
    trace: noOp
};

export const consoleLogger: Logger = console