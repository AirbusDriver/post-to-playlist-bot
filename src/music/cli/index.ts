import { createCommand } from '@fns/cli';
import syncCommand       from './syncPlaylist.cli-command';


const musicCommand = createCommand('music')
    .addCommand(syncCommand);


export default musicCommand;

const main = async () => await musicCommand.parseAsync()
    .catch(console.error)
    .catch(() => process.exit(1));


if (require.main === module) {
    main();
}