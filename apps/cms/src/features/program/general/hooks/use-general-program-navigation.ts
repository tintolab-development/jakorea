import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchGeneralProgramNavigation } from '@/features/program/general/api/admin-general-programs-service'
import { generalProgramQueryKeys } from '@/features/program/general/api/general-program-query-keys'
import { useProgramsReadsRemoteEnabledForSurface } from '@/features/program/1c-1s/lib/use-company-school-surface-remote'
import type { GeneralDetailLnbKey } from '@/features/program/general/lib/detail-url'
import type { MenuItem } from '@/shared/api/generated/dashboard/schemas/menuItem'

/**
 * OpenAPI ProgramNavigationMenuItem.key (SCREAMING_SNAKE) → FE LNB.
 * lowercase / legacy alias도 함께 허용.
 */
const LNB_KEY_ALIASES: Record<string, GeneralDetailLnbKey> = {
  // OpenAPI enum (lowercased)
  common_info: 'info',
  recruitment_info: 'info',
  organization_applications: 'institution_applications',
  participant_applications: 'participant_applications',
  instructor_applications: 'instructor_applications',
  volunteer_applications: 'volunteer_applications',
  program_execution: 'progress',
  survey: 'survey',
  surveys: 'survey',
  settlement: 'settlement',
  program_staff: 'managers',
  // Legacy / short keys
  info: 'info',
  program_info: 'info',
  institution_applications: 'institution_applications',
  institutions: 'institution_applications',
  instructors: 'instructor_applications',
  volunteers: 'volunteer_applications',
  progress: 'progress',
  managers: 'managers',
}

function normalizeNavigationKey(raw: string | undefined | null): string {
  return (raw ?? '').trim().toLowerCase().replace(/-/g, '_')
}

export interface GeneralProgramNavigationCapabilities {
  educationJournalEnabled?: boolean
  studentRosterEnabled?: boolean
}

export function resolveGeneralProgramNavigation(items?: readonly MenuItem[] | null): {
  disabledLnbKeys: Set<GeneralDetailLnbKey>
  capabilities: GeneralProgramNavigationCapabilities
} {
  const disabledLnbKeys = new Set<GeneralDetailLnbKey>()
  const capabilities: GeneralProgramNavigationCapabilities = {}

  for (const item of items ?? []) {
    const normalizedKey = normalizeNavigationKey(item.key)
    if (normalizedKey === 'education_journal') {
      if (typeof item.enabled === 'boolean') {
        capabilities.educationJournalEnabled = item.enabled
      }
      continue
    }
    if (normalizedKey === 'student_roster') {
      if (typeof item.enabled === 'boolean') {
        capabilities.studentRosterEnabled = item.enabled
      }
      continue
    }

    const mapped = LNB_KEY_ALIASES[normalizedKey]
    if (mapped && item.enabled === false) disabledLnbKeys.add(mapped)
  }

  return { disabledLnbKeys, capabilities }
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

  const resolvedNavigation = useMemo(
    () => resolveGeneralProgramNavigation(query.data?.lnb),
    [query.data]
  )

  return {
    navigation: query.data,
    disabledLnbKeys: resolvedNavigation.disabledLnbKeys,
    capabilities: resolvedNavigation.capabilities,
    loading: remoteEnabled ? query.isFetching : false,
    isRemoteDataSource: remoteEnabled && !query.isError,
  }
}
