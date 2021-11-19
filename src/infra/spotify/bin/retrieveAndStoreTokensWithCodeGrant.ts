/**
 * Script to retrieve a fresh authorization token set from the Spotify Api. This must be run when adding or
 * removing scopes as well.
 */
import { writeToFileSyncSafe }                                     from "@fns/fileIO";
import { stringifyJsonSafe }                                       from "@fns/json";
import { always, Either, EitherAsync, Left, liftEA, Maybe, Right } from "@fns/purifyUtils";
import { maybeAsyncPrompt, printIO, stdInOutIfaceFactory, WithReadlineInterfaceTaskIO } from "@fns/readline-utils";
import { getSpotifyConfigSafe }                                                         from "@infra/spotify/config";
import { createUnauthorizedClientTask }                                                 from "@infra/spotify/getClient";
import { AuthTokens }                                                                   from "@infra/spotify/tokens";
import { encodeAuthTokensDomainSafe }                                                   from "@infra/spotify/tokens/codecs";
import { createAuthTokenService }                                                       from "@infra/spotify/tokens/createService";
import { parseTokenResponseToDomainAuthTokens }                                         from "@infra/spotify/tokens/refreshTokens.root";
import * as path                                                                        from "path";
import * as R                                                                           from "ramda";
import { Interface }                                                                    from "readline";
import { URL }                                                                          from "url";


const printInstructions = printIO(
    "\nA url will be generated that will direct you to the \n" +
    "Spotify log in page. After you log in, you will be redirected \n" +
    "to an example site. Copy the url and paste the entire thing into \n" +
    "the command line when prompted.",
);


const getConfirm = (prompt: string) => (iface: Interface) => EitherAsync<false, true>(async ctx => {
    return ctx.fromPromise(maybeAsyncPrompt(prompt)(iface)
        .toEitherAsync<false>(false)
        .chain<false, true>(resp => liftEA(R.pipe(
            (x: string) => R.trim(x),
            R.toLower,
            R.equals("y"),
            R.ifElse(R.identity, Right, Left),
        )(resp)))
        .run());
});

const getFileInput = (fallback: string) => (iFace: Interface): EitherAsync<string, string> => EitherAsync<string, string>(async ctx => {

    const resp = await maybeAsyncPrompt(`where would you like to save the tokens: [ ${ fallback } ] `)(iFace)
        .map(path.resolve)
        .orDefault(fallback);

    const confirm = await getConfirm(`would you like to save to [ ${ resp } ]? [Y/N]: `)(iFace)
        .map(always(fallback))
        .mapLeft(always("... trying again"))
        .ifLeft(s => printIO(s)(iFace))
        .chainLeft(() => getFileInput(fallback)(iFace))
        .run();

    return ctx.liftEither(confirm);
});


const parseCodeFromCallback = (str: string): Either<string, string> => {
    const _url = new URL(str);
    return Maybe.fromNullable(_url.searchParams.get("code"))
        .toEither("... invalid url");
};


const main: WithReadlineInterfaceTaskIO<EitherAsync<any, any>> = iface => EitherAsync(async (ctx) => {

    const config = await ctx.liftEither(getSpotifyConfigSafe());

    const client = await ctx.fromPromise(createUnauthorizedClientTask.run());
    const authService = createAuthTokenService(client);

    const url = client.createAuthorizeURL(config.scopes, config.state);

    const fallBackFile = path.resolve(config.authTokenFile);


    printInstructions(iface);
    printIO("\n")(iface);


    const inputFpString = await ctx.fromPromise(
        getFileInput(fallBackFile)(iface)
            .run());

    console.debug(`inputFileString => ${ inputFpString }`);

    const saveFilePath = await ctx.liftEither(Either.encase(() => path.parse(inputFpString))
        .map(always(inputFpString))
        .ifLeft(() => console.debug("could not parse input path as a valid path"))
        .ifLeft(console.error)
        .ifLeft(() => printIO(`'${ inputFpString }' is not a valid path... try again`)));

    console.debug(`saveFilePath => ${ saveFilePath }`);

    printIO("\n... generating authorization url")(iface);

    printIO(`\n${ url }`)(iface);

    const code = await ctx.fromPromise(maybeAsyncPrompt("\nafter signing in, please paste your redirect url here: ")(iface)
        .toEitherAsync("... invalid url")
        .chain(R.pipe(parseCodeFromCallback, liftEA))
        .ifLeft(s => printIO(`\n${ s }!!\ntry again please`)(iface))
        .ifRight(s => printIO(`... received => ${ s }`)(iface))
        .run());

    const authTokens: AuthTokens = await ctx.fromPromise(EitherAsync(() => client.authorizationCodeGrant(code))
        .mapLeft(err => R.prop("message")(err as { message: string }))
        .ifRight(res => console.info(`... received ok response\n${ JSON.stringify(res, null, 2) }`))
        .ifLeft(res => console.error(`... received fail response\n${ JSON.stringify(res, null, 2) }`))
        .chain(x => liftEA(
            parseTokenResponseToDomainAuthTokens(x)
                .ifLeft((s): void => printIO(s)(iface))
                .ifRight((s): void => printIO(`... parsed => ${ JSON.stringify(s) }`)(iface)),
        ))
        .run());

    return ctx.liftEither(encodeAuthTokensDomainSafe(authTokens)
        .chain(stringifyJsonSafe(2))
        .chain(writeToFileSyncSafe(saveFilePath))
        .ifLeft(console.error)
        .ifRight((): void => printIO(`... saved tokens to ${ saveFilePath }`)(iface)),
    );

});


async function runMain() {
    const rl = stdInOutIfaceFactory();
    await main(rl).run();
    rl.close();
}

runMain();
