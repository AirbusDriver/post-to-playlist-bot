import { musicRouterFactoryTask } from '@/music/infra/http/router';
import { getRootLogger }          from '@shared/logger';
import { json, Router }           from 'express';
import { EitherAsync }            from 'purify-ts';


const logger = getRootLogger().child({module: 'api'});

const apiRouterFactory = EitherAsync(async ctx => {

    const apiRouter = Router();
    const musicRouter = await ctx.fromPromise(musicRouterFactoryTask.run());

    apiRouter.use(json());

    apiRouter.use((req, res, next) => {
        logger.info(`api request from: ${ req.ip }`, {
            url: `${ req.hostname }${ req.originalUrl }`,
            query: req.query,
            body: req.body,
            params: req.params,
        });

        next();
    });

    apiRouter.use('/music', musicRouter);

    apiRouter.all('*', async (req, res) => {
        return res.status(404).json({
            error: {
                message: 'invalid route',
                name: 'NOT_FOUND'
            }
        });
    });

    return apiRouter;
});

export { apiRouterFactory };

export default apiRouterFactory;


