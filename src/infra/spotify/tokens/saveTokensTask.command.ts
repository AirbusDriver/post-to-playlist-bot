import {
    createSaveAuthTokensRoot,
    saveTokensToFile,
}                         from '@infra/spotify/tokens/saveTokensTask.root';
import { SaveTokensTask } from './types';


/**
 * Persist auth tokens to the file system
 */
export const saveAuthTokensTask: SaveTokensTask = createSaveAuthTokensRoot(saveTokensToFile);
export default saveAuthTokensTask;

export { SaveTokensTask };

