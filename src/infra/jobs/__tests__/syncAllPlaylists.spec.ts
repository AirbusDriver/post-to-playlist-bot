import { GetRight } from '@fns';
import * as path    from 'path';
import {
    isJsonFile,
    getPlaylistDefinitionObjectFromPath,
    getPlaylistDefinitionPaths,
    getPlaylistDefinitionsFromPathSafe
}                   from '../syncAllPlaylists';


describe('isJsonFile', () => {
    it('should return true for valid json file', () => {

        const input = 'ar-heavy.json';
        const result = isJsonFile(input);


        expect(result).toBe(true);
    });
});

describe('getPlaylistDefinitionObjectFromPath', () => {
    it('should return true for valid json file', () => {
        const goodPath = path.join(__dirname, 'testPlaylists/playlists/ar-heavy.json');

        const result = getPlaylistDefinitionObjectFromPath(goodPath);

        expect(result.isRight()).toBe(true);

        const rightVal = result.extract() as GetRight<typeof result>;

        expect(rightVal.id).toBe('7HSzxV5SjkYMJT9oLTRtOj');
    });
});


describe('getPlaylistDefinitionPaths', () => {
    it('should return true for valid json file', () => {
        const goodPath = path.join(__dirname, 'testPlaylists/playlists');

        const result = getPlaylistDefinitionPaths(goodPath);

        expect(result.isRight()).toBe(true);

        const rightVal = result.extract() as GetRight<typeof result>;

        expect(rightVal.length).toBe(2);
    });
});

describe('getPlaylistDefinitionsFromPathSafe', () => {
    it('should return true for valid json file', () => {
        const goodPath = path.join(__dirname, 'testPlaylists/playlists');

        const result = getPlaylistDefinitionsFromPathSafe(goodPath);

        expect(result.isRight()).toBe(true);

        const rightVal = result.extract() as GetRight<typeof result>;

        expect(rightVal.length).toBe(2);
    });
});