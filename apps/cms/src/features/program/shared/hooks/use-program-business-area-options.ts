import { useQuery } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { getAuthGeneration } from '@/features/auth/lib/auth-generation'
import { dataManagementQueryKeys } from '@/features/data-management/api/data-management-query-keys'
import { useDataManagementRemoteEnabled } from '@/features/data-management/hooks/use-data-management-remote-enabled'
import { fetchTextbookBusinessAreasRemote } from '@/features/textbook/api/business-areas-api-client'
import { useIsTemplateManagementScreen } from '@/features/template/ui/template-management/detail-view-mode-context'
import { businessAreaCatalogState, resolveProgramBusinessAreaOptions } from '../lib/program-business-area-options'

/** Preserve prior program UI behavior on a denied master read, without retaining denied data. */
export function useProgramBusinessAreaOptions(
  currentValue: string | null | undefined,
  format: 'form' | 'master' = 'form',
  enabled = true
) {
  const user = useAuthStore(state => state.user)
  const authenticated = useAuthStore(state => state.isAuthenticated)
  const templateManagement = useIsTemplateManagementScreen()
  const remoteEnabled = useDataManagementRemoteEnabled('textbooks',
    enabled && authenticated && user != null && !templateManagement)
  const session = getAuthGeneration()
  const scope = [
    session, user?.id, user?.roleCode, [...(user?.permissionCodes ?? [])].sort(),
  ] as const
  const query = useQuery({
    queryKey: [...dataManagementQueryKeys.textbooks.programBusinessAreaOptions(), scope],
    enabled: remoteEnabled,
    staleTime: 30_000,
    retry: false,
    queryFn: async ({ signal }) => {
      const rows = await fetchTextbookBusinessAreasRemote({ signal, skipGlobalErrorAlert: true })
      if (getAuthGeneration() !== session) throw new Error('인증 세션이 변경되었습니다.')
      if (rows.some(row => !row.id?.trim() || !row.name?.trim())) {
        throw new Error('사업 분야 목록 응답이 올바르지 않습니다.')
      }
      return rows.map(row => row.name!.trim())
    },
  })
  const forbidden = isAxiosError(query.error) && query.error.response?.status === 403
  const state = businessAreaCatalogState({
    enabled: remoteEnabled, failed: query.isError, forbidden, names: query.data,
  })
  return {
    options: resolveProgramBusinessAreaOptions(state, currentValue, format),
    placeholder: state.kind === 'loading' ? '사업 분야를 불러오는 중입니다'
      : state.kind === 'unavailable' ? '사업 분야를 불러오지 못했습니다'
      : state.kind === 'ready' && state.names.length === 0 ? '등록된 사업 분야가 없습니다'
      : undefined,
  }
}
