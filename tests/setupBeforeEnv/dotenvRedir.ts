import path   from 'path';
import * as P from 'purify-ts';
import dotenv from 'dotenv';


const env = path.join(process.cwd(), '.env.production.sample');

const debug: boolean = (process.env.DEBUG != null && ([ 'true', true, 1 ].includes(process.env.DEBUG)));

console.debug(`loading env from ${ env }`);

export const parsedEnv = P.Either.encase(() => dotenv.config({path: env}))
    .ifLeft(_ => console.error('could not load test env from: ' + env))
    .ifLeft(_ => {
        throw _;
    })
    .ifRight(v => console.debug(`loaded env from ${ env }`))
    .unsafeCoerce();


