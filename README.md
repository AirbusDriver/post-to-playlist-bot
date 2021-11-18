# Post-to-Playlist-Bot

## What's This?

This is a work in progress. It's really just a playground for me to figure out an acceptable FP architecture that looses
operates like ports/adapters. But eventually it will be a deployable Node app that manage playlists from your personal
Spotify account by syncing the music that is ItemDetails to Reddit. A simple config file will determine which playlists
are to be managed and by which source. You can combine multiple subreddit sources as well as do things like leave the
top 10 songs in the playlist, while keeping the current "hot 50" song in step with the playlist.

## Roadmap

- [ ] `Music` module commands and service implementation
    - [x] `/api/music/song-posts` vertical slice
    - [ ] `/api/music/track-locations/:tracks[]` endpoint
        - [ ] `/music/service`
            - [ ] `/music/service/trackLocations.command`
    - [x] `/api/music/*` caching
- [ ] Express server scheduling
- [ ] CLI
- [ ] Email/Notification service
- [ ] Yaml parsing
- [ ] UI
    - [ ] Config editing via UI
    - [ ] Log reading
    - [ ] OAuth2 support for Spotify and Reddit via UI

## Usage

Currently the library is being fleshed out, but this is a basic example of how the services are used under the
hood. [Purify-ts](https://gigobyte.github.io/purify/) is used extensively as monad library and the rest of the library
will continue to be written in the functional style using it. Because of this, you can use the escape
hatch `Either.extract()` if you want to handle the errors/value contained in the monad in the more common imperative
style.

## Example

#### More examples can be found in the src/examples folder

*This **will** break. Soon.*

```typescript

import {
    searchForSongPostsRoot,
    Env as searchForSongEnv
}                                            from '@/music/searchForSongPosts.controller.json';
import { getSongPostsFromSubredditTaskRoot } from '@/infra/reddit/songPosts';
import { getClient }                         from '@/infra/reddit';
import { createSearchService }               from '@/infra/spotify/search';
import { getAuthorizedClientTask }           from '@/infra/spotify';
import { liftEA }                            from '@fns';
import { stringifyJsonSafe }                 from '@fns/json';
import * as P                                from 'purify-ts';
import * as R                                from 'ramda';


const main = P.EitherAsync(async ctx => {

    const songPostLookup = await ctx.liftEither(getClient().ap(P.Right(getSongPostsFromSubredditTaskRoot)));
    const searchService = await ctx.fromPromise(getAuthorizedClientTask.map(createSearchService).run());

    const env: searchForSongEnv = {
        getSongPosts: songPostLookup,
        spotifySearch: searchService,
    };


    const subreddit = 'deathcore';
    const search = 'hot';
    const limit = 25;

    const task = searchForSongPostsRoot(env);

    return task({
        type: search,
        limit,
        subreddit
    })
        .chain(R.pipe(stringifyJsonSafe(2, undefined), liftEA))
        .chainLeft(R.pipe(stringifyJsonSafe(2, undefined), liftEA))
        .ifLeft(console.error)
        .run();
});


main.ifRight(resp => console.log(resp.extract())).run();


//
// [
//     {
//         "reddit": {
//             "trackInfo": {
//                 "artist": "Worm Shepherd",
//                 "title": "Chalice Ov Rebirth"
//             },
//             "submission": {
//                 "id": "quw4v3",
//                 "title": "Worm Shepherd - Chalice Ov Rebirth",
//                 "created_utc": 1637026763,
//                 "permalink": "/r/Deathcore/comments/quw4v3/worm_shepherd_chalice_ov_rebirth/",
//                 "score": 78,
//                 "upvote_ratio": 0.98
//             }
//         },
//         "track": {
//             "artist": "Worm Shepherd",
//             "title": "Chalice Ov Rebirth"
//         },
//         "spotify": {
//             "item": {
//                 "title": "Chalice Ov Rebirth",
//                 "artist": "Worm Shepherd"
//             },
//             "uri": "spotify:track:0Rq4iWroZh0k2CTpKwQisL",
//             "id": "0Rq4iWroZh0k2CTpKwQisL"
//         }
//     },
//     {
//         "reddit": {
//             "trackInfo": {
//                 "artist": "See You Next Tuesday",
//                 "title": "A Portable Death Ray And A Sterile Claw Hammer"
//             },
//             "submission": {
//                 "id": "qulzqy",
//                 "title": "See You Next Tuesday - A Portable Death Ray And A Sterile Claw Hammer",
//                 "created_utc": 1636998349,
//                 "permalink": "/r/Deathcore/comments/qulzqy/see_you_next_tuesday_a_portable_death_ray_and_a/",
//                 "score": 77,
//                 "upvote_ratio": 0.98
//             }
//         },
//         "track": {
//             "artist": "See You Next Tuesday",
//             "title": "A Portable Death Ray And A Sterile Claw Hammer"
//         },
//         "spotify": {
//             "item": {
//                 "title": "A Portable Death Ray and a Sterile Claw Hammer",
//                 "artist": "See You Next Tuesday"
//             },
//             "uri": "spotify:track:71M34BdLve1QsUBCq0PwXy",
//             "id": "71M34BdLve1QsUBCq0PwXy"
//         }
//     },
//     {
//         "reddit": {
//             "trackInfo": {
//                 "artist": "Angelmaker",
//                 "title": "Lazarus"
//             },
//             "submission": {
//                 "id": "qvk35w",
//                 "title": "Angelmaker - Lazarus",
//                 "created_utc": 1637102077,
//                 "permalink": "/r/Deathcore/comments/qvk35w/angelmaker_lazarus/",
//                 "score": 32,
//                 "upvote_ratio": 0.97
//             }
//         },
//         "track": {
//             "artist": "Angelmaker",
//             "title": "Lazarus"
//         },
//         "spotify": {
//             "item": {
//                 "title": "Lazarus",
//                 "artist": "Angelmaker"
//             },
//             "uri": "spotify:track:244ERJAd6yzW5JyjyuUkv5",
//             "id": "244ERJAd6yzW5JyjyuUkv5"
//         }
//     },
//     {
//         "reddit": {
//             "trackInfo": {
//                 "artist": "Shadow of Intent",
//                 "title": "Intensified Genocide"
//             },
//             "submission": {
//                 "id": "qvfd9s",
//                 "title": "Shadow of Intent - Intensified Genocide",
//                 "created_utc": 1637089591,
//                 "permalink": "/r/Deathcore/comments/qvfd9s/shadow_of_intent_intensified_genocide/",
//                 "score": 30,
//                 "upvote_ratio": 0.94
//             }
//         },
//         "track": {
//             "artist": "Shadow of Intent",
//             "title": "Intensified Genocide"
//         },
//         "spotify": {
//             "item": {
//                 "title": "Intensified Genocide",
//                 "artist": "Shadow of Intent"
//             },
//             "uri": "spotify:track:7a3YsV6fIe8KJfaFRtPu4s",
//             "id": "7a3YsV6fIe8KJfaFRtPu4s"
//         }
//     },
//     {
//         "reddit": {
//             "trackInfo": {
//                 "artist": "Distant",
//                 "title": "Oedipism"
//             },
//             "submission": {
//                 "id": "qtrfx6",
//                 "title": "Distant - \"Oedipism\" one take cover by Alan Grnja",
//                 "created_utc": 1636901749,
//                 "permalink": "/r/Deathcore/comments/qtrfx6/distant_oedipism_one_take_cover_by_alan_grnja/",
//                 "score": 16,
//                 "upvote_ratio": 0.8
//             }
//         },
//         "track": {
//             "artist": "Distant",
//             "title": "Oedipism"
//         },
//         "spotify": {
//             "item": {
//                 "title": "Oedipism",
//                 "artist": "Distant"
//             },
//             "uri": "spotify:track:4nA4EL66VXDE6wQvtgWzB3",
//             "id": "4nA4EL66VXDE6wQvtgWzB3"
//         }
//     },
//     // ...
// ]

```

## How to Contribute

You don't want any part of this. I don't want any part of this. 