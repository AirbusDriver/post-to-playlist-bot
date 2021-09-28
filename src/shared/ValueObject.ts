import * as P from "purify-ts";
import {inspect} from "util";

export class ValueObjectPropsError extends Error {
    protected constructor(msg: string, public readonly decodeError?: P.DecodeError) {
        super(msg);
    }

    static fromDecodeErrorString(decodeErr: string) {
        return new ValueObjectPropsError(decodeErr, P.parseError(decodeErr));
    }
}

export interface IValueObject<TProps extends Record<string, any>> {
    readonly props: TProps;

    equals<T extends IValueObject<TProps>>(other: T): boolean;

    validateProps(props: TProps): P.Either<ValueObjectPropsError, TProps>;
}

export abstract class BaseVO<TProps extends Record<string, any>> implements IValueObject<TProps> {

    readonly props: TProps;

    protected _name: string = "BaseVO";

    constructor(props: TProps) {
        const validation = this.validateProps(props);

        if (validation.isLeft()) throw validation.extract();
        this.props = validation.extract() as TProps;
    }

    equals<T extends IValueObject<TProps>>(other: T): boolean {
        return false;
    }

    abstract validateProps(props: TProps): P.Either<ValueObjectPropsError, TProps>;

    [inspect.custom]() {
        return `ValueObject[${this._name}] -> ${JSON.stringify(this.props)}`;
    }
}