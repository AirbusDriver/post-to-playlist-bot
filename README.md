# Post-to-Playlist-Bot

## What's This?

This is a work in progress. It's really just a playground for me to figure out an acceptable FP architecture that
loosely operates like ports/adapters. But eventually it will be a deployable Node app that manage playlists from your
personal Spotify account by syncing the music that is ItemDetails to Reddit. A simple config file will determine which
playlists are to be managed and by which source. You can combine multiple subreddit sources as well as do things like
leave the top 10 songs in the playlist, while keeping the current "hot 50" song in step with the playlist.

## Roadmap

- [ ] `Music` module commands and service implementation
    - [x] `/api/music/song-posts` vertical slice
    - [x] `/api/music/track-locations/:tracks[]` endpoint
        - [ ] `/music/service`
            - [x] `/music/service/trackLocations.syncPlaylistCommand`
    - [x] `/api/music/*` caching
- [ ] Express server scheduling
    - [x] Sync from directory job
        - [ ] Task schedule flags
- [ ] CLI
    - [ ] Music module cli
        - [x] Sync playlists dir/*.json to sync all playlists in directory
    - [ ] Docs

maybe...

- [ ] UI
    - [ ] Config editing via UI
    - [ ] Log reading
    - [ ] OAuth2 support for Spotify and Reddit via UI

## Deployment

There are currently two ways to deploy a bot of your own. Git clone or Docker pull. I recommend the Docker route.
Regardless of how you get the app, you'll need to have both a registered Reddit script app, and a registered Spotify
app.

1) Make some directory to hold your bot info

```shell
mkdir ~/thrash-bot
```

2) Create an env file based on `.env.sample` from the repo.

```shell

## ~/thrash-bot/thrashBotEnv

REDDIT_SECRET=my_reddit_secret
REDDIT_CLIENT_ID=my_client_id
REDDIT_USER_AGENT=METAL BOT
REDDIT_USERNAME=my_username
REDDIT_PASSWORD=my_password

SPOTIFY_CLIENT_ID=some_client_id
SPOTIFY_SECRET=some_client_secret
SPOTIFY_CREDS_FILE=/var/reddit-dj/testCreds.json
SPOTIFY_CODE_FILE=/var/reddit-dj/authCode.txt

PLAYLIST_DIR=/var/reddit-dj/playlists

```

3) Go to your Reddit account's third party app settings and create a new bot of the "script" type. You will receive a
   client id and a client secret. Fill out the `REDDIT_` keys with these new. If you already have a registered script
   bot, you can just use that.

4) Go to https://developer.spotify.com and create an app there. Do the same thing with those keys

5) Now get pull the image from Dockerhub

```shell
docker pull ajtruant/reddit-dj-bot:latest
```

6) Now, let's make a playlist on Spotify like you usually would. Maybe call it "REE REE REEREEREE"

7) Now let's fill that baby up with deathcore goodness. `mkdir ~/thrash-bot/playlists`

`> ~/thrash-bot/playlists/pigGrunt.json`

```json5
{
  "id": "her749349437",
  // whatever your id is from your playlist,
  "name": "REE REE REEREEREE",
  "description": "whatever r/deathcore is up to this week",
  "rules": {
    "rate": "daily",
    // this is broken but do it anyway,
    "sources": [
      {
        "subreddit": "deathcore",
        "rule": {
          "type": "top",
          "number": 15,
          "timeframe": "week"
        }
      },
      {
        "subreddit": "deathcore",
        "rule": {
          "type": "hot",
          // no timeframe for "hot" searches
          "number": 10
        }
      }
    ]
  }
}

```

8) Now... Spotify requires Oath2. So that gets complicated with a CLI based bot. Don't bite your lip ring off, I took
   care of that. But you'll want to pay attention if you aren't used to Docker.

```shell
docker run --rm 
--env-file ~/thrash-bot/thrashBotEnv \
--mount type=bind,src="~/thrash-bot",dst="/var/reddit-dj" \
-it reddit-dj-bot \
npm run get-spotify-tokens
```

**IMPORTANT** we're throwing this away with the `--rm` flag. As soon as we finish our token flow we want to start over.

This will take you through a workflow to get your oath tokens and store them in your `~/thrash-bot` directory

9) Now we run the jobs.

```shell
docker run \
--env-file ~/thrash-bot/thrashBotEnv \
--name thrash-bot 
--mount type=bind,src="~/thrash-bot",dst="/var/reddit-dj" \
-d reddit-dj-bot \
npm run start-jobs
```

You can use whatever you want for the `--name` flag. Also the `-d` flag is optional. It just pushes it back to the
daemon. If you aren't familiar with Docker, just omit it but you'll commit your shell to the process, which is fine if
you're into that sorta thing.

And off it goes! Currently, it will run once an hour, but some changes are coming to make this tunable. If you ran
with `-d`, you can check in on it with `docker logs thrash-bot`.

## Contributions

Currently the library is being fleshed out, but this is a basic example of how the services are used under the
hood. [Purify-ts](https://gigobyte.github.io/purify/) is used extensively as monad library and the rest of the library
will continue to be written in the functional style using it. Because of this, you can use the escape
hatch `Either.extract()` if you want to handle the errors/value contained in the monad in the more common imperative
style.

## Example

More examples can be found in the src/examples folder

*This **will** break. Soon.*

## Search for posts that have tracks and fetch the track locations from the Spotify API

```typescript

import {
    searchForSongPosts,
    Env as searchForSongEnv
}                                            from '@/music/searchForSongPosts.controller.json';
import { getSongPostsFromSubredditTaskRoot } from '@/infra/reddit/songPosts';
import { getClient }                         from '@/infra/reddit';
import { createSearchServiceFromClient }     from '@/infra/spotify/search';
import { _getAuthorizedClientTask }          from '@/infra/spotify';
import { liftEA }                            from '@fns';
import { stringifyJsonSafe }                 from '@fns/json';
import * as P                                from 'purify-ts';
import * as R                                from 'ramda';


const main = P.EitherAsync(async ctx => {

    const songPostLookup = await ctx.liftEither(getClient().ap(P.Right(getSongPostsFromSubredditTaskRoot)));
    const searchService = await ctx.fromPromise(_getAuthorizedClientTask.map(createSearchServiceFromClient).run());

    const env: searchForSongEnv = {
        getSongPostsFromReddit: songPostLookup,
        spotifySearch: searchService,
    };


    const subreddit = 'deathcore';
    const search = 'hot';
    const limit = 25;

    const task = searchForSongPosts(env);

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

main.ifRight(results => console.log(results.extract())).run();

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
//     ...
// ]

```

## Spotify search services are memcached. Use them to search for multiple tracks

```typescript

/**
 *
 * When calling out to track search service, any recently searched TrackInfo items
 * will be cached in memory. Unless you're planing on doing your own rate limiting,
 * use the searchService to offload from Spotify API so you arent pressed up against
 * rate limit errors.
 *
 */
