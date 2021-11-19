import { getRootLogger, Logger } from "@/shared/logger";


export const logger = getRootLogger().child({
    module: "Reddit"
});

export default logger;

export { Logger };

