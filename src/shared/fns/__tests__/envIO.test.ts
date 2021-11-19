import { remapKeys, safeGetEnvIO } from "@shared/fns/envIO";
import { restoreEnv }              from "@shared/utils/testHelpers";
import assert                      from "assert";
import * as R                      from "ramda";


const goodEnvInput = {
    ...process.env,
    SPOTIFY_CLIENT_ID: "goodId",
    SPOTIFY_CREDS_FILE: "/tmp/spotCredsFile.json",
    SPOTIFY_SECRET: "goodSecret",
};

const goodEnvResult = R.pick([ "SPOTIFY_SECRET", "SPOTIFY_CREDS_FILE", "SPOTIFY_CLIENT_ID" ], goodEnvInput);


describe("getEnvIO", () => {

    beforeEach(() => {
        jest.resetModules();
    });

    afterEach(() => {
        restoreEnv();
    });

    it("returns current env", () => {
        const exp = {
            some: "env"
        };

        process.env = {...exp};

        expect(safeGetEnvIO().extract()).toEqual(exp);
    });

    it("returns env when changed", () => {
        const exp = {
            some: "env"
        };

        process.env = {...exp};

        const beforeEnv = safeGetEnvIO();

        if (!R.equals(beforeEnv.extract(), exp)) {
            assert.fail("test setup failed: beforeEnv not returning stubbed env");
        }

        restoreEnv();

        expect(safeGetEnvIO()).not.toEqual(exp);
    });

});


test("remap keys", () => {
    const keyMap = new Map<string, string>([
        [ "ENV_KEY_01", "clientKey01" ],
        [ "ENV_KEY_02", "clientKey02" ],
        [ "ENV_KEY_03", "clientKey03" ]
    ]);

    const envVals: Record<string, string> = {
        ENV_KEY_01: "env_key_01_val",
        ENV_KEY_03: "env_key_03_val",
    };

    const result = remapKeys(keyMap)(envVals);

    expect(result).toEqual({
        clientKey01: "env_key_01_val",
        clientKey03: "env_key_03_val",
    });

});