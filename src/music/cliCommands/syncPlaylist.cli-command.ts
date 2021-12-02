import { liftEA }                                                       from '@fns';
import { accumWith, createArgument, createCommand, validatePathExists } from '@fns/cli';
import { readFileSyncSafe }                                             from '@fns/fileIO';
import { parseJsonSafe }                                                from '@fns/json';
import { Command }                                                      from 'commander';
import { EitherAsync }                                                  from 'purify-ts';
import syncPlaylistUseCase                                              from '../useCases/syncPlaylist';


const syncAction = async (paths: string[], _: Command) => {
    await EitherAsync(async lifts => {

        const tasks = paths.map(
            fp => liftEA(readFileSyncSafe(fp)()
                .chain(parseJsonSafe()))
                .chain((k: unknown) => syncPlaylistUseCase(k as any))
        );

        console.info('running sync tasks with files %O', paths);

        return lifts.fromPromise(EitherAsync.sequence(tasks).run());

    })
        .ifLeft(err => {
            console.error(err);
            process.exit(1);
        })
        .run();
};

export const _command = (action: (paths: string[], cmd: Command) => Promise<void>) => createCommand('sync')
    .description('sync a playlist from a file definition')
    .addArgument(
        createArgument('<definitionFiles...>', 'files to sync with')
            .default([])
            .argParser(accumWith(validatePathExists))
    )
    .action(action);


export const syncPlaylistCommand = _command(syncAction);

export default syncPlaylistCommand;