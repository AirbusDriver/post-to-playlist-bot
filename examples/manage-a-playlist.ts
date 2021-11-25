import { getActions }                                              from '@/music/playlists';
import { searchForSongPostsRoot, SearchSongPostsDto }              from '@/music/searchForSongPosts.root';
import { getSongPostsFromSubredditTaskRoot }                       from '@infra/reddit/songPosts/index';
import { createSearchServiceFromClient, getAuthorizedClientCache } from '@infra/spotify';
import { searchUserPlaylistsWithRoot }                             from '@infra/spotify/playlists/searchUserPlaylists';
import { mapSpotifyErrorResponseToSpotifyError }                   from '@infra/spotify/spotifyWebApiUtils';
import { liftEA }                                                  from '@shared/fns';
import * as P                                                      from 'purify-ts';
import { EitherAsync, Maybe }                                      from 'purify-ts';
import * as R                                                      from 'ramda';
import { getClient }                                               from '../src/infra/reddit';


const NAME = 'ar/heavy';

const detailsBlurb = () => (
    'A dynamic playlist made from the current posts on r/hardcore, r/revivalcore, & r/deathcore. Last updated at ' +
    `${ new Date(Date.now()).toLocaleString() }`
);


const rules: SearchSongPostsDto[] = [
    {type: 'hot', limit: 10, subreddit: 'deathcore'},
    {type: 'top', limit: 5, time: 'week', subreddit: 'deathcore'},
    {type: 'hot', limit: 10, subreddit: 'revivalcore'},
    {type: 'top', limit: 5, time: 'week', subreddit: 'revivalcore'},
    {type: 'hot', limit: 10, subreddit: 'hardcore'},
    {type: 'top', limit: 5, time: 'week', subreddit: 'hardcore'},
];

const prog = EitherAsync(async ctx => {

    const client = await ctx.fromPromise(getAuthorizedClientCache.getLazy());
    const redditClient = await ctx.liftEither(getClient());

    const playlist = await ctx.fromPromise(searchUserPlaylistsWithRoot({client})(R.propEq('name', NAME))
        .chain(x => liftEA(Maybe.fromNullable(x).toEither('no playlist for id')))
        .run());

    const songPostsSearch = searchForSongPostsRoot({
        spotifySearch: createSearchServiceFromClient(client),
        getSongPosts: getSongPostsFromSubredditTaskRoot(redditClient)
    });


    const playlistActions = await ctx.fromPromise(
        EitherAsync.sequence(rules.map(songPostsSearch))
            .map(R.flatten)
            .map(R.map(p => p.spotify))
            .map(getActions(playlist.item.tracks))
            .run()
    );


    const clientTasks = [
        EitherAsync(async () =>
            P.NonEmptyList.fromArray(playlistActions.ADD.map(r => r.uri))
                .map(async tracks => await client.addTracksToPlaylist(playlist.id, tracks))
                .ifJust(() => console.log(`added ${ playlistActions.ADD.length } tracks to ${ NAME }`)))
            .void()
            .mapLeft(mapSpotifyErrorResponseToSpotifyError),

        EitherAsync(async () =>
            P.NonEmptyList.fromArray(playlistActions.REMOVE.map(r => ({uri: r.uri})))
                .map(async tracks => await client.removeTracksFromPlaylist(playlist.id, tracks))
                .ifJust(() => console.log(`removed ${ playlistActions.REMOVE.length } tracks from ${ NAME }`)))
            .void()
            .mapLeft(mapSpotifyErrorResponseToSpotifyError),

        EitherAsync(async () => client.changePlaylistDetails(playlist.id, {
            description: detailsBlurb()
        }))
            .ifRight(_ => console.log('updated description'))
            .void()
    ];

    await EitherAsync.sequence(clientTasks).run();

});


prog.bimap(console.error, console.log).run();