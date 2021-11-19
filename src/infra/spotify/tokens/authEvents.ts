import { SpotifyError }  from "@infra/spotify/errors";
import { AuthTokens }    from "@infra/spotify/tokens/types";
import EventEmitter      from "events";
import TypedEventEmitter from "typed-emitter";


type SpotifyAuthEvents = {
    tokenTimeout: (tokens: AuthTokens) => void;
    tokensRefreshed: () => void;
    tokenRefreshFailed: (error: SpotifyError) => void;
    stopCheckEveryRaised: () => void;

}

export const spotifyAuthEventEmitter = new EventEmitter() as TypedEventEmitter<SpotifyAuthEvents>;

export default spotifyAuthEventEmitter

