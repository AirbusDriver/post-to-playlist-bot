# Post-to-Playlist-Bot

## What's This?

This is a work in progress. But eventually it will be a deployable Node app that
manage playlists from your personal Spotify account by syncing the music that is
post to Reddit. A simple config file will determine which playlists are to be managed
and by which source. You can combine multiple subreddit sources as well as do things
like leave the top 10 songs in the playlist, while keeping the current "hot 50" song 
in step with the playlist.

## Roadmap

- [ ] ESlint/prettier
- [ ] `Music` module commands and service implementation
- [ ] Yaml parsing
- [ ] Express server scheduling
- [ ] CLI
- [ ] Vote decay vs activity
- [ ] Email/Notification service
- [ ] UI
  - [ ] Config editing via UI
  - [ ] Log reading
  - [ ] OAuth2 support for Spotify and Reddit via UI


## Usage

Currently the library is being fleshed out, but this is a basic example of how the 
services are used under the hood. [Purify-ts](https://gigobyte.github.io/purify/) is used extensively as monad library 
and the rest of the library will continue to be written in the functional style
using it. Because of this, you can use the escape hatch `Either.extract()` if you
want to handle the errors/value contained in the monad in the more common imperative
style. 

## Example
#### More examples can be found in the src/examples folder

*This **will** break. Soon.*

```typescript
import { getClient }                                     from '@/infra/reddit';
import { createSearchService, getAuthorizedClientCache } from '@/infra/spotify';
import * as P                                            from 'purify-ts';
import { EitherAsync }                                   from 'purify-ts';
import * as R                                            from 'ramda';
import { getSongPostsFromSubredditTaskRoot }             from '../src/infra/reddit/songPosts';
import { liftEA }                                        from '../src/shared/fns';


const subreddit = 'metalcore';


const main = EitherAsync(async ctx => {

    // clients that have a failable config can use do notation to fail early
    const client = await ctx.liftEither(getClient());

    // clients can be cached to retrieve the config once in case the
    // config service is remote or expensive
    const spotify = await ctx.fromPromise(getAuthorizedClientCache.getLazy()); 

    // services are piece-meal for now, they won't need to be used client side
    // directly, they will be wrapped up into domain modules that are picked
    // at runtime. ie functional DI via partial application in index.ts files
    // or ____.command.ts files
    const search = createSearchService(spotify);

    // gets subreddit hot posts that have song titles or bails the script
    // if a service error occurs. This is safe and will not throw
    const songDetails = await ctx.fromPromise(getSongPostsFromSubredditTaskRoot(client)({
        subreddit,
        searchType: 'hot',
        opts: {limit: 100}
    }).run());

    // create tasks that look for the uri details on Spotify and merges them into
    // a sum type or returns a Left(string) with the reason it failed
    const songLocationDetails = await Promise.all(
        songDetails.map(track => {
            return search.searchForTrack(track.trackInfo)
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


    // print the results to the console
    // next steps could be to pull the associated playlist from Spotify and 
    // add any songs present here to that playlist that don't exist on it
    console.log(JSON.stringify(
        songLocationDetails.map(
            s =>
                s.map(r => [ r.submission.title, R.pick([ 'spotify', 'trackInfo' ], r) ])
                    .extract()
        )
        , null, 2)
    );


});

// since the main is just another task, it will never .catch() but may return a 
// Left. So log it to error. Since the auth services are running the script won't 
// terminate. You could schedule this to run on an interval and it will never throw
main.ifLeft(console.error).run();
```