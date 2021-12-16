import { config } from 'dotenv';

// todo move all config to top level for early failure

config();

export const PLAYLIST_DIR = process.env.PLAYLIST_DIR || './deploy/myPlaylists';