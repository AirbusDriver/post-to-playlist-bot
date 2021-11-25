import { Right }                    from '@fns';
import { getSpotifyConfigSafeRoot } from '@infra/spotify/config/getConfig';
import getSettings                  from '@infra/spotify/config/settings';
import { SpotifyConfig }            from '@infra/spotify/config/types';


const mockConstants: SpotifyConfig = {
    authTokenFile: '/tmp/spotifyAuth.json',
    state: 'bogus',
    clientSecret: 'someSecret',
    scopes: [ 'scopes' ],
    callback: 'example.com',
    clientId: '1122boogie'
};

const mock_logger = {
    log: jest.fn(),
    debug: jest.fn(),
};


describe('getSpotifyConfigSafeRoot', () => {
    const mock_getConstants: typeof getSettings = jest.fn(() => {
        return Right({...mockConstants});
    });

    const composition = getSpotifyConfigSafeRoot(mock_logger as any)(mock_getConstants);

    it('returns config', () => {
        expect(composition().map(f => f.authTokenFile).extract()).toBe(mockConstants.authTokenFile);
    });
});


