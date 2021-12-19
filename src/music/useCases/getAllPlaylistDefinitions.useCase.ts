import createRepoTask                 from '@/music/playlistRepo';
import { PlaylistDefinitionRepo }     from '@/music/ports';
import { PlaylistDefinition }         from '@/music/types';
import { ApplicationError, RawError } from '@/shared';
import { EitherAsync }                from 'purify-ts';
import { log }                        from 'util';
import { musicLogger }                from '../logger';


const logger = musicLogger.child({file: module.filename});


export type GetAllPlaylistDefinitionsErrors = 'REPO_ERROR'

export type GetAllPlaylistDefinitionError = RawError<GetAllPlaylistDefinitionsErrors> | ApplicationError;

export type GetAllPlaylistDefinitionUseCase = EitherAsync<GetAllPlaylistDefinitionError, PlaylistDefinition[]>;

const _createUseCase = (repo: PlaylistDefinitionRepo): GetAllPlaylistDefinitionUseCase => {
    return repo.getAll
        .ifLeft(logger.error)
        .mapLeft(orig => ({
            name: 'REPO_ERROR',
            message: orig.message,
            orig
        }));
};

export const getAllPlaylistDefinitionsUseCase: GetAllPlaylistDefinitionUseCase = createRepoTask
    .ifLeft(logger.error)
    .mapLeft((orig): GetAllPlaylistDefinitionError => ({
        name: 'REPO_ERROR',
        message: 'could not get playlist repo',
        orig
    }))
    .chain(repo => _createUseCase(repo));