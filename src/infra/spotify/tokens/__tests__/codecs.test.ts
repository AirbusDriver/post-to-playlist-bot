import { AuthTokens, AuthTokensDto } from '@infra/spotify/tokens/types';
import { authTokensDomainCodec }     from '../codecs';


const goodTokens: AuthTokens = {
    accessToken: 'anAccessToken',
    refreshToken: 'aRefreshToken',
    expiresAt: new Date(Date.UTC(2020, 0, 15)), // 2020-01-15
};


describe('authTokensCodec', () => {
    it('should encode properly', () => {
        const result = authTokensDomainCodec.encode(goodTokens) as AuthTokensDto;

        expect(result.expiresAt).toBe('2020-01-15T00:00:00.000Z');
        expect(result.accessToken).toBe(goodTokens.accessToken);
        expect(result.refreshToken).toBe(goodTokens.refreshToken);

    });

});