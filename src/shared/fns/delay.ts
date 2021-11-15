/** sleep for n milliseconds and then resolve void */
export const sleep = (n: number) => {
    return new Promise<void>(res => {
        setTimeout(res, n);
    });
};

/** return a rate per second in milliseconds */
export const perSecond = (n: number) => 1000 / n;

export const perMinute = (n: number) => perSecond(n) / 60;