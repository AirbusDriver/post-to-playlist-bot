import { getAuthorizedClientTask }       from '@infra/spotify';
import { createSearchServiceFromClient } from '../search';


export const getSearchServiceTask = getAuthorizedClientTask.map(createSearchServiceFromClient);