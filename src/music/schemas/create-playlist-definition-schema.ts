import { playlistDefinitionCodec } from '@/music/codecs';
import { stringifyJsonUnsafe }     from '@fns/json';
import { writeToFileSyncSafe }     from '@fns/fileIO';
import * as path                   from 'path';


const jsonSchemaFile = path.resolve(__dirname, '../', 'schemas', 'playlistDefinition.schema.json');

const main = () => {
    const json = stringifyJsonUnsafe(2)(playlistDefinitionCodec.schema());
    writeToFileSyncSafe(jsonSchemaFile)(json);
};

main();