import { PlaylistDefinitionRepo } from '@/music/ports';
import { GetLeft }                from '@fns';
import { SAMPLE_PLAYLIST_DIR }    from '@tests/sampleDeploy/sampleDeployPaths';
import * as fs                    from 'fs';
import { makeTempDir }            from '@tests/utils/fileSystem';
import { createFileRepo }         from '../fileRepo';
import { PlaylistRepoError }      from '@/music/playlistRepo/errors';


const createTmpPlaylistDir = () => {
    const tempDir = makeTempDir('testDir');
    console.log(`created: ${ tempDir } as a temporary playlist dir`);
    fs.cpSync(SAMPLE_PLAYLIST_DIR, tempDir, {recursive: true});
    console.log(`copied from ${ SAMPLE_PLAYLIST_DIR } to ${ tempDir }`);
    return tempDir;
};


describe('createFileRepo', () => {
    let testDir: string;

    let fileRepo: PlaylistDefinitionRepo;

    beforeAll(async () => {
        testDir = createTmpPlaylistDir();
        const repoResp = await createFileRepo(testDir)
            .ifLeft(err => {
                throw err;
            });

        fileRepo = repoResp.extract() as PlaylistDefinitionRepo;
    });

    describe('getAll', () => {

        it('returns both defs from sampleDeploy', async () => {
            const result = await fileRepo.getAll.run();

            expect(result.isRight()).toBe(true);

            result.map(defs => {
                expect(defs.length).toBe(2);
            });
        });
    });

    describe('getForId', () => {
        const id = '123123'; // ar/heavy id

        it('returns def for id', async () => {
            const result = await createFileRepo(testDir)
                .chain(repo => repo.getForId(id))
                .run();

            expect(result.isRight()).toBe(true);
            expect(result.map(def => def.name).extract()).toMatch('ar/heavy');
        });

        it('returns repoError for non-existent id', async () => {
            const result = await createFileRepo(testDir)
                .chain(repo => repo.getForId('1122boogiewoogie'))
                .run();

            expect(result.isLeft()).toBe(true);

            result
                .mapLeft(err => {
                    expect(err.name === 'DOES_NOT_EXIST').toBe(true);
                    expect(err.message).toMatch(/no playlist with id: .*/);
                });
        });
    });

    describe('when given an non-existent dir', () => {
        const noDir = '/tmp/123973f8wof87';

        const repoTask = createFileRepo(noDir);

        it('should return Left when dir does not exist', async () => {

            const result = await repoTask.run();

            expect(result.isLeft()).toBe(true);
        });

        it('should return an Error with an appropriate message when the repo creation fails', async () => {
            const result = await repoTask.run();

            const err = result.extract() as GetLeft<typeof result>;

            expect(err.message).toMatch(/.*does not exist$/);
        });
    });
});