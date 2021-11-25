import { SpotifyError, SpotifyErrorNames }                                          from '@infra/spotify/errors';
import getSpotifyLogger                                                             from '@infra/spotify/logger';
import authEvents
    from '@infra/spotify/tokens/authEvents';
import { AuthTokens, CheckTokensEveryTask, FetchAuthTokensTask, RefreshTokensTask } from '@infra/spotify/tokens/types';
import { always, Either, EitherAsync, Left, Right }                                 from 'purify-ts';
import * as R                                                                       from 'ramda';


const logger = getSpotifyLogger().child({module: 'autoTokens'});

const validateMilli: (x: number) => Either<string, number> = R.ifElse(
    R.allPass([
        R.complement(R.isNil),
        R.is(Number),
        R.lte(999), // milli must be gte 1000
    ]),
    Right,
    always(Left('milliseconds must be a number of at least 1000')));


const refreshRequiredPure = (ifWithinMilli: number) => (now: Date) => (tokens: AuthTokens): boolean => {
    const {expiresAt} = tokens;

    const cutoffTime = expiresAt.getTime() - ifWithinMilli;
    const nowTime = now.getTime();

    return R.gte(nowTime, cutoffTime);
};

type TimerTask = EitherAsync<SpotifyError, void>

export const timerTask = (fetch: FetchAuthTokensTask) => (refresh: RefreshTokensTask): TimerTask => EitherAsync(async ctx => {
    const tokens = await ctx.fromPromise(fetch.run());

    logger.debug('checking tokens');

    const required: boolean = refreshRequiredPure(1000 * 60 * 5)(new Date(Date.now()))(tokens);

    if (!required) {
        logger.debug({status: 'token refresh not required...', expire: tokens.expiresAt, now: new Date(Date.now())});
        return;
    }

    logger.info('attempting to refresh tokens');

    const result = await refresh
        .ifRight(() => authEvents.emit('tokensRefreshed'))
        .ifLeft(err => authEvents.emit('tokenRefreshFailed', err))
        .run();

    logger.debug(`refresh result => ${ result.inspect() }`);
});


type CheckTokensEveryRoot =
    (timerTask: TimerTask) =>
        CheckTokensEveryTask;


export const checkTokensEveryRoot: CheckTokensEveryRoot =
    task => milli =>
        EitherAsync<SpotifyError, NodeJS.Timer>(async ctx => {

            const intervalTime = await ctx.liftEither(validateMilli(milli).mapLeft(s => ({
                name: SpotifyErrorNames.AUTH,
                orig: null,
                message: s,
            })));

            await task.run();

            return setInterval(() => {
                return task.run();
            }, intervalTime);
        });

