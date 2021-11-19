// noinspection JSValidateJSDoc

import events                  from "events";
import { Either, Left, Right } from "purify-ts";


enum CacheEvents {
    CLEARED = "CLEARED",
    SET = "SET",
    RUN = "RUN",
    GET_CACHE = "GET_CACHE"
}


const CACHE_EVENT = Symbol("CACHE_EVENT");
export type CacheEvent<T> = {
    event: CacheEvents,
    val: T | "not ran",
    descr: string;
}


/**
 * Wrap a task that stores the result of the task for quick lookups later.
 *
 *
 * @example
 *
 * ```
 * const aTask = (x: number) => Promise.resolve(x * x)
 *
 * const taskCache = CacheIO.of(() => aTask(5))
 *
 * const useCache = async () => {
 *     return await taskCache.getLazy()
 * } // useCache() => <Promise.resolve>(25)
 * ```
 */
export class CacheIO<T> {
    static CacheEvents = CacheEvents;
    public description: string;
    protected _emitter = new events.EventEmitter();
    protected _value: T | undefined = undefined;
    private readonly __fn: () => T;
    private __ran = false;
    private _interval: ReturnType<typeof setInterval> | null = null;

    // private _clearIfs: ((x: T) => boolean)[] = [];

    private constructor(fn: () => T, descr = "CacheIO") {
        this.__fn = fn;
        this.description = descr;
    }

    static of<R>(fn: () => R): CacheIO<R> {
        return new CacheIO<R>(fn);
    }

    /**
     * Description for the loggable events.
     *
     * @param {string} str
     * @returns {this}
     */
    setDescription(str: string): this {
        this.description = str;
        return this;
    }

    hasRun(): boolean {
        return this.__ran;
    }

    /**
     * Get the result of the previous run or run for the first time
     *
     * @returns {T} The result of the task
     */
    getLazy(): T {
        if (!this.__ran) {
            const result = this.__fn();
            this.emit(CacheEvents.RUN, result);
            this.set(result);
            return result;
        } else {
            this.emit(CacheEvents.GET_CACHE);
            return this._value as T;
        }
    }

    // /**
    //  * Add a validation hook that clears the cache if the predicate returns `true`
    //  * @param {(x: T) => boolean} pred
    //  */
    // clearIf(pred: (x: T) => boolean) {
    //     this._clearIfs.push(pred);
    // }

    /**
     * Explicitly get the value of the cache
     * @param {T} x
     * @returns {this}
     */
    set(x: T): this {
        this.__ran = true;
        this._value = x;
        this.emit(CacheEvents.SET);
        return this;
    }

    /**
     * Return the result of a function over the value of this cache
     * @param {(x: T) => R} fn
     * @returns {R}
     */
    map<R>(fn: (x: T) => R): R {
        return fn(this.getLazy());
    }

    /**
     * Return a Cache from the result of another Cache of a function that accepts the value of
     * this as its argument
     *
     * @param {CacheIO<(x: T) => T2>} other
     * @returns {CacheIO<T2>}
     */
    ap<T2>(other: CacheIO<(x: T) => T2>): CacheIO<T2> {
        return CacheIO.of(() => other.getLazy()(this.getLazy()));
    }

    /**
     * Perform an effect with the value of the cache and return the value. Useful for chaining the results.
     * @param {(x: T) => unknown} fn
     * @returns {T}
     */
    tap<R>(fn: (x: T) => R): T {
        this.map(fn);
        return this.getLazy();
    }

    /**
     * Clear the value of the cache forcing it to be re-run.
     * @returns {this}
     */
    clear(): this {
        this.emit(CacheEvents.CLEARED);
        this.__ran = false;
        this._value = undefined;
        return this;
    }

    /**
     * Listen for events on the cache. Mostly useful for observations and logging
     * @param {(event: CacheEvent<T>) => void} handler
     * @returns {this}
     */
    on(handler: (event: CacheEvent<T>) => void): this {
        this._emitter.on(CACHE_EVENT, handler);
        return this;
    }

    /**
     * Remove a listener on the cache
     * @param handler
     * @returns {this}
     */
    off(handler: any): this {
        this._emitter.off(CACHE_EVENT, handler);
        return this;
    }

    /**
     * Begin clearing the cache on an interval of miliseconds. Will return an Either<string, Node.Timer> containing
     * a possible error message from malformed `mili` input.
     * @param {number} mili
     * @returns {Either<string, ReturnType<typeof setInterval>>}
     */
    startClearInterval(mili: number): Either<string, ReturnType<typeof setInterval>> {
        if (mili < 100) {
            return Left("must be a positive number >= 100");
        }
        if (this._interval != null) {
            this.stopClearInterval();
        }
        this._interval = setInterval(this.clear, mili);
        return Right(this._interval);
    }

    /**
     * Stop the clearing interval
     * @returns {this}
     */
    stopClearInterval(): this {
        if (this._interval) {
            clearInterval(this._interval);
        }
        return this;
    }

    protected emit(eventName: CacheEvents, val?: T): this {
        const event: CacheEvent<T> = {
            event: eventName,
            val: val || this._inspectVal(),
            descr: this.description,
        };
        this._emitter.emit(CACHE_EVENT, event);
        return this;
    }

    // todo: reimplement
    // private _checkClearIfs(val: T): boolean {
    //     return R.any(R.identity, this._clearIfs.map(fn => fn(val)));
    // }

    /**
     * Loggable value of the `getLazy()` result that explicitly shows whether or not the potential for an
     * `undefined` value is the the result of the task
     * @returns {CacheEvent<T>['val']}
     * @private
     */
    private _inspectVal(): CacheEvent<T>["val"] {
        if (this.hasRun()) return this._value as T;
        return "not ran";
    }

}


export default CacheIO;