import { spotifyWebApiCodecFactory } from '@infra/spotify/codecs';
import * as P                        from 'purify-ts';

//// Raw Web API Response Codecs ////


// Listings //

/** Base listing codec. `items` is an array(unknown) and should be overridden in
 * the codecs that intersect with it.
 */
const spotifySearchListingCodec = P.Codec.interface({
    href: P.string,
    items: P.array(P.unknown),
    limit: P.number,
    next: P.nullable(P.string),
    offset: P.number,
    previous: P.nullable(P.string),
    total: P.number
});


// Items //

enum ItemType {
    track = 'track',
    album = 'album',
    artist = 'artist'
}


const itemTypeCodec = P.enumeration(ItemType);

/** base item codec */
const baseSearchItem = P.Codec.interface({
    external_urls: P.Codec.interface({
        spotify: P.optional(P.string)
    }),
    href: P.string,
    id: P.string,
    type: itemTypeCodec,
    uri: P.string,
    name: P.string,
});


const trackArtistItemCodec = P.intersect(
    baseSearchItem,
    P.Codec.interface({
        href: P.string
    })
);

const albumItemCodec = P.intersect(
    baseSearchItem,
    P.Codec.interface({
        artists: P.array(trackArtistItemCodec),
        release_date: P.string,
    })
);

export const trackItemCodec = P.intersect(
    baseSearchItem,
    P.Codec.interface({
        album: albumItemCodec,
        artists: P.array(trackArtistItemCodec),
        external_urls: P.Codec.interface({
            spotify: P.optional(P.string)
        }),
        popularity: P.number,
    })
);

export type TrackItem = P.GetType<typeof trackItemCodec>;


const trackSearchResponseCodec = P.Codec.interface({
    tracks: P.intersect(
        spotifySearchListingCodec,
        P.Codec.interface({
            items: P.array(trackItemCodec),
        }))
});


//// SpotifyWebApi Codecs ////

/** Codec for "searchTracks" response */
export const spotifyApiTrackSearchResponseCodec = spotifyWebApiCodecFactory(trackSearchResponseCodec);

export type TrackSearchResponse = P.GetType<typeof spotifyApiTrackSearchResponseCodec>