import {
    searchForSongPostsRoot,
    Env as searchForSongEnv
}                                            from '../src/music/searchForSongPosts.controller.json.express';
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


// Logs...
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
//     {
//         "reddit": {
//             "trackInfo": {
//                 "artist": "Animosity",
//                 "title": "The Black Page"
//             },
//             "submission": {
//                 "id": "qvjigf",
//                 "title": "Animosity - The Black Page",
//                 "created_utc": 1637100492,
//                 "permalink": "/r/Deathcore/comments/qvjigf/animosity_the_black_page/",
//                 "score": 13,
//                 "upvote_ratio": 0.94
//             }
//         },
//         "track": {
//             "artist": "Animosity",
//             "title": "The Black Page"
//         },
//         "spotify": {
//             "item": {
//                 "title": "The Black Page",
//                 "artist": "Animosity"
//             },
//             "uri": "spotify:track:1Q6q21crre49w7vS4lXHgq",
//             "id": "1Q6q21crre49w7vS4lXHgq"
//         }
//     },
//     {
//         "reddit": {
//             "trackInfo": {
//                 "artist": "A Night in Texas",
//                 "title": "The Divine Dichotomy"
//             },
//             "submission": {
//                 "id": "qu55nb",
//                 "title": "A Night in Texas - The Divine Dichotomy (almost) 6 months later",
//                 "created_utc": 1636941110,
//                 "permalink": "/r/Deathcore/comments/qu55nb/a_night_in_texas_the_divine_dichotomy_almost_6/",
//                 "score": 13,
//                 "upvote_ratio": 0.82
//             }
//         },
//         "track": {
//             "artist": "A Night in Texas",
//             "title": "The Divine Dichotomy"
//         },
//         "spotify": {
//             "item": {
//                 "title": "Feed the Lions",
//                 "artist": "A Night In Texas"
//             },
//             "uri": "spotify:track:4HZu65LqF18Jg5wJQpMpCh",
//             "id": "4HZu65LqF18Jg5wJQpMpCh"
//         }
//     },
