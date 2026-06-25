import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getProgramTextbookCatalog } from '@/features/textbook/api/admin-textbooks-service'
import {
  listMockTextbookCatalogForProgram,
  serializeProgramTextbookCatalogKey,
} from '@/features/textbook/api/textbook-program-catalog'
import type { TextbookRow } from '@/features/textbook/model/textbook.types'
import { dataManagementQueryKeys } from '@/features/data-management/api/data-management-query-keys'
import { useDataManagementRemoteEnabled } from '@/features/data-management/hooks/use-data-management-remote-enabled'
import type { Program } from '@/types/domain'

export function useProgramTextbookCatalog(program: Program | null | undefined) {
  const remoteEnabled = useDataManagementRemoteEnabled('textbooks', program != null)
  const catalogKey = program ? serializeProgramTextbookCatalogKey(program) : ''

  const mockCatalog = useMemo(
    () => (program ? listMockTextbookCatalogForProgram(program) : []),
    [program]
  )

  const query = useQuery({
    queryKey: dataManagementQueryKeys.textbooks.matches(catalogKey),
    queryFn: () => getProgramTextbookCatalog(program!),
    enabled: remoteEnabled,
    staleTime: 60_000,
    retry: false,
  })

  const catalog: TextbookRow[] = remoteEnabled ? (query.data ?? []) : mockCatalog

  return {
    catalog,
    isLoading: remoteEnabled && query.isLoading,
    isRemote: remoteEnabled,
  }
}
