import { getRedditConfig } from '../config';


describe('getConfig reads process.env (integration test)', () => {

    const result = getRedditConfig();

    it('should read the .sample.env file', () => {
        expect(result.extract()).toEqual({
            'clientId': 'my_client_id',
            'clientSecret': 'my_reddit_secret',
            'password': 'my_password',
            'userAgent': 'BleghBot: a metal playlist maker',
            'username': 'my_username'
        });
    });

    it('should return a Right', () => {
        expect(result.isRight()).toBe(true);
    });


});
