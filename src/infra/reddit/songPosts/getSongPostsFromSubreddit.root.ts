import { redditErrorFactory }                                    from '@infra/reddit/errors';
import { RedditError, RedditErrorTypes, TrackSubmissionDetails } from '@infra/reddit/types';
import * as P                                                    from 'purify-ts';
import { EitherAsync }                                           from 'purify-ts';
import * as R                                                    from 'ramda';
import Snoowrap                                                  from 'snoowrap';
import { ListingOptions, Subreddit, Submission }                 from 'snoowrap/dist/objects';
import { submissionToTrackInfo }                                 from './postParsing';


export type SearchType = 'hot' | 'top'


const strategyMap = new Map<SearchType, (opts?: ListingOptions) => ReturnType<Subreddit['getHot']>>([
    [ 'hot', Subreddit.prototype.getHot ],
    [ 'top', Subreddit.prototype.getTop ],
]);


export type GetSongPostsDto = { subreddit: string, searchType: SearchType, opts?: ListingOptions }

export type GetSongPostsTask = (dto: GetSongPostsDto) => EitherAsync<RedditError, TrackSubmissionDetails[]>

export type GetSongPostsFromSubredditTaskRoot = (client: Snoowrap) => GetSongPostsTask

export const getSongPostsDtoCodec: P.Codec<P.FromType<GetSongPostsDto>> = P.Codec.interface({
    subreddit: P.string,
    searchType: P.exactly('hot', 'top'),
    opts: P.optional(P.Codec.interface({
        limit: P.optional(P.number),
        after: P.optional(P.string),
        show: P.optional(P.string),
        before: P.optional(P.string),
        count: P.optional(P.number),
    }))
}) as P.Codec<P.FromType<GetSongPostsDto>>


export const getSongPostsFromSubredditTaskRoot: GetSongPostsFromSubredditTaskRoot = client => dto => {
    return EitherAsync(async ctx => {

        const safeDto = await ctx.liftEither(getSongPostsDtoCodec.decode(dto)
            .mapLeft(redditErrorFactory.invalidRequest)) as GetSongPostsDto

        const searchStrategy = strategyMap.get(safeDto.searchType) || Subreddit.prototype.getHot;

        const task = EitherAsync<Error, Submission[]>(() => {
            return new Promise((res, rej) => {
                const subreddit = client.getSubreddit(safeDto.subreddit);

                const search = searchStrategy.bind(subreddit);

                search(safeDto.opts)
                    .then(res)
                    .catch(rej);
            });
        })
            .mapLeft<RedditError>(err => ({
                name: RedditErrorTypes.UNKNOWN,
                orig: JSON.stringify(err),
                message: err.message || 'an unknown error occurred with the reddit service'
            }));

        const result = await ctx.fromPromise(task.run());

        return P.Maybe.catMaybes(R.map(submissionToTrackInfo, result));
    });
};