import {StoreError} from "@shared/store/errors";
import {StoreData} from "@shared/store/interfaces";
import low from "lowdb";
import path from "path";

export function createDBFactory<T extends StoreData>(filePath: string): () => low.Low<T> {
    if (path.parse(filePath).ext !== "json") {
        throw new StoreError("file must be a json file");
    }
    const fp = new low.JSONFile<T>(filePath);
    const _db = new low.Low<T>(fp);

    return () => _db;
}