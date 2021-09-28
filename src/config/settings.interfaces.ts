export type ServerSettings = {
    port: number | string;
}

export type RequiredRedditAuthKeys = "secret" | "id" | "userName" | "password"

export const requiredRedditAuthKeys: RequiredRedditAuthKeys[] = [
    "secret", "id", "userName", "password"
];

export type RedditAuthCredentials = {
    [str in RequiredRedditAuthKeys]: string;
} & { agent?: string }


export type Settings = Record<string, string | number | boolean>
export type SettingsGuard<Final extends Settings> = (record: Partial<Final>) => record is Final