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

  /**
   * 원격 최초 로딩 중 `[]`를 넘기면 programUsesTextbook 등이 “교재 없음”으로 판단해
   * 교재명 필드가 사라졌다가 다시 나타나는 플래시가 난다.
   * data 없으면 undefined → 소비측이 sync store로 폴백.
   * 로드 완료 후 빈 목록은 `[]` 유지.
   */
  const catalog: TextbookRow[] | undefined = !remoteEnabled
    ? mockCatalog
    : query.data !== undefined
      ? query.data
      : query.isPending || query.isLoading
        ? undefined
        : []

  return {
    catalog,
    isLoading: remoteEnabled && (query.isPending || query.isLoading),
    isRemote: remoteEnabled,
  }
}
