/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    moduleNameMapper: {
        "^@/(.*)": "<rootDir>/src/$1",
        "^@config/(.*)": "<rootDir>/src/config/$1",
        "^@reddit/(.*)": "<rootDir>/src/reddit/$1",
        "^@shared/(.*)": "<rootDir>/src/shared/$1",
        "^@infra/(.*)": "<rootDir>/src/infra/$1",
        "^@fns/(.*)": "<rootDir>/src/shared/fns/$1",
        "^@fns$": "<rootDir>/src/shared/fns",

    },
    setupFiles: [
        "<rootDir>/tests/setupBeforeEnv/dotenvRedir.ts",
    ],
    testMatch: [
        "**/__tests__/**/*.(spec|test).(js|ts)"
    ],
    roots: ['./src', './tests']
};