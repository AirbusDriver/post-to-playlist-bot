import { PostInfo } from '@/music/types';
import * as P       from 'purify-ts';


type PostInfoCodec = P.Codec<P.FromType<PostInfo>>;
export const postInfoCodec = P.Codec.interface({
    title: P.string,
    id: P.string,
    url: P.string,
});


