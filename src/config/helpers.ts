import {Settings, SettingsGuard} from "@config/settings.interfaces";

export function makeSettingsGuard<T extends Settings>(mandatory: string[]): SettingsGuard<T> {

    return function isFinalSettings<T extends Record<string, string | number | boolean>>(settings: Partial<T>): settings is T {
        for (let val of mandatory) {
            if (!(val in settings)) {
                return false;
            }
        }
        return true;
    };
}