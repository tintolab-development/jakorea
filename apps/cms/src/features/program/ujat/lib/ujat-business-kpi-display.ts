import type { Program } from '@/types/domain'
import {
  createUjatRegistrationBasicInfoOverlayDefaults,
} from '@/features/program/ujat/lib/ujat-registration-basic-info-defaults'
import { resolveUjatRegistrationBasicInfoOverlay } from '@/features/program/ujat/lib/ujat-registration-basic-info-display'

export type UjatBusinessKpiDisplay = {
  finalParticipants: number
  volunteerCount: number
  finalSchools: number
  finalClasses: number
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
  return {
    finalParticipants: kpi?.finalParticipants ?? program.approvedStudentCount ?? 0,
    volunteerCount: kpi?.volunteerCount ?? program.generalVolunteers ?? 0,
    finalSchools: kpi?.finalSchools ?? program.participatingSchoolCount ?? 0,
    finalClasses: kpi?.finalClasses ?? 0,
    hasVolunteerRecruitment: resolveUjatHasVolunteerRecruitment(overlayInput),
  }
}

export const UJAT_BUSINESS_KPI_INSTRUCTOR_NOT_APPLICABLE = '해당 없음' as const
