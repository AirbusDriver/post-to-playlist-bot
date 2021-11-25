export type SpotifyItem<T> = {
    id: string,
    uri: string,
    item: T,
}


export type TrackInfo = {
    title: string;
    artist: string;
}

export type SpotifyTrack = SpotifyItem<TrackInfo>

export type PlaylistInfo = {
    name: string,
    description: string,
    tracks: SpotifyTrack[];
}

export type SpotifyPlaylistInfo = SpotifyItem<PlaylistInfo>


export type PostInfo = {
    title: string,
    id: string,
    url: string,
}


type Timeframe = 'all' | 'year' | 'month' | 'week'


// Some searches should have the timeframe for the search
export type TimedCollectionRule = {
    type: 'top';
    timeframe: Timeframe;
    number: number;
}

export type TrendingCollectionRule = {
    type: 'hot' | 'new' | 'rising';
    number: number;
}

type TrackCollectionRule = TimedCollectionRule | TrendingCollectionRule;

// A subreddit can be the source of both hot 10 and top 10 - all for example
type SubredditRule = {
    subreddit: string;
    rule: TrackCollectionRule
}

// The tracks and the source search they originated from
export type TrackCollection = {
    rule: SubredditRule;
    tracks: TrackInfo[];
}

export type TrackSearchResults = {
    rules: TrackCollectionRule[];
    collections: TrackCollection[];
}

// a user defined playlist definition
export type PlaylistDefinition = {
    name: string;
    description: string;
    rules: {
        rate: 'daily' | 'weekly' | 'monthly',
        sources: SubredditRule[]
    }
}
