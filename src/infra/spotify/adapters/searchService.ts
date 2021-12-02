import { getAuthorizedClientCache }      from '@infra/spotify';
import { EitherAsync }                   from 'purify-ts';
import { createSearchServiceFromClient } from '../search';


export const getSearchServiceTask = EitherAsync(async lifts => {
    const client = await lifts.fromPromise(getAuthorizedClientCache.getLazy());
    return createSearchServiceFromClient(client);
});
