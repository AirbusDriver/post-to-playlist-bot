import getRootLogger, { Logger } from "@shared/logger";


export const logger = getRootLogger().child({
    module: "Spotify",
});

export const getSpotifyLogger = () => logger;

export default getSpotifyLogger;

export { Logger };