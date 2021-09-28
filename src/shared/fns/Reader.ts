export class Reader<Tinject, Tresult> {
    private readonly __fn: (inj: Tinject) => Tresult;


    constructor(fn: (inj: Tinject) => Tresult) {
        this.__fn = fn;
    }

    static of<Tinject, Tresult>(fn: (inj: Tinject) => Tresult): Reader<Tinject, Tresult> {
        return new Reader<Tinject, Tresult>(fn);
    }

    runReader(inj: Tinject): Tresult {
        return this.__fn(inj);
    }

    map<TNew>(fn: (res: Tresult) => TNew): Reader<Tinject, TNew> {
        return Reader.of(c => {
            return fn(this.runReader(c));
        });
    }

    chain<TNew>(fn: (res: Tresult) => Reader<Tinject, TNew>): Reader<Tinject, TNew> {
        return Reader.of(
            inj => fn(this.runReader(inj)).runReader(inj)
        );
    }
}

export const reader = <U, Y, T extends (inj: U) => Y>(x: T) => Reader.of(x);