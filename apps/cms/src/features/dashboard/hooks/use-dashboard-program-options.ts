import { useMemo } from 'react'
import { getDashboardProgramOptionsFromRecruitmentList } from '@/features/dashboard/api/admin-dashboard-service'
import { useDashboardRecruitmentsCatalog } from '@/features/dashboard/hooks/use-dashboard-recruitments-catalog'

export function useDashboardProgramOptions(widgetKey: string, enabled = true) {
  const catalogQuery = useDashboardRecruitmentsCatalog(enabled && Boolean(widgetKey))

  const data = useMemo(() => {
    if (!widgetKey || catalogQuery.data === undefined) return undefined
    return getDashboardProgramOptionsFromRecruitmentList(widgetKey, catalogQuery.data)
  }, [catalogQuery.data, widgetKey])

  return {
    ...catalogQuery,
    data,
  }
}
