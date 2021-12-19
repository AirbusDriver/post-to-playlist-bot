import { ApplicationError, RawError } from '@/shared';


export type PlaylistRepoErrors = 'DOES_NOT_EXIST' | 'INVALID'

export type PlaylistRepoError = RawError<PlaylistRepoErrors> | ApplicationError