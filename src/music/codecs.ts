import { PlaylistDefinition, PostInfo, TimedCollectionRule, TrackInfo, TrendingCollectionRule, } from '@/music/types';
import * as P                                                                                    from 'purify-ts';


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

type TrendingCollectionRuleCodec = P.Codec<P.FromType<TrendingCollectionRule>>
const trendingCollectionRuleCodec: TrendingCollectionRuleCodec = P.Codec.interface({
    type: P.exactly('hot', 'new', 'rising'),
    number: P.number,
});

type TimedCollectionRuleCode = P.Codec<P.FromType<TimedCollectionRule>>
const timedCollectionRuleCodec: TimedCollectionRuleCode = P.Codec.interface({
    type: P.exactly('top'),
    number: P.number,
    timeframe: P.exactly('all', 'year', 'month', 'week')
});

type PlaylistDefinitionCodec = P.Codec<P.FromType<PlaylistDefinition>>
export const playlistDefinitionCodec: PlaylistDefinitionCodec = P.Codec.interface({
    id: P.string,
    name: P.string,
    description: P.string,
    rules: P.Codec.interface({
        rate: P.exactly('daily', 'weekly', 'monthly'),
        sources: P.array(
            P.Codec.interface({
                subreddit: P.string,
                rule: P.oneOf([ timedCollectionRuleCodec, trendingCollectionRuleCodec ])
            }))
    })
});

