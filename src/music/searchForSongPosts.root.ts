import { SpotifyItem, TrackInfo }                                                      from '@/music/types';
import { ApplicationError, ApplicationErrorNames, RawError } from '@/shared';
import { runEAsyncsWithDelaySeq }                            from '@fns';
import { perSecond }                                         from '@fns/delay';
import {
    GetSongPostsDto,
    GetSongPostsTask
}                                                                                      from '@infra/reddit/songPosts/getSongPostsFromSubreddit.root';
import { ListingTimes, NonTimeFrameListing, TimeFrameListing, TrackSubmissionSummary } from '@infra/reddit/types';
import { SearchService }                                                               from '@infra/spotify';
import getLogger                                                                       from '@shared/logger';
import * as P                                                                          from 'purify-ts';
import { EitherAsync, Right }                                                          from 'purify-ts';
import * as R                                                                          from 'ramda';


const logger = getLogger().child({module: 'music/searchForSongPosts.root'});

export type SearchSongPostsBaseDto = {
    subreddit: string;
    limit: number;
}

type WithTimeDto = {
    type: TimeFrameListing;
    time: ListingTimes;
}

type WithoutTimeDto = {
    type: NonTimeFrameListing;
}

export type SearchSongPostsDto = SearchSongPostsBaseDto & (WithTimeDto | WithoutTimeDto)

export const DEFAULTS: Partial<SearchSongPostsDto> = {
    limit: 25,
    type: 'hot',
};

const CHUNK = 25;
const SPOTIFY_DELAY = perSecond(6);

const dtoTimeCodec: P.Codec<P.FromType<WithTimeDto>> = P.Codec.interface({
    type: P.exactly('top'),
    time: P.exactly('all', 'year', 'month', 'week', 'day')
});

const dtoListCodec: P.Codec<P.FromType<WithoutTimeDto>> = P.Codec.interface({
    type: P.exactly('hot', 'new', 'rising'),
});


type SearchSongPostsDtoCodec = P.Codec<P.FromType<SearchSongPostsDto>>
export const searchSongPostsDtoCodec: SearchSongPostsDtoCodec = P.intersect(P.Codec.interface({
        subreddit: P.string,
        limit: P.Codec.custom<number>(
            {
                decode: input => R.cond([
                    [ R.pipe(parseInt, isNaN), R.always(P.Left('not a number')) ],
                    [ R.flip(R.gte)(150), R.always(P.Left('number must be between 0 - 150')) ],
                    [ R.flip(R.lt)(1), R.always(P.Left('number must be greater than 0')) ],
                    [ R.T, R.pipe(parseInt, Right) ]
                ])(input),
                encode: R.identity
            }
        )
    }),
    P.oneOf([ dtoListCodec, dtoTimeCodec ]));


export enum SearchSongPostsErrorReasons {
    SERVICE_ERROR = 'SERVICE_ERROR'
}


export type SearchSongPostsError = RawError<SearchSongPostsErrorReasons> | ApplicationError

type ItemDetails = {
    spotify: SpotifyItem<TrackInfo>,
    reddit: TrackSubmissionSummary
    track: TrackInfo
}

export type SearchSongPostsResponse = ItemDetails[]
export type SearchForSongPostsTask = (dto: SearchSongPostsDto) => EitherAsync<SearchSongPostsError, SearchSongPostsResponse>


export type Env = {
    spotifySearch: SearchService;
    getSongPosts: GetSongPostsTask;
}

export const searchForSongPostsRoot = (env: Env): SearchForSongPostsTask => {
    return dto => EitherAsync(async ctx => {

        const validDto = await ctx.liftEither(
            searchSongPostsDtoCodec.decode(dto)
                .mapLeft<ApplicationError>(err => ({
                    name: ApplicationErrorNames.BAD_REQUEST,
                    message: err,
                    orig: err,
                }))
        );

        type _accumulator = [ TrackSubmissionSummary, SpotifyItem<TrackInfo> | null ][]

        const recurse = async (maxDepth: number, chunk: number, limit: number, initialDto: GetSongPostsDto, acc: _accumulator = []): Promise<_accumulator> => {

            const defaultsDto = R.merge(DEFAULTS, initialDto);

            if (maxDepth <= 0) {
                return acc;
            }

            if (acc.length >= limit) {
                return acc;
            }

            logger.debug(`top of recurse search`, {
                acc: {
                    seen: acc.length,
                    remDepth: maxDepth,
                    chunk
                },
                lastItem: P.List.last(acc).extractNullable()
            });


            // grab the submission id from the last seen result for pagination chunking
            const nextGetSongsDto: GetSongPostsDto = P.List.last(acc)
                .map(last => last[0].submission.id)
                .map<GetSongPostsDto>(id => ({...defaultsDto, opts: {after: id, limit: chunk}}))
                .orDefault(defaultsDto);
            logger.debug(`calling getSongPosts with...`, {data: nextGetSongsDto});

            const deDupedAccum = R.uniqBy(([ _, spot ]) => spot != null, acc);

            const trackPosts = await ctx.fromPromise(env.getSongPosts(nextGetSongsDto)
                .mapLeft<SearchSongPostsError>(err => ({
                    name: SearchSongPostsErrorReasons.SERVICE_ERROR,
                    message: 'could not reach song post search service',
                    orig: err.orig
                }))
                .ifLeft(_ => logger.debug(`getSongPosts service failed`))
                .ifLeft(logger.error)
                .run());


            const trackLocationTasks = trackPosts.map(post => {
                return env.spotifySearch.searchForTrack(post.trackInfo)
                    .map<[ TrackSubmissionSummary, SpotifyItem<TrackInfo>[] ]>(loc => [ post, loc ])
                    .mapLeft<SearchSongPostsError>(err => ({
                        name: SearchSongPostsErrorReasons.SERVICE_ERROR,
                        message: 'could not reach spotifySearch service',
                        orig: err.orig
                    }))
                    .ifLeft(err => logger.debug(`could not find track info`, {data: post.trackInfo, err: err}))
                    .ifRight(_ => logger.debug(`found track info`, {data: post.trackInfo}));
            });

            const potentialTrackLocations = await runEAsyncsWithDelaySeq(SPOTIFY_DELAY)(trackLocationTasks);

            const iterationResults: [ TrackSubmissionSummary, SpotifyItem<TrackInfo> | null ][] =
                potentialTrackLocations.rights.map(([ k, v ]) => {
                    return [ k, P.List.head(v).extractNullable() ];
                });

            logger.debug(`found ${ iterationResults.length } new results`);
            logger.debug(`last iteration result item id`, {item: iterationResults[iterationResults.length - 1]});


            return await recurse(maxDepth - chunk, chunk, limit, initialDto, [ ...deDupedAccum, ...iterationResults ]);
        };

        const chunk = CHUNK;
        const maxDepth = validDto.limit * 3;
        const time = validDto.type == 'top' ? validDto.time : 'all';
        const opts = null;

        const initialSearchDto: GetSongPostsDto = ({
            subreddit: validDto.subreddit,
            type: validDto.type,
            time,
            opts,
        });

        const temp = await recurse(maxDepth, chunk, validDto.limit, initialSearchDto, []);

        const items: ItemDetails[] = temp
            .map(([ sub, spot ]) => ({
                reddit: sub,
                track: sub.trackInfo,
                spotify: spot,
            }))
            .filter(x => R.propSatisfies(R.complement(R.isNil), 'spotify', x)) as ItemDetails[];


        logger.debug(`finished search with ${ items.length } results`);

        const byScore = R.descend<ItemDetails>(item => item.reddit.submission.score);

        return R.pipe(
            R.always(items),
            R.sort(byScore),
            items => R.slice(0, validDto.limit, items)  // ramda typings malfunction
        )();
    });
};


