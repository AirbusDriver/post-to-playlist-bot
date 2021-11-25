import { playlistDefinitionCodec } from '@/music/codecs';
import { PlaylistDefinition }      from '@/music/types';
import * as R                      from 'ramda';


const validPlaylistDefinition: PlaylistDefinition = {
    name: 'my playlist',
    description: 'angry music for happy people',
    rules: {
        rate: 'daily',
        sources: [
            {
                subreddit: 'metalcore',
                rule: {
                    type: 'hot',
                    number: 10
                }
            },
            {
                subreddit: 'hardcore',
                rule: {
                    type: 'top',
                    number: 10,
                    timeframe: 'week'
                }
            }
        ]
    }
};

describe('playlistDefinitionCodec', () => {

    const result = playlistDefinitionCodec.decode(validPlaylistDefinition);

    it('parses', () => {
        expect(result.isRight()).toBe(true);
    });

    it('parses rules', () => {
        expect(
            result
                .map(R.prop('rules'))
                .map(r => R.equals(r.sources, validPlaylistDefinition.rules.sources))
                .extract()
        ).toBe(true);
    });
});