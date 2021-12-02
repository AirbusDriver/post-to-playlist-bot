import * as config                                 from '@/config';
import { playlistDefinitionCodec }                 from '@/music/codecs';
import { PlaylistDefinition }                      from '@/music/types';
import { syncPlaylistUseCase }                     from '@/music/useCases';
import { ApplicationError, ApplicationErrorNames } from '@/shared';
import { readFileSyncSafe }                        from '@fns/fileIO';
import { parseJsonSafe }                           from '@fns/json';
import { runEAsyncsWithDelaySeq }                  from '@fns/purifyUtils';
import { Logger }                                  from '@shared/logger';
import * as fs                                     from 'fs';
import * as schedule                               from 'node-schedule';
import * as path                                   from 'path';
import { Either, EitherAsync, Left, Right }        from 'purify-ts';
import * as R                                      from 'ramda';


const NAME = 'sync playlists';
const DEFAULT_CRON = '*/60 * * * *';

const playlistDir = config.PLAYLIST_DIR;

export const isJsonFile: (file: string) => boolean = p => path.parse(p).ext === '.json' || false;
const dirExists = (d: string) => fs.existsSync(d) && fs.statSync(d).isDirectory();

export const getPlaylistDefinitionPaths: (dir: string) => Either<ApplicationError, string[]> = dir => R.ifElse(
    (dir: string) => dirExists(dir),
    R.pipe(
        (d: string) => fs.readdirSync(d, {withFileTypes: true}),
        s => s.filter(x => x.isFile()),
        s => s.map(x => x.name),
        f => f.map(x => path.join(dir, x)),
        names => Right(names)
    ),
    (dir: string) => Left<ApplicationError>({
        name: ApplicationErrorNames.CONFIG,
        orig: null,
        message: `${ dir } does not exists`
    })
)(dir);

export const getPlaylistDefinitionObjectFromPath = (path: string): Either<ApplicationError, PlaylistDefinition> => {
    return readFileSyncSafe(path)()
        .chain(parseJsonSafe())
        .mapLeft((err): ApplicationError => ({
            name: ApplicationErrorNames.CONFIG,
            orig: err,
            message: `could not read json file ${ path }`
        }))
        .chain(json => playlistDefinitionCodec.decode(json)
            .mapLeft<ApplicationError>(err => ({
                name: ApplicationErrorNames.CONFIG,
                orig: err,
                message: `${ path } is not a valid playlistDefinition file format`
            })));
};

export const getPlaylistDefinitionsFromPathSafe: (path: string) => Either<ApplicationError, PlaylistDefinition[]> =
    path => getPlaylistDefinitionPaths(path)
        .map(p => Either.rights(R.map(getPlaylistDefinitionObjectFromPath, p)));


const job = (playlistDir: string, logger?: Logger) => (fireDate: Date): Promise<Either<any, any>> => EitherAsync(async lifts => {
    const playlistDefs = await lifts.liftEither(getPlaylistDefinitionsFromPathSafe(playlistDir));

    logger?.debug(`using ${ playlistDir } as playlist directory`);
    logger?.info(`using ${ playlistDefs.length } definitions`);

    const tasks = playlistDefs.map(dto => syncPlaylistUseCase(dto)
        .ifLeft(err => logger?.error(err))
        .ifRight(resp => logger?.info('playlist updated', {
            playlist: {
                id: resp.playlist.id,
                name: resp.playlist.item.name,
                uri: resp.playlist.uri,
            },
            actions: resp.actions
        }))
    );

    await runEAsyncsWithDelaySeq(0)(tasks);

})
    .ifLeft(err => console.error(err))
    .void().run();


const start = (logger?: Logger) => (cronString: string) => {
    const sched = cronString || DEFAULT_CRON;

    logger?.info(`scheduling ${ NAME } with ${ sched }`);

    job(playlistDir, logger)(new Date(Date.now())); // run first

    const _job = schedule.scheduleJob(NAME, sched, job(playlistDir, logger));


    _job.on('scheduled', (date: Date) => {
        logger?.info(`${ NAME } job scheduled => ${ date }`);
    });

    _job.on('success', () => {
        logger?.info(`${ NAME } job complete`);
    });

    _job.on('failure', () => {
        logger?.error(`${ NAME } job failed`);
    });

};

export default start;
