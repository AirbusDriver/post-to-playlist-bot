import { PLAYLIST_DIR }   from '@config';
import { liftEA }         from '@fns';
import { createFileRepo } from './fileRepo';
import * as P             from 'purify-ts';
import musicLogger        from '@/music/logger';


const logger = musicLogger.child({file: module.filename});

export const createRepoTask = liftEA(P.Maybe.of(PLAYLIST_DIR)
    .toEither('PLAYLIST_DIR can not be null'))
    .chain(createFileRepo)
    .ifLeft(logger.error);

export default createRepoTask;