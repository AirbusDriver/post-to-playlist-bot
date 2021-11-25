import * as R from 'ramda';


export const mergeRegex = (reg: RegExp[]) => reg.reduce((orig, currentValue) => {
    const accPatt: string = R.propOr('', 'source', orig);
    const newPatt: string = R.concat(accPatt, R.propOr('', 'source', currentValue));

    const flagString = R.pipe(
        (x: RegExp): string => R.propOr('', 'flags', x),
        R.split(''),
        R.reduce(R.concat, R.propOr('', 'flags', orig)),
        R.split(''),
        R.uniq,
        R.join('')
    )(currentValue);

    return new RegExp(newPatt, flagString);
}, new RegExp(''));
