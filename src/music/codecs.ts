import { PostInfo, TrackInfo } from '@/music/types';
import * as P                  from 'purify-ts';


export type TrackInfoCodec = P.Codec<P.FromType<TrackInfo>>
export const trackInfoCodec: TrackInfoCodec = P.Codec.interface({
    title: P.string,
    artist: P.string,
});


type PostInfoCodec = P.Codec<P.FromType<PostInfo>>;
export const postInfoCodec = P.Codec.interface({
    title: P.string,
    id: P.string,
    url: P.string,
});


