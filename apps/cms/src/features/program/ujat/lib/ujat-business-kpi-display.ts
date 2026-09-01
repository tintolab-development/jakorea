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
  const overlay = overlayInput ?? resolveUjatRegistrationBasicInfoOverlay()
  const kpi = program.generalCommonInfo?.kpi
  const overlayNumber = (key: string): number | undefined => {
    const v = overlay[key]
    return typeof v === 'number' && Number.isFinite(v) ? v : undefined
  }
  return {
    finalParticipants:
      overlayNumber('ujat.kpi.participantCount') ?? kpi?.finalParticipants ?? program.approvedStudentCount ?? 0,
    volunteerCount:
      overlayNumber('ujat.kpi.volunteer') ?? kpi?.volunteerCount ?? program.generalVolunteers ?? 0,
    finalSchools:
      overlayNumber('ujat.kpi.dispatchedSchool') ?? kpi?.finalSchools ?? program.participatingSchoolCount ?? 0,
    finalClasses: overlayNumber('ujat.kpi.dispatchedClass') ?? kpi?.finalClasses ?? 0,
    hasVolunteerRecruitment: resolveUjatHasVolunteerRecruitment(overlay),
  }
}

export const UJAT_BUSINESS_KPI_INSTRUCTOR_NOT_APPLICABLE = '해당 없음' as const
