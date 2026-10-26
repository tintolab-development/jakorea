import type { Program } from '@/types/domain'
import { resolveUjatParticipantTypeFlags } from '@/features/program/ujat/lib/participant-type-flags'
export type UjatBusinessKpiDisplay = {
  finalParticipants: number | null
  volunteerCount: number | null
  finalSchools: number | null
  finalClasses: number | null
  hasVolunteerRecruitment: boolean
}

function overlayBoolean(overlay: Record<string, unknown>, key: string): boolean | undefined {
  const v = overlay[key]
  return typeof v === 'boolean' ? v : undefined
}

export function resolveUjatHasVolunteerRecruitment(
  overlayInput?: Record<string, unknown>,
  program?: Program
): boolean {
  if (program) return resolveUjatParticipantTypeFlags(program).volunteer
  const overlay = overlayInput ?? {}
  const fromOverlay = overlayBoolean(overlay, 'ujat.basicInfo.participant.volunteer')
  return fromOverlay === true
}

export function resolveUjatBusinessKpiDisplay(
  program: Program,
  _overlayInput?: Record<string, unknown>
): UjatBusinessKpiDisplay {
  const kpi = program.generalCommonInfo?.kpi
  const kpiNumber = (value: unknown): number | null => {
    return typeof value === 'number' && Number.isFinite(value) ? value : null
  }
  return {
    finalParticipants: kpiNumber(kpi?.finalParticipants),
    volunteerCount: kpiNumber(kpi?.volunteerCount),
    finalSchools: kpiNumber(kpi?.finalSchools),
    finalClasses: kpiNumber(kpi?.finalClasses),
    hasVolunteerRecruitment: resolveUjatHasVolunteerRecruitment(undefined, program),
  }
}

export const UJAT_BUSINESS_KPI_INSTRUCTOR_NOT_APPLICABLE = '해당 없음' as const
