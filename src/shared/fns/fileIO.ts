import { existsSync, promises, readFileSync as fsRead, writeFileSync } from "fs";
import * as P                                                          from "purify-ts";


type FileExistsAsync = (filePath: string) => P.EitherAsync<false, true>;
const fileExistsAsync: FileExistsAsync = filePath =>
    P.EitherAsync<false, true>(async ({liftEither}) => {
        const _stat = await promises.stat(filePath);
        return liftEither(_stat.isFile() ? P.Either.of(true) : P.Left(false));
    });
type FileExistsSync = (filePath: string) => P.Either<false, true>
export const checkFileExistsSync: FileExistsSync = filePath => {
    return existsSync(filePath) ? P.Either.of(true) : P.Left(false);
};
type flags = "w" | "w+" | "a"
export const writeToFileSyncSafe = (filePath: string, flag: flags = "w") =>
    (data: string) => {
        return P.Either.encase(() => {
            writeFileSync(filePath, data, {flag});
        });
    };
type ReadFileSyncSafe = (filePath: string) => () => P.Either<Error, string>
export const readFileSyncSafe: ReadFileSyncSafe = filePath =>
    () => P.Either.encase(
        () => fsRead(filePath, {encoding: "utf-8"})
    );