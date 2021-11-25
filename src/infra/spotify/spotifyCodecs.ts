import { spotifyWebApiCodecFactory } from '@infra/spotify/spotifyWebApiUtils';
import * as P                        from 'purify-ts';

//// Raw Web API Response Codecs ////

/**
 * These are the codecs pertaining to the responses from the raw web api.
 */

// Listings //

/** Base listing codec. `items` is an array(unknown) and should be overridden in
 * the codecs that intersect with it.
 */
const spotifySearchListingCodec = P.Codec.interface({
    href: P.string,
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
    artist = 'artist',
    playlist = 'playlist',
}


const itemTypeCodec = P.enumeration(ItemType);

/** base item codec for all listings in the result of a search */
const baseListItem = P.Codec.interface({
    external_urls: P.Codec.interface({
        spotify: P.optional(P.string)
    }),
    href: P.string,
    id: P.string,
    type: itemTypeCodec,
    uri: P.string,
    name: P.string,
});

export type BaseListItem = P.GetType<typeof baseListItem>


const spotifyTrackArtistItemCodec = P.intersect(
    baseListItem,
    P.Codec.interface({
        href: P.string
    })
);

const spotifyAlbumItemCodec = P.intersect(
    baseListItem,
    P.Codec.interface({
        artists: P.array(spotifyTrackArtistItemCodec),
        release_date: P.string,
    })
);

export const spotifyTrackItemCodec = P.intersect(
    baseListItem,
    P.Codec.interface({
        album: spotifyAlbumItemCodec,
        artists: P.array(spotifyTrackArtistItemCodec),
        external_urls: P.Codec.interface({
            spotify: P.optional(P.string)
        }),
        popularity: P.number,
    })
);

export type SpotifyTrackItem = P.GetType<typeof spotifyTrackItemCodec>;


const spotifyTrackSearchResponseCodec = P.Codec.interface({
    tracks: P.intersect(
        spotifySearchListingCodec,
        P.Codec.interface({
            items: P.array(spotifyTrackItemCodec),
        }))
});


export const spotifyPlaylistSummaryItemCodec = P.intersect(
    baseListItem,
    P.Codec.interface({
        description: P.string,
        tracks: P.Codec.interface({
            href: P.string,
            total: P.number,
        })
    }));


export type SpotifyPlaylistSummaryItem = P.GetType<typeof spotifyPlaylistSummaryItemCodec>


// result of /me/playlists
const spotifyPlaylistSearchResponse = P.intersect(
    spotifySearchListingCodec,
    P.Codec.interface({
        items: P.array(spotifyPlaylistSummaryItemCodec)
    })
);

//// SpotifyWebApi Codecs ////

/**
 * Use these for anything from the SpotifyWebApi library since the responses
 * must be wrapped
 */

/** Codec for "searchTracks" response */
export const spotifyApiTrackSearchResponseCodec = spotifyWebApiCodecFactory(spotifyTrackSearchResponseCodec);

export type SpotifyTrackSearchResponse = P.GetType<typeof spotifyApiTrackSearchResponseCodec>

export const spotifyApiGetMyPlaylistsResponseCodec = spotifyWebApiCodecFactory(spotifyPlaylistSearchResponse);

export type SpotifyGetMyPlaylistResponse = P.GetType<typeof spotifyApiGetMyPlaylistsResponseCodec>