import { getSpotifyConfigSafe }                         from '../config';
import { FetchAuthTokensTask, fetchAuthTokensTaskRoot } from './fetchAuthTokensTask.root';


export const fetchAuthTokensTask: FetchAuthTokensTask = fetchAuthTokensTaskRoot(getSpotifyConfigSafe)
    .ifLeft(err => console.error(
        'an error occurred when attempting to fetch the Spotify auth tokens. Make sure that ' +
        'the file specified in the env file exists before trying to retrieve the tokens',
    ));

export { FetchAuthTokensTask };
export default fetchAuthTokensTask;