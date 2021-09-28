import { readFileSyncSafe }                              from '@fns/fileIO';
import { parseJsonSafe }                                 from '@fns/json';
import { EitherAsync }                                   from '@fns/purifyUtils';
import { errorFactory, SpotifyError, SpotifyErrorNames } from '@infra/spotify/errors';
import { decodeAuthTokensDtoSafe }                       from '@infra/spotify/tokens/codecs';
import { FetchAuthTokensTask }                           from '@infra/spotify/tokens/types';
import { GetSpotifyConfigSafe }                          from '../config';


export {FetchAuthTokensTask}

export type FetchAuthTokensTaskRoot = (getConfig: GetSpotifyConfigSafe) => FetchAuthTokensTask;


export const fetchAuthTokensTaskRoot: FetchAuthTokensTaskRoot = getConfig => EitherAsync(async ({liftEither}) => {

    const config = await liftEither(getConfig());

    const tokenFile = config.authTokenFile;

    const data = await liftEither(readFileSyncSafe(tokenFile)()
        .mapLeft<SpotifyError>((err) => ({
            name: SpotifyErrorNames.CONFIG,
            orig: err,
            message: 'could not real from auth file',
        })));

    const result = parseJsonSafe()(data)
        .mapLeft(err => errorFactory.auth(err.message, err))
        .chain(obj => decodeAuthTokensDtoSafe(obj));

    return liftEither(result);
});