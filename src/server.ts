import { getRootLogger, Logger } from '@shared/logger';
import cors                      from 'cors';
import express                   from 'express';
import { EitherAsync }           from 'purify-ts';
import { apiRouterFactory }      from './infra/http';


declare global {
    namespace Express {
        interface Request {
            context: {
                logger: Logger
            };
        }
    }
}


const appFactory = EitherAsync(async ctx => {

    const app = express();
    const logger = getRootLogger().child({module: 'server'});

    app.use(cors());

    app.use((req, res, next) => {
        req.context = {
            ...req.context,
            logger,
        };
        next();
    });

    const api = await ctx.fromPromise(apiRouterFactory.run());
    logger.debug('mounting api router');

    app.use('/api', api);

    app.all('*', (req, res) => {
        res.status(404).send('invalid url');
    });

    return app;
});


appFactory.map(app => app.listen(5550, () => console.log('server started on port 5550'))).ifLeft(console.error).run();