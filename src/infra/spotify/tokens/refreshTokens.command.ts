import { refreshAndPersistTokensRoot } from "./refreshTokens.root";
import saveAuthTokensTask              from "./saveTokensTask.command";


export const refreshAndPersistTokens = refreshAndPersistTokensRoot(saveAuthTokensTask);

export default refreshAndPersistTokens;