import { createSearchServiceFromClient, getAuthorizedClientCache } from '@/infra/spotify';
import getSpotifyLogger                                            from '@infra/spotify/logger';
import songMemoryCacheCacheIO                                      from '@infra/spotify/search/trackCache';
import { stringifyJsonUnsafe }                                     from '@shared/fns/json';
import { EitherAsync }                                             from 'purify-ts';


const prog = EitherAsync<any, any>(async ctx => {

    const client = await ctx.fromPromise(getAuthorizedClientCache.getLazy());

    const searchService = createSearchServiceFromClient(client);

    getSpotifyLogger().info('service started');

    const songsDtos = [
        {title: 'cowboy dan', artist: 'modest mouse'},
        {title: 'decimation', artist: 'oh sleeper'},
        {title: 'counting worms', artist: 'knocked loose'},
    ];

    const _cache = songMemoryCacheCacheIO.getLazy(); // you should never need to interact with this directly

    const initStats = _cache._cache.getStats();

    const task = EitherAsync(async ctx => {
        const start = Date.now();
        const result = await searchService.searchForManyTracks({tracks: songsDtos})
            .map(results => results.length).run();
        const stop = Date.now();

        return {
            results: result,
            time: stop - start,
        };
    });

    const result_01 = await task.run();
    const result_02 = await task.run();
    const result_03 = await task.run();

    const results = {
        run_01: result_01,
        run_02: result_02,
        run_03: result_03,
        initStats,
        stats: _cache._cache.getStats()
    };

    console.log(stringifyJsonUnsafe(2)(results));

});


prog.run();

/**
 ...
 {
  "run_01": {
    "results": 3,
    "time": 1394
  },
  "run_02": {
    "results": 3,
    "time": 3
  },
  "run_03": {
    "results": 3,
    "time": 2
  },
  "initStats": {
    "hits": 6,
    "misses": 3,
    "keys": 3,
    "ksize": 111,
    "vsize": 9897
  },
  "stats": {
    "hits": 6,
    "misses": 3,
    "keys": 3,
    "ksize": 111,
    "vsize": 9897
  }
}

 */

```
