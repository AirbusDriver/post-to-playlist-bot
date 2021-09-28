export type TrackInfo = {
    title: string;
    artist: string;
}


export type SpotifyItem<T> = {
    id: string,
    uri: string,
    item: T,
}


export type PlaylistInfo = {
    name: string,
    tracks: TrackInfo[];
}

