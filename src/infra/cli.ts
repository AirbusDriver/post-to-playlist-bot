import musicCommand      from '@/music/cliCommands';
import { createCommand } from '@fns/cli';


export const cli = createCommand('post-to-playlist')
    .addCommand(musicCommand);


export default cli;