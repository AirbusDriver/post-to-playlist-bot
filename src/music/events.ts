import { PlaylistActions }     from '@/music/playlists';
import { SpotifyPlaylistInfo } from '@/music/types';
import { RawError }            from '@/shared';
import TypedEventEmitter       from 'typed-emitter';
import { EventEmitter }        from 'events';


export interface MusicEvents {
    playlistUpdated: (playlist: SpotifyPlaylistInfo, actions: PlaylistActions) => void;
    playlistUpdateFailed: (playlist: SpotifyPlaylistInfo, err: RawError<any>, msg?: string) => void;
}


export const musicEventEmitter: TypedEventEmitter<MusicEvents> = new EventEmitter();



