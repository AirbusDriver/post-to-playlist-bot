// import {searchForSongPosts}                                        from '../src/music/useCases/searchForSongPosts';
// import { readFileSyncSafe }                                        from '@fns/fileIO';
// import { parseJsonSafe }                                           from '@fns/json';
// import { getClient }                                               from '@infra/reddit';
// import { getSongPostsFromSubredditTaskRoot }                       from '@infra/reddit/songPosts/index';
// import { createSearchServiceFromClient, getAuthorizedClientCache } from '@infra/spotify';
// import { searchUserPlaylistById }                                  from
// '@infra/spotify/playlists/searchUserPlaylists'; import { liftEA }
// from '@shared/fns'; import * as path                                                   from 'path'; import {
// EitherAsync }                                             from 'purify-ts'; import { syncPlaylistTaskRoot }
//                           from '../src/music/useCases/syncPlaylist'; import { createCommand }
//                    from 'commander';   const parse = () => { const prog = createCommand('sync-playlist')
// .requiredOption('-p', '--path <path>', 'path to playlist file');  return prog.parse(process.argv).opts(); };   const
// playlistPath = path.resolve(__dirname, 'playlists', 'ar-heavy.json');  const prog = EitherAsync(async ctx => {
// const client = await ctx.fromPromise(getAuthorizedClientCache.getLazy()); const redditClient = await
// ctx.liftEither(getClient());  const songPostsSearch = searchForSongPosts  const syncer = syncPlaylistTaskRoot({
// client, searchSongPosts: songPostsSearch, searchForPlaylist: searchUserPlaylistById({client}) });   await liftEA(readFileSyncSafe(playlistPath)() .chain<Error, any>(parseJsonSafe())) .chain(syncer) .ifRight(console.log) .run();   });   prog.bimap(console.error, console.log).run().then(() => process.exit());