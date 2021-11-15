import { TrackInfo }              from '@/music/types';
import { mergeRegex }             from '@fns/regex';
import { submissionSummaryCodec } from '@infra/reddit/codecs';
import { TrackSubmissionSummary } from '@infra/reddit/types';
import * as P                     from 'purify-ts';
import { Maybe }                  from 'purify-ts';
import * as R                     from 'ramda';
import Snoowrap                   from 'snoowrap';


const metaRegex = /^(?:[\p{Ps}\p{Po}]+\s*\b[\w\s\d,\/-]+\b[\p{Pe}\p{Po}]+)*\s*/u;

export const trackRegexs = [
    metaRegex, // meta
    /[\p{Ps}\p{Po}\p{Pi}]?/u,
    /(?<artist>\b[\w\s\/.]+\b)/, // Artist
    /[\p{Pe}\p{Po}\p{Pf}]?/u,
    /\s*\p{Pd}+\s*/u, // gap dash gap
    /[\p{Ps}\p{Po}\p{Pi}]?/u,
    /(?<track>\b[\w\s\/.]+\b)/, // Track
    /[\p{Pe}\p{Po}\p{Pf}]?/u,
    /.*$/u, // end
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
 * Return a Maybe(TrackSubmissionSummary) if the submission has a track for a title
 *
 * @param {Submission} submission
 * @return {Maybe<TrackSubmissionSummary>}
 */
export const parseTrackSubmissionSummaryFromSubmission = (submission: Snoowrap.Submission): Maybe<TrackSubmissionSummary> => {

    return submissionSummaryCodec.decode(submission)
        .toMaybe()
        .chain(s => titleToTrackInfoSafe(s.title)
            .map(R.assoc('trackInfo', R.__, {}))
            .map(R.assoc('submission', s))
        );

};