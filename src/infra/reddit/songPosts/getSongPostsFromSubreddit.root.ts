import { listingOptionsCodec }                       from '@infra/reddit/codecs';
import { redditErrorFactory }                        from '@infra/reddit/errors';
import {
    ListingOptions,
    ListingTimes,
    NonTimeFrameListing,
    RedditError,
    RedditErrorTypes,
    TimeFrameListing,
    TrackSubmissionSummary
}                                                    from '@infra/reddit/types';
import getRootLogger                                 from '@shared/logger';
import * as P                                        from 'purify-ts';
import { EitherAsync }                               from 'purify-ts';
import * as R                                        from 'ramda';
import Snoowrap                                      from 'snoowrap';
import { Submission }                                from 'snoowrap/dist/objects';
import { parseTrackSubmissionSummaryFromSubmission } from './postParsing';


const logger = getRootLogger().child({module: 'songPosts/getSongPosts'});


export type BaseDto = {
    subreddit: string;
    opts: ListingOptions | null
}

export const DEFAULTS: Partial<GetSongPostsDto> = {
    opts: {limit: 25},
    type: 'hot',
};

const baseDtoCodec: P.Codec<P.FromType<BaseDto>> = P.Codec.interface({
    subreddit: P.string,
    opts: P.nullable(listingOptionsCodec)
}) as P.Codec<P.FromType<BaseDto>>;


export type TimeDto = {
    type: TimeFrameListing,
    time: ListingTimes
}

const timeDtoCodec: P.Codec<P.FromType<TimeDto>> = P.Codec.interface({
    type: P.exactly('top'),
    time: P.exactly('all', 'year', 'month', 'week', 'day')
});


export type NoTimeDto = {
    type: NonTimeFrameListing
}

const noTimeDtoCodec: P.Codec<P.FromType<NoTimeDto>> = P.Codec.interface({
    type: P.exactly('hot', 'new', 'rising')
});

export type GetSongPostsDto = BaseDto & (TimeDto | NoTimeDto)

export type GetSongPostsTask = (dto: GetSongPostsDto) => EitherAsync<RedditError, TrackSubmissionSummary[]>

export type GetSongPostsFromSubredditTaskRoot = (client: Snoowrap) => GetSongPostsTask


export const getSongPostsDtoCodec: P.Codec<P.FromType<GetSongPostsDto>> = P.intersect(
    baseDtoCodec,
    P.oneOf([ noTimeDtoCodec, timeDtoCodec ])
);


// todo: pack this up in a service
// todo: caching

export const getSongPostsFromSubredditTaskRoot: GetSongPostsFromSubredditTaskRoot = client => dto => {
    return EitherAsync(async ctx => {

        const safeDto = await ctx.liftEither(getSongPostsDtoCodec.decode(dto)
            .map(R.merge(DEFAULTS))
            .mapLeft(redditErrorFactory.invalidRequest)) as GetSongPostsDto;

        // Snoowrap uses self-resolving Promises, so TS throws a fit.
        // Wrap Snoowrap calls up so that TS will allow async. This is awful.
        const task = EitherAsync<Error, Submission[]>(() => {
            return new Promise((resolve, reject) => {
                const subreddit = client.getSubreddit(safeDto.subreddit);

                const time = safeDto.type == 'top' ? safeDto.time : 'all';

                const transforms: Partial<Record<keyof ListingOptions, any>> = {
                    after: (s: string) => `t3_${ s }`,
                    before: (s: string) => `t3_${ s }`,
                };

                const prependOpts = R.evolve(transforms);

                const prependedOpts = prependOpts(safeDto.opts as ListingOptions);

                let searchFn: () => Promise<Snoowrap.Listing<Snoowrap.Submission>>;

                switch (safeDto.type) {
                case 'hot':
                    searchFn = () => subreddit.getHot(prependedOpts);
                    break;
                case 'rising':
                    searchFn = () => subreddit.getRising(prependedOpts);
                    break;
                case 'new':
                    searchFn = () => subreddit.getNew(prependedOpts);
                    break;
                case 'top':
                    searchFn = () => subreddit.getTop({...prependedOpts, time});
                    break;
                default : {
                    searchFn = () => subreddit.getHot(prependedOpts);
                    break;
                }
                }

                logger.debug('searching reddit for tracks with', {
                    received: safeDto,
                    transformed: prependedOpts
                });

                searchFn()
                    .then(resp => resp.fetchMore({append: true, amount: safeDto.opts?.limit || 50}))
                    .then(resolve)
                    .catch(reject);
            });
        })
            .mapLeft<RedditError>(err => ({
                name: RedditErrorTypes.SERVICE_ERROR,
                orig: JSON.stringify(err),
                message: err.message || 'an unknown error occurred with the reddit service'
            }));

        const submissionResults = await ctx.fromPromise(task.run());

        const maybeResults = R.map(sub => parseTrackSubmissionSummaryFromSubmission(sub)
            .ifJust(() => logger.debug('is a song post', {title: sub.title}))
            .ifNothing(() => logger.debug('is not a song', {title: sub.title}))
        , submissionResults);

        logger.debug(`pulled ${ submissionResults.length } submissions`, {
            titles: submissionResults.map(x => x.title)
        });

        const justs = P.Maybe.catMaybes(maybeResults);

        logger.debug(`${ justs.length } were track posts`);

        return justs;
    });
};