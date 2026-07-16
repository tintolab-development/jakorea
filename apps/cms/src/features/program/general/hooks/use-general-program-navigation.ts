import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchGeneralProgramNavigation } from '@/features/program/general/api/admin-general-programs-service'
import { generalProgramQueryKeys } from '@/features/program/general/api/general-program-query-keys'
import { useProgramsReadsRemoteEnabledForSurface } from '@/features/program/1c-1s/lib/use-company-school-surface-remote'
import type { GeneralDetailLnbKey } from '@/features/program/general/lib/detail-url'

const LNB_KEY_ALIASES: Record<string, GeneralDetailLnbKey> = {
  info: 'info',
  program_info: 'info',
  institution_applications: 'institution_applications',
  institutions: 'institution_applications',
  instructor_applications: 'instructor_applications',
  instructors: 'instructor_applications',
  volunteer_applications: 'volunteer_applications',
  volunteers: 'volunteer_applications',
  progress: 'progress',
  survey: 'survey',
  surveys: 'survey',
  managers: 'managers',
}

export function useGeneralProgramNavigation(programId: string | undefined, enabled = true) {
  const surfaceRemote = useProgramsReadsRemoteEnabledForSurface(programId)
  const remoteEnabled = surfaceRemote && enabled

  const query = useQuery({
    queryKey: generalProgramQueryKeys.navigation(programId ?? ''),
    queryFn: () => fetchGeneralProgramNavigation(programId!),
    enabled: remoteEnabled,
    staleTime: 60_000,
    retry: false,
  })

  const disabledLnbKeys = useMemo(() => {
    const disabled = new Set<GeneralDetailLnbKey>()
    const items = query.data?.lnb
    if (!items?.length) return disabled
    for (const item of items) {
      const raw = item.key?.trim().toLowerCase() ?? ''
      const mapped = LNB_KEY_ALIASES[raw]
      if (mapped && item.enabled === false) disabled.add(mapped)
    }
    return disabled
  }, [query.data])

  return {
    navigation: query.data,
    disabledLnbKeys,
    loading: remoteEnabled ? query.isFetching : false,
    isRemoteDataSource: remoteEnabled && !query.isError,
  }
}
