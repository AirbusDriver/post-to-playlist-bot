import { Maybe }                   from 'purify-ts';
import * as R                      from 'ramda';
import { SpotifyTrack, TrackInfo } from './types';


// Return a string that removes capitalization and punctuation/whitespace distinctions
export const slugifyString: (s: string) => string = R.pipe(
    R.toLower,
    R.trim,
    R.replace(/[^\w\d]+/, '_')
);

// Return a slug string that a TrackInfo object
export const makeTrackSlug: (track: TrackInfo) => string = R.pipe(
    (x: TrackInfo) => R.over(R.lensProp('title'), slugifyString, x),
    x => R.over(R.lensProp('artist'), slugifyString, x),
    R.pick([ 'title', 'artist' ]),
    R.toPairs,
    R.sortBy(R.head),
    R.map(R.join(':')),
    R.join('&')
);

export const makeSpotifyTrackSlug: (track: SpotifyTrack) => string = R.pipe(
    R.over<any, any>(R.lensProp('item'), makeTrackSlug),
    R.pick([ 'id', 'item' ]),
    R.toPairs,
    R.sortBy(R.head), // sort by key
    R.map(R.join(':')),
    R.join('&')
);

export const trackEq: (track: TrackInfo, other: TrackInfo) => boolean = (track, other) => {
    return R.pipe(
        () => [ track, other ].map(makeTrackSlug),
        R.apply(R.equals, R.__ as unknown as string[])
    )();
};

export const spotifyTrackEq = (track: SpotifyTrack, other: SpotifyTrack): boolean => R.either(
    R.pipe(R.prop('item'), R.curry(trackEq)(track.item)),
    R.eqProps('id', track)
)(other);

export const findSpotifyTrack = (track: SpotifyTrack, tracks: SpotifyTrack[]): Maybe<SpotifyTrack> => {
    return Maybe.fromNullable(R.find(R.curry(spotifyTrackEq)(track), tracks));
};

export const deDupeSpotifyTracks: (tracks: SpotifyTrack[]) => SpotifyTrack[] = R.uniqBy(makeSpotifyTrackSlug);