import { useQuery } from '@tanstack/react-query'
import { fetchGeneralProgramOverviewStages } from '@/features/program/general/api/admin-general-programs-service'
import { generalProgramQueryKeys } from '@/features/program/general/api/general-program-query-keys'
import { useGeneralProgramsRemoteEnabled } from '@/features/program/general/hooks/use-general-programs-remote-enabled'

/** 일반 프로그램 목록 상단 4카드 건수 (목록과 동일 데이터 소스) */
export function useGeneralProgramOverviewStages(enabled = true) {
  const remoteEnabled = useGeneralProgramsRemoteEnabled()

  return useQuery({
    queryKey: generalProgramQueryKeys.overviewStages(),
    queryFn: fetchGeneralProgramOverviewStages,
    enabled,
    staleTime: remoteEnabled ? 30_000 : 0,
    retry: false,
  })
}
