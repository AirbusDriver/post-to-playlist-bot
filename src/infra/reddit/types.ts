import { TrackInfo }                     from '@/music/types';
import Snoowrap                          from 'snoowrap';
import { RedditError, RedditErrorTypes } from './errors';


export type RedditConfig = {
    clientSecret: string;
    clientId: string;
    username: string;
    password: string;
    userAgent: string
}

export type TrackSubmissionDetails = {
    submission: Snoowrap.Submission,
    trackInfo: TrackInfo,
}


export { RedditErrorTypes, RedditError };