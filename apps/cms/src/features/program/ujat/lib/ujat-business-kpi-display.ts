import type { Program } from '@/types/domain'
import { resolveUjatParticipantTypeFlags } from '@/features/program/ujat/lib/participant-type-flags'
import { readUjatRegistrationOverlayFromProgram } from '@/features/program/ujat/api/service-detail'

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
  const overlay = overlayInput ?? (program ? readUjatRegistrationOverlayFromProgram(program) : {})
  const fromOverlay = overlayBoolean(overlay, 'ujat.basicInfo.participant.volunteer')
  if (fromOverlay != null) return fromOverlay
  if (program) return resolveUjatParticipantTypeFlags(program, overlay).volunteer
  return false
}

export function resolveUjatBusinessKpiDisplay(
  program: Program,
  overlayInput?: Record<string, unknown>
): UjatBusinessKpiDisplay {
  const kpi = program.generalCommonInfo?.kpi
  const kpiNumber = (value: unknown): number | null => {
    return typeof value === 'number' && Number.isFinite(value) ? value : null
  }
  const overlay = {
    ...readUjatRegistrationOverlayFromProgram(program),
    ...overlayInput,
  }
  return {
    // 상세 응답 최상위 KPI를 adapter가 generalCommonInfo.kpi에 복사한다.
    // 목록/세션 오버레이/기본값을 fallback으로 사용하지 않는다.
    finalParticipants: kpiNumber(kpi?.finalParticipants),
    volunteerCount: kpiNumber(kpi?.volunteerCount),
    finalSchools: kpiNumber(kpi?.finalSchools),
    finalClasses: kpiNumber(kpi?.finalClasses),
    hasVolunteerRecruitment: resolveUjatHasVolunteerRecruitment(overlay, program),
  }
}

export const UJAT_BUSINESS_KPI_INSTRUCTOR_NOT_APPLICABLE = '해당 없음' as const
