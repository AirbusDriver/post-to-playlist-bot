import * as P from 'purify-ts';


/** Return a codec that is wrapped in the `body` parameter as returned by the SpotifyWebApi */
export const spotifyWebApiCodecFactory = <T>(codec: P.Codec<T>) => P.Codec.interface({
    body: codec,
    statusCode: P.number,
    headers: P.record(P.string, P.string),
});