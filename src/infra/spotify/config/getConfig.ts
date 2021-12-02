import CacheIO                          from '@fns/CacheIO';
import { SpotifyConfig }                from '@infra/spotify/config/types';
import getSpotifyLogger, { Logger }     from '@infra/spotify/logger';
import { Either, Right }                from 'purify-ts';
import { errorFactory, SpotifyError }   from '../errors';
import { configCodec }                  from './codec';
import { getSettings, GetSettingsSafe } from './settings';


const logger = getSpotifyLogger();

// INTERFACES

export type GetSpotifyConfigSafe = () => Either<SpotifyError, SpotifyConfig>

type GetSpotifyConfigSafeRoot = (logger: Logger) => (getSettingsSafe: GetSettingsSafe) => GetSpotifyConfigSafe;

// ROOT //

export const getSpotifyConfigSafeRoot: GetSpotifyConfigSafeRoot = logger => getSettingsSafe => () => {

    return getSettingsSafe()
        .chain(data => configCodec.decode(data)
            .mapLeft((err) => errorFactory.config(err))
            .ifLeft(s => logger.debug('failed to decode Spotify config'))
            .ifLeft(logger.debug),
        )
        .ifLeft(logger.error)
        .ifRight(_ => logger.debug('config retrieved with value... '))
        .ifRight(logger.debug);
};


// COMPOSITION

/**
 * Safely retrueve the
 * @type {GetSpotifyConfigSafe}
 */
const getSpotifyConfigSafeCache = CacheIO.of(() => getSpotifyConfigSafeRoot(logger)(getSettings)())
    .setDescription('getSpotifyConfigSafeCache');


export const getSpotifyConfigSafe = () => getSpotifyConfigSafeCache.getLazy();


// EXPORTS

export default getSpotifyConfigSafe;