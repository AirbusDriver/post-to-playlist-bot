import { spotifyErrorResponseCodec }        from '@infra/spotify/spotifyWebApiUtils';
import { createAuthTokenService }           from '@infra/spotify/tokens';
import { EitherAsync }                      from 'purify-ts';
import * as R                               from 'ramda';
import { getClientWithAuthCredentialsTask } from '../getClient';
import getLogger                            from '../logger';


const logger = getLogger();

const main = EitherAsync(async ctx => {

    logger.debug('beginning main');

    const client = await ctx.fromPromise(
        getClientWithAuthCredentialsTask
            .ifLeft(err => logger.error(`... could not create client... \n${ err }`))
            .ifRight(() => logger.info('... client created'))
            .run());

    const authService = createAuthTokenService(client);

    logger.info('created auth service');

    await ctx.fromPromise(authService.refreshTokens.bimap(R.tap(console.error), R.tap(console.log)).run());

    return ctx.fromPromise(EitherAsync(() => client.getMe())
        .ifRight(_ => {
            logger.info('... okay');
        },
        )
        .ifLeft(err =>
            spotifyErrorResponseCodec.decode(err)
                .map(R.pathOr('spotify api error', [ 'body', 'error', 'message' ]))
                .mapLeft(R.concat('... an error occurred decoding error response \n'))
                .bimap(logger.error, logger.info),
        )
        .run());

});


main.bimap(console.error, console.log).run();

