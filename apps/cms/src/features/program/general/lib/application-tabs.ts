/** 일반 프로그램 상세 — 신청 정보 서브탭 (모집 정보와 동일 key) */

import type { ProgramParticipantApplicationEditorVariant } from '@/features/template/hooks/use-program-participant-application-editor'
import type { Program } from '@/types/domain'
import { getGeneralParticipantTypes } from '@/features/program/general/lib/detail-meta'
import { isGeneralIndividualProgram } from '@/features/program/general/lib/survey-audience'
import {
  GENERAL_RECRUIT_TAB_KEYS,
  type GeneralRecruitTabKey,
} from '@/features/program/general/lib/recruitment-tabs'

export type GeneralApplicationTabKey = GeneralRecruitTabKey

const GENERAL_APPLICATION_TAB_LABELS: Record<
  Exclude<GeneralApplicationTabKey, 'institutions'>,
  string
> = {
  instructors: '강사 신청 정보',
  volunteers: '봉사자 신청 정보',
}

export function getGeneralApplicationInstitutionsTabLabel(program: Program): string {
  const types = getGeneralParticipantTypes(program)
  if (types.includes('school_institution')) return '참여 기관 신청 정보'
  if (isGeneralIndividualProgram(program)) return '참여자 신청 정보'
  return '참여 기관 신청 정보'
}

export function normalizeGeneralApplicationTab(
  tab: string | null | undefined,
  options: { showInstructor: boolean; showVolunteer: boolean }
): GeneralApplicationTabKey {
  if (tab === 'instructors' && options.showInstructor) return 'instructors'
  if (tab === 'volunteers' && options.showVolunteer) return 'volunteers'
  return 'institutions'
}

export function generalApplicationTabItems(options: {
  showInstructor: boolean
  showVolunteer: boolean
  institutionsLabel: string
}): { key: GeneralApplicationTabKey; label: string }[] {
  return GENERAL_RECRUIT_TAB_KEYS.filter(key => {
    if (key === 'instructors') return options.showInstructor
    if (key === 'volunteers') return options.showVolunteer
    return true
  }).map(key => ({
    key,
    label:
      key === 'institutions'
        ? options.institutionsLabel
        : GENERAL_APPLICATION_TAB_LABELS[key],
  }))
}

export function resolveGeneralApplicationEditorVariant(
  program: Program,
  tab: GeneralApplicationTabKey
): ProgramParticipantApplicationEditorVariant {
  if (tab === 'instructors') return 'instructor'
  if (tab === 'volunteers') return 'volunteer'

  const types = getGeneralParticipantTypes(program)
  if (types.includes('school_institution')) return 'institution'
  if (types.includes('individual')) return 'individual'
  return 'institution'
}
