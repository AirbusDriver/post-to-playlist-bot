const resetEnv = (origEnv: typeof process.env) => () => {
    process.env = {...origEnv};
};


/**
 * Return a function that resets process.env to an original value
 */
export const restoreEnv = resetEnv(process.env);