import { playlistDefinitionCodec } from '@/music/codecs';
import musicLogger                 from '@/music/logger';
import { PlaylistRepoError }       from '@/music/playlistRepo/errors';
import { PlaylistDefinition }      from '@/music/types';
import { ApplicationErrorNames }   from '@/shared';
import { liftEA }                  from '@fns';
import { parseJsonSafe }           from '@fns/json';
import * as fs                     from 'fs';
import { existsSync }              from 'fs';
import * as path                   from 'path';
import * as P                      from 'purify-ts';
import { Either, EitherAsync }     from 'purify-ts';
import * as R                      from 'ramda';
import { PlaylistDefinitionRepo }  from '../ports';


const logger = musicLogger.child({file: module.filename});

const existsSafe = (p: string) => Either.encase(() => fs.existsSync(p));

const isDirSafe = (p: string) => Either.encase(() => fs.statSync(p).isDirectory());

const dirExistsSafe = (p: string) => existsSafe(p)
    .mapLeft(P.always(`${ p } does not exist`))
    .chain(P.always(isDirSafe(p)
        .mapLeft(P.always(`${ p } is not a directory`))))
    .map(P.always(p));

const readDirSafe = (dir: string) => Either.encase(() => fs.readdirSync(dir))
    .mapLeft(err => err.message);

const getPlaylistDefFromFileTask = (file: string) => EitherAsync<string, PlaylistDefinition>(async lifts => {
    return lifts.liftEither(P.Either.encase(() => fs.readFileSync(file, {encoding: 'utf-8'}))
        .chain(parseJsonSafe())
        .mapLeft(err => err.message)
        .chain(playlistDefinitionCodec.decode)
        .ifLeft(error => logger.error('could not parse file into playlist definition', {
            error,
            file
        })));
});


type CreateGetAllPlaylistsTask = (dir: string) => PlaylistDefinitionRepo['getAll'];
const createGetAllPlaylistsTask: CreateGetAllPlaylistsTask = (dir: string) => EitherAsync(async lifts => {

    const paths = await lifts.liftEither(Either.encase(() => path.normalize(dir))
        .mapLeft<string>(R.prop('message'))
        .chain(dirExistsSafe)
        .chain(readDirSafe)
        .mapLeft<PlaylistRepoError>(orig => ({
            name: 'INVALID',
            message: orig,
            orig,
        }))
        .ifLeft(err => logger.error('could not read definitions from dir', {
            input: dir,
            error: err
        }))
        .map(R.filter((s: string) => s.endsWith('.json')))
        .map(R.map(s => path.resolve(dir, s)))
        .ifRight(files => logger.debug('found playlist definition files', {
            files
        }))
    );

    const readTasks = paths.map(getPlaylistDefFromFileTask);

    return await P.EitherAsync.rights(readTasks);
});


type CreateGetForIdTask = (dir: string) => PlaylistDefinitionRepo['getForId'];
const createGetForIdTask: CreateGetForIdTask = dir => id => {

    const getAll = createGetAllPlaylistsTask(dir);

    const playlistEq: (def: PlaylistDefinition) => boolean = R.propEq('id', id);

    return getAll
        .map(R.filter(playlistEq))
        .chain(matches => {
            return liftEA(P.NonEmptyList.fromArray(matches)
                .map(P.NonEmptyList.head)
                .toEither({
                    name: 'DOES_NOT_EXIST',
                    message: `no playlist with id: ${ id }`,
                    orig: null,
                }));
        });
};


export const createFileRepo: (dir: string) => EitherAsync<PlaylistRepoError, PlaylistDefinitionRepo> = dir => EitherAsync(async ctx => {

    const dir_ = await ctx.liftEither(P.Maybe.fromNullable(dir)
        .toEither('could not create playlist repo without an existing directory')
        .chain(dir => existsSync(dir) ? P.Right(dir) : P.Left(`${ dir } does not exist`))
        .mapLeft(msg => ({
            name: ApplicationErrorNames.CONFIG,
            message: `failed to create playlist repo: ${ msg }`,
            orig: msg
        }))
    );

    const service: PlaylistDefinitionRepo = {
        getAll: createGetAllPlaylistsTask(dir_),
        getForId: createGetForIdTask(dir_),
    };

    return service;
});