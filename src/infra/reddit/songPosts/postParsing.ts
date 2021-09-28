import { TrackInfo }              from '@/music/types';
import { mergeRegex }             from '@fns/regex';
import { TrackSubmissionDetails } from '@infra/reddit/types';
import * as P                     from 'purify-ts';
import { Maybe }                  from 'purify-ts';
import * as R                     from 'ramda';
import Snoowrap                   from 'snoowrap';


const unicodePunc = /\p{P}?/u;

const metaRegex = /^(?:\p{Ps}\b[\w\s\d,\/-]+\b\p{Pe})*\s*/u;

export const trackRegexs = [
    metaRegex, // meta
    /(?<artist>\b[\w\s\/]+\b)/, // Artist
    /\s*-\s*/, // gap
    unicodePunc, // space
    /(?<track>\b[\w\s\/]+\b)/, // Track
    unicodePunc,
    /\s*(?:[\[(]\b[\d\w\s,\/-]+\b[\])])*$/, // end
];

export const trackRegex = mergeRegex(trackRegexs);


/**
 * Return Maybe(TrackInfo) if the input string has track information
 * @param {string} title
 * @return {Maybe<TrackInfo>}
 */
export const titleToTrackInfoSafe = (title: string): Maybe<TrackInfo> => {
    const match = [ ...R.match(trackRegex, title) ];

    return P.NonEmptyList.fromArray(match)
        .map(([ _, artist, title ]) => ({
            artist,
            title
        }));
};


/**
 * Return a Maybe(TrackSubmissionResult) if the submission has a track for a title
 *
 * @param {Submission} submission
 * @return {Maybe<TrackSubmissionDetails>}
 */
export const submissionToTrackInfo = (submission: Snoowrap.Submission): Maybe<TrackSubmissionDetails> => {
    return Maybe.fromNullable(submission.title)
        .chain(titleToTrackInfoSafe)
        .map(trackInfo => ({
            submission, trackInfo
        }));
};