import getRootLogger from '@shared/logger';


export const musicLogger = getRootLogger().child({
    module: 'music',
});

export default musicLogger;