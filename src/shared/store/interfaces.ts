type RawValue = string | number | boolean | null

export type StoreData = {
    [idx: string | number]: StoreData | RawValue
}