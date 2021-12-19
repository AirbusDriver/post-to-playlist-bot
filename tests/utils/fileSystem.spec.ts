import { makeTempDir } from './fileSystem';
import * as fs         from 'fs';


it('makes a dir that exists', () => {
    const prefix = 'someDir';

    const tmp = makeTempDir(prefix);

    const exists = fs.existsSync(tmp);

    console.log(tmp);

    expect(exists).toBe(true);
});