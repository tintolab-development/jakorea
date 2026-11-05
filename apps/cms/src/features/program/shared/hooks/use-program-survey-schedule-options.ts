import { useEffect, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { generalProgramQueryKeys } from '@/features/program/general/api/general-program-query-keys'
import { fetchProgramPlannedEducationSlots } from '@/features/program/general/lib/program-planned-education-slots'
import { resolveGeneralProgramCommonInfo } from '@/features/program/general/lib/detail-common-info-display'
import {
  buildSurveyPollScheduleSelectOptionsForProgram,
  disableSurveyPollScheduleOptionsWithSurvey,
  type SurveyPollScheduleBindingRef,
  type SurveyPollUsedScheduleFilter,
} from '@/features/program/shared/lib/survey-management/survey-poll-schedule-options'
import type { Program } from '@/types/domain'

/**
 * 설문 대상 일정 — `GET .../education-slots` only.
 * `/schedules` fallback 없음 (기간 창 오연결 방지).
 */
export function useProgramSurveyScheduleOptions(
  program: Program | null | undefined,
  enabled: boolean,
  /** 서버 form-binding 목록(classifiedBindings). 이미 설문이 있는 일정을 비활성화한다. */
  existingBindings?: ReadonlyArray<SurveyPollScheduleBindingRef> | null,
  usedScheduleFilter?: SurveyPollUsedScheduleFilter
) {
  const programId = program?.id != null ? String(program.id) : undefined
  const query = useQuery({
    queryKey: [...generalProgramQueryKeys.educationSlots(programId ?? ''), 'survey-poll'] as const,
    queryFn: () => fetchProgramPlannedEducationSlots(programId!),
    enabled: enabled && programId != null && programId.trim() !== '',
  })

  const options = useMemo(() => {
    if (program == null) {
      return []
    }
    return disableSurveyPollScheduleOptionsWithSurvey(
      buildSurveyPollScheduleSelectOptionsForProgram(program, query.data ?? []),
      existingBindings,
      usedScheduleFilter
    )
  }, [program, query.data, existingBindings, usedScheduleFilter])

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
