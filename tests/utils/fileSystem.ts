import * as fs   from 'fs';
import * as os   from 'os';
import * as path from 'path';
import * as R    from 'ramda';


// create a directory in the /tmp directory that can be populated for tests
export const makeTempDir: (dirName: string) => string = R.pipe(
    (s: string) => path.join(os.tmpdir(), s),
    f => fs.mkdtempSync(f, {encoding: 'utf-8'})
);

