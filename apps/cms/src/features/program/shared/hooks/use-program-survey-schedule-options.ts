import { useEffect, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { generalProgramQueryKeys } from '@/features/program/general/api/general-program-query-keys'
import { fetchProgramPlannedEducationSlots } from '@/features/program/general/lib/program-planned-education-slots'
import { resolveGeneralProgramCommonInfo } from '@/features/program/general/lib/detail-common-info-display'
import { buildSurveyPollScheduleSelectOptionsForProgram } from '@/features/program/shared/lib/survey-management/survey-poll-schedule-options'
import type { Program } from '@/types/domain'

export function useProgramSurveyScheduleOptions(
  program: Program | null | undefined,
  enabled: boolean
) {
  const programId = program?.id != null ? String(program.id) : undefined
  const query = useQuery({
    queryKey: generalProgramQueryKeys.educationSlots(programId ?? ''),
    queryFn: () => fetchProgramPlannedEducationSlots(programId!),
    enabled: enabled && programId != null && programId.trim() !== '',
  })

  const options = useMemo(() => {
    if (program == null) {
      return []
    }
    return buildSurveyPollScheduleSelectOptionsForProgram(program, query.data ?? [])
  }, [program, query.data])

  useEffect(() => {
    if (!enabled || program == null || query.isLoading || query.isError || !import.meta.env.DEV) {
      return
    }
    const hasConfiguredEducationScheduleLines =
      (resolveGeneralProgramCommonInfo(program).educationScheduleLines?.length ?? 0) > 0
    if (hasConfiguredEducationScheduleLines && (query.data?.length ?? 0) === 0) {
      console.warn(
        '[schedule-domain] education-slots is empty despite configured education schedule lines',
        { programId }
      )
    }
  }, [enabled, program, programId, query.data, query.isError, query.isLoading])

  const hasSessionSchedules = options.length > 0

  return {
    options,
    hasSessionSchedules,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  }
}
