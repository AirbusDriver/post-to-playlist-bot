import getRootLogger from '@shared/logger';
import * as schedule from 'node-schedule';
import * as jobs     from './jobs';


export const logger = getRootLogger().child({
    process: 'task-runner'
});

declare module 'node-schedule' {
    export const gracefulShutdown: () => Promise<void>;
}


export const startAll = () => {
    logger.debug('beginning jobs with env', {...process.env});
    jobs.syncPlaylistsStart(logger)(jobs.config.syncPlaylistCron);
};

process.on('SIGINT', () => {
    console.log('ending tasks...');
    schedule.gracefulShutdown()
        .then(() => process.exit(0));
});

export default startAll;

// run as standalone script
if (require.main == module) {
    startAll();
}