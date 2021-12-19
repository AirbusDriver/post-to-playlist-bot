import { getAllPlaylistDefinitionsUseCase } from '@/music/useCases/getAllPlaylistDefinitions.useCase';
import syncPlaylistUseCase                  from '@/music/useCases/syncPlaylist';
import { runEAsyncsWithDelaySeq }           from '@fns';
import { EitherAsync }                      from 'purify-ts';
import { createCommand, Command }           from 'commander';


const syncAllFromRepo = async (_: Command) => {
    await EitherAsync(async lifts => {
        const defs = await lifts.fromPromise(getAllPlaylistDefinitionsUseCase.run());

        const syncTasks = defs.map(syncPlaylistUseCase);

        return await runEAsyncsWithDelaySeq(0)(syncTasks);
    })
        .ifLeft(console.error)
        .ifLeft(() => process.exit(1))
        .void()
        .run();
};


export const _command = (action: (cmd: Command) => Promise<void>) => createCommand('sync-all')
    .description('sync all playlists from repository')
    .action(action);


export const syncAllPlaylistsCommand = _command(syncAllFromRepo);

export default syncAllPlaylistsCommand;