import { safeGetEnvIO } from '@fns/envIO';
import * as winston     from 'winston';


const getNodeEnv = () => safeGetEnvIO()
    .chainNullable((env): string | undefined => env.NODE_ENV)
    .orDefault('production');


const createLogger = (nodeEnv: string): winston.Logger => {
    return winston.createLogger({
        level: nodeEnv === 'development' ? 'debug' : 'info',
        transports: [
            new winston.transports.Console(),
        ],
    });
};

const _getRootLogger = (): () => winston.Logger => {
    let _logger: winston.Logger | null = null;

    return () => {
        if (_logger == null) {
            _logger = createLogger(getNodeEnv());
        }
        return _logger;
    };
};

export const getRootLogger: () => winston.Logger = _getRootLogger();

export default getRootLogger

export type Logger = winston.Logger;
