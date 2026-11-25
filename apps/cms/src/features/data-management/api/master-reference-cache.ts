import type { QueryClient, QueryKey } from '@tanstack/react-query'
import { dataManagementQueryKeys } from './data-management-query-keys'
import { generalProgramQueryKeys } from '@/features/program/general/api/general-program-query-keys'
import { performanceQueryKeys } from '@/features/education-record/api/performance-query-keys'

/** A list update must invalidate the independent active-only registration selector. */
export function invalidateDetailedProgramOptions(client: QueryClient): Promise<void> {
  return client.invalidateQueries({
    queryKey: dataManagementQueryKeys.detailedPrograms.options(),
  })
}

/**
 * Renaming a business area cascades to referenced master and program data on the server.
 * Refresh master lists/details/matches/kit data and program/performance lists.
 * Program detail data is marked stale without forcing a mounted editing form to rehydrate.
 * Unrelated authentication, user, file and notification queries are left alone.
 */
export async function invalidateBusinessAreaReferenceCaches(client: QueryClient): Promise<void> {
  const textbooks = dataManagementQueryKeys.textbooks
  const general = generalProgramQueryKeys
  const activeKeys: QueryKey[] = [
    textbooks.lists(),
    [...textbooks.all(), 'detail'],
    [...textbooks.all(), 'matches'],
    textbooks.kitQuantities(),
    textbooks.programBusinessAreaOptions(),
    dataManagementQueryKeys.detailedPrograms.all(),
    general.lists(),
    performanceQueryKeys.all,
  ]
  await Promise.all([
    ...activeKeys.map(queryKey => client.invalidateQueries({ queryKey })),
    client.invalidateQueries({
      queryKey: [...general.all, 'detail'],
      refetchType: 'none',
    }),
    client.invalidateQueries({
      queryKey: [...general.all, 'materials'],
      refetchType: 'none',
    }),
    client.invalidateQueries({
      queryKey: [...general.all, 'material-candidates'],
      refetchType: 'none',
    }),
    client.invalidateQueries({
      predicate: ({ queryKey: key }) =>
        key[0] === 'cms' && key[1] === 'programs' &&
        (key[2] === 'detail' || key[3] === 'detail'),
      refetchType: 'none',
    }),
    client.invalidateQueries({
      predicate: ({ queryKey: key }) =>
        key[0] === 'cms' && key[1] === 'programs' &&
        (key[3] === 'list' || key[3] === 'performance' || key[2] === 'list'),
    }),
  ])
}
