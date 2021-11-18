/**
 *
 * This script shows an example of using the library of services to pull songs from a subreddit
 * and print them to the console. The script will continue to run since the Spotify auth service
 * was started by requesting the instance.
 *
 */
import { liftEA }                                        from '@fns';
import { getClient }                                     from '@infra/reddit';
import { getSongPostsFromSubredditTaskRoot }             from '@infra/reddit/songPosts';
import { createSearchService, getAuthorizedClientCache } from '@infra/spotify';
import * as P                                            from 'purify-ts';
import { EitherAsync }                                   from 'purify-ts';
import * as R                                            from 'ramda';


const subreddit = 'metalcore';


const main = EitherAsync(async ctx => {

    const client = await ctx.liftEither(getClient());

    const spotify = await ctx.fromPromise(getAuthorizedClientCache.getLazy());

    const search = createSearchService(spotify);

    const songDetails = await ctx.fromPromise(getSongPostsFromSubredditTaskRoot(client)({
        subreddit,
        type: 'hot',
        opts: {limit: 10}
    }).run());

    const songLocationDetails = await Promise.all(
        songDetails.map(track => {
            return search.searchForTrack({track: track.trackInfo})
                .ifLeft(console.error)
                .mapLeft(R.prop('message'))
                .chain(locList =>
                    liftEA(P.NonEmptyList.fromArray(locList)
                        .chain(P.List.head)
                        .toEither(`no result for ${ track.trackInfo.artist } - ${ track.trackInfo.title }`)
                        .map(locResult => R.merge(track, {spotify: locResult}))))
                .run();
        })
    );


    console.log(JSON.stringify(
        songLocationDetails.map(
            s =>
                s.map(r => [ r.submission.title, R.pick([ 'spotify', 'trackInfo' ], r) ])
                    .extract()
        )
        , null, 2)
    );


});
main.ifLeft(console.error).run();
