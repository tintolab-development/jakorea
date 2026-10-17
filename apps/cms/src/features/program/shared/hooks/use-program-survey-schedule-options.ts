import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchAdminProgramSchedulesRemote } from '@/features/program/general/api/program-schedules-api-client'
import { generalProgramQueryKeys } from '@/features/program/general/api/general-program-query-keys'
import { buildSurveyPollScheduleSelectOptionsForProgram } from '@/features/program/shared/lib/survey-management/survey-poll-schedule-options'
import type { Program } from '@/types/domain'

export function useProgramSurveyScheduleOptions(
  program: Program | null | undefined,
  enabled: boolean
) {
  const programId = program?.id != null ? String(program.id) : undefined
  const query = useQuery({
    queryKey: generalProgramQueryKeys.schedules(programId ?? ''),
    queryFn: () => fetchAdminProgramSchedulesRemote(programId!),
    enabled: enabled && programId != null && programId.trim() !== '',
  })

  const options = useMemo(() => {
    if (program == null) {
      return []
    }
    return buildSurveyPollScheduleSelectOptionsForProgram(program, query.data ?? [])
  }, [program, query.data])

  const hasSessionSchedules = options.length > 0

  return {
    options,
    hasSessionSchedules,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  }
}
