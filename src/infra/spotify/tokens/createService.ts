import { SpotifyError }                    from "@infra/spotify/errors";
import getSpotifyLogger                    from "@infra/spotify/logger";
import { EitherAsync }                     from "purify-ts";
import SpotifyWebApi                       from "spotify-web-api-node";
import { checkTokensEveryRoot, timerTask } from "./autoTokens";
import { fetchAuthTokensTask }             from "./fetchAuthTokensTask.command";
import { refreshAndPersistTokens }         from "./refreshTokens.command";
import { SpotifyAuthTokenService }         from "./types";


export { SpotifyAuthTokenService };

const logger = getSpotifyLogger().child({module: "SpotifyAuth"});

type CreateAuthTokenServiceTask = (client: SpotifyWebApi) => SpotifyAuthTokenService

const AUTO_REFRESH_INTERVAL = 1000 * 60;


export const createAuthTokenService: CreateAuthTokenServiceTask =
    client => {

        let timer: NodeJS.Timer | null = null;

        const refreshTokens = refreshAndPersistTokens(client);
        const fetchTokens = fetchAuthTokensTask;

        const autoRefreshTask = timerTask(fetchTokens)(refreshTokens);
        const startAutoRefresh = checkTokensEveryRoot(autoRefreshTask)(AUTO_REFRESH_INTERVAL);


        const service: SpotifyAuthTokenService = {
            refreshTokens,
            fetchTokens,
            start: EitherAsync<SpotifyError, void>(async ctx => {
                if (timer == null) {
                    logger.info("beginning auto refresh");
                    timer = await ctx.fromPromise(startAutoRefresh.run());
                    return;
                }
                logger.debug("auto-refresh interval already exists and start() was called on service");
            }),
            stop: EitherAsync<SpotifyError, void>(async _ => {
                if (timer != null) {
                    logger.info("stopping auto-refresh");
                    clearInterval(timer);
                    return;
                }
                logger.debug("interval already stopped and stop() was called on service");
            }),
        };
        return service;
    };