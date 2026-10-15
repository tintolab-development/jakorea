import type { Program } from '@/types/domain'
import {
  createUjatRegistrationBasicInfoOverlayDefaults,
} from '@/features/program/ujat/lib/ujat-registration-basic-info-defaults'
import { resolveUjatRegistrationBasicInfoOverlay } from '@/features/program/ujat/lib/ujat-registration-basic-info-display'
import { readUjatRegistrationOverlayFromProgram } from '@/features/program/ujat/api/service-detail'

export type UjatBusinessKpiDisplay = {
  finalParticipants: number | null
  volunteerCount: number | null
  finalSchools: number | null
  finalClasses: number | null
  hasVolunteerRecruitment: boolean
}

function overlayBoolean(overlay: Record<string, unknown>, key: string, fallback: boolean): boolean {
  const v = overlay[key]
  return typeof v === 'boolean' ? v : fallback
}

export function resolveUjatHasVolunteerRecruitment(
  overlayInput?: Record<string, unknown>
): boolean {
  const defaults = createUjatRegistrationBasicInfoOverlayDefaults()
  const overlay = overlayInput ?? resolveUjatRegistrationBasicInfoOverlay()
  return overlayBoolean(overlay, 'ujat.basicInfo.participant.volunteer', defaults.participantVolunteer)
}

export function resolveUjatBusinessKpiDisplay(
  program: Program,
  overlayInput?: Record<string, unknown>
): UjatBusinessKpiDisplay {
  const kpi = program.generalCommonInfo?.kpi
  const kpiNumber = (value: unknown): number | null => {
    return typeof value === 'number' && Number.isFinite(value) ? value : null
  }
  const overlay = resolveUjatRegistrationBasicInfoOverlay({
    ...readUjatRegistrationOverlayFromProgram(program),
    ...overlayInput,
  })
  return {
    // 상세 응답 최상위 KPI를 adapter가 generalCommonInfo.kpi에 복사한다.
    // 목록/세션 오버레이/기본값을 fallback으로 사용하지 않는다.
    finalParticipants: kpiNumber(kpi?.finalParticipants),
    volunteerCount: kpiNumber(kpi?.volunteerCount),
    finalSchools: kpiNumber(kpi?.finalSchools),
    finalClasses: kpiNumber(kpi?.finalClasses),
    hasVolunteerRecruitment: resolveUjatHasVolunteerRecruitment(overlay),
  }
}

export const UJAT_BUSINESS_KPI_INSTRUCTOR_NOT_APPLICABLE = '해당 없음' as const
