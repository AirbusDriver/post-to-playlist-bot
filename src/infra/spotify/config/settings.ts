import { Either }                          from '@/shared/fns';
import { envCodec }                        from '@infra/spotify/config/codec';
import { SpotifyConfig }                   from '@infra/spotify/config/types';
import { SpotifyError, SpotifyErrorNames } from '@infra/spotify/errors';
import { config }                          from 'dotenv';
import { parseError }                      from 'purify-ts';


const AUTH_FILE_DEFAULT = './spotifyAuth.json';

const SCOPES = [
    'playlist-modify-public',
    'playlist-modify-private',
    'playlist-read-collaborative',
    'playlist-read-private',
    'user-read-currently-playing',
    'user-read-playback-state',

];

export const CALLBACK = 'https://example.com/callback';

export const STATE = 'bogusState';

/**
 * A function that safely retrieves the config object
 */
export type GetSettingsSafe = () => Either<SpotifyError, SpotifyConfig>

/**
 * safely return the spotify config object
 *
 * @returns {Either<SpotifyError | SpotifyError, SpotifyConfig>}
 */
export const getSettings: GetSettingsSafe = () => {

    return Either.encase(() => config())
        .mapLeft<SpotifyError>(err => ({
            name: SpotifyErrorNames.CONFIG,
            message: 'could not load env',
            orig: err,
        }))
        .chain(env => envCodec.decode(env.parsed)
            .mapLeft<SpotifyError>(errStr => ({
                name: SpotifyErrorNames.CONFIG,
                message: errStr,
                orig: parseError(errStr),
            })),
        )
        .map<SpotifyConfig>(settings => ({
            authTokenFile: AUTH_FILE_DEFAULT,
            clientId: settings.SPOTIFY_CLIENT_ID,
            clientSecret: settings.SPOTIFY_SECRET,
            scopes: SCOPES,
            callback: CALLBACK,
            state: STATE,
        }));

};

export default getSettings;
