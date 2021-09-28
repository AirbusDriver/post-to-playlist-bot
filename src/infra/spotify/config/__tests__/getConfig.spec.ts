import { Right }                    from '@fns';
import getSettings                  from '@infra/spotify/config/settings';
import { getSpotifyConfigSafeRoot } from '@infra/spotify/config/getConfig';
import { SpotifyConfig }            from '@infra/spotify/config/types';
import getSpotifyLogger             from '@infra/spotify/logger';


const mockConstants: SpotifyConfig = {
    authTokenFile: '/tmp/spotifyAuth.json',
    state: 'bogus',
    clientSecret: 'someSecret',
    scopes: [ 'scopes' ],
    callback: 'example.com',
    clientId: '1122boogie'
};

const mock_logger = jest.fn() as unknown as ReturnType<typeof getSpotifyLogger>


describe('getSpotifyConfigSafeRoot', () => {
    const mock_getConstants: typeof getSettings = jest.fn(() => {
        return Right({...mockConstants})
    });

    const composition = getSpotifyConfigSafeRoot(mock_logger)(mock_getConstants);

    it('returns config', () => {
        expect(composition().map(f => f.authTokenFile).extract()).toBe(mockConstants.authTokenFile);
    });
});


