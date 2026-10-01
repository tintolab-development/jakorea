import { PROGRAM_REGISTRATION_IDS } from '@/features/template/model/program-registration-draft'
import { APPLICANT_RECRUIT_FORM_INSTITUTION_IDS } from '@jakorea/form-schema/paragraph-ids/applicant-recruit-form-institution-draft'
import { ECONOMY_RECRUIT_FORM_INSTITUTION_IDS } from '@jakorea/form-schema/paragraph-ids/economy-recruit-form-institution-draft'
import { RECRUIT_FORM_INSTRUCTOR_IDS } from '@jakorea/form-schema/paragraph-ids/recruit-form-instructor-draft'
import { RECRUIT_FORM_VOLUNTEER_IDS } from '@jakorea/form-schema/paragraph-ids/recruit-form-volunteer-draft'
import { APPLICANT_RECRUIT_FORM_INDIVIDUAL_IDS } from '@jakorea/form-schema/paragraph-ids/applicant-recruit-form-individual-draft'
import { UJAT_RECRUIT_FORM_INSTITUTION_IDS } from '@jakorea/form-schema/paragraph-ids/ujat-recruit-form-institution-draft'
import { UJAT_RECRUIT_FORM_VOLUNTEER_IDS } from '@jakorea/form-schema/paragraph-ids/ujat-recruit-form-volunteer-draft'
import { UJAT_PROGRAM_REGISTRATION_IDS } from '@/features/template/model/ujat-program-registration-draft'

const GENERAL_PROGRAM_SECTION_PARAGRAPH: Record<string, string> = {
  basicInfo: PROGRAM_REGISTRATION_IDS.basicInfo,
  kpi: PROGRAM_REGISTRATION_IDS.businessKpi,
  wage: PROGRAM_REGISTRATION_IDS.wageInfo,
  typeSettings: PROGRAM_REGISTRATION_IDS.typeSettings,
  curriculum: PROGRAM_REGISTRATION_IDS.educationCurriculum,
  scheduleCurriculum: PROGRAM_REGISTRATION_IDS.educationCurriculum,
  educationScheduleSettings: PROGRAM_REGISTRATION_IDS.educationScheduleSettings,
  schedule: PROGRAM_REGISTRATION_IDS.educationScheduleSettings,
}

const UJAT_PROGRAM_SECTION_PARAGRAPH: Record<string, string> = {
  basicInfo: UJAT_PROGRAM_REGISTRATION_IDS[0],
  kpi: UJAT_PROGRAM_REGISTRATION_IDS[1],
  wage: UJAT_PROGRAM_REGISTRATION_IDS[2],
  h1: UJAT_PROGRAM_REGISTRATION_IDS[3],
  h2: UJAT_PROGRAM_REGISTRATION_IDS[4],
  capacity: UJAT_PROGRAM_REGISTRATION_IDS[5],
}

function programSectionFromKey(key: string): string | null {
  const indexed = /^(.+)\[\d+\]/.exec(key)
  const base = indexed?.[1] ?? key
  const dot = base.indexOf('.')
  if (dot === -1) return base
  return base.slice(0, dot)
}

function recruitParagraphIdForKey(key: string): string | null {
  if (key === 'recruit.institution' || key.startsWith('recruit.institution.')) {
    return APPLICANT_RECRUIT_FORM_INSTITUTION_IDS.participantRecruitInfo
  }
  if (key.startsWith('recruit.individual.')) {
    return APPLICANT_RECRUIT_FORM_INDIVIDUAL_IDS.participantRecruitInfo
  }
  if (key.startsWith('recruit.instructor.')) {
    return RECRUIT_FORM_INSTRUCTOR_IDS.recruitInfo
  }
  if (key.startsWith('recruit.volunteer.interview')) {
    return RECRUIT_FORM_VOLUNTEER_IDS.interviewSchedule
  }
  if (key.startsWith('recruit.volunteer.')) {
    return RECRUIT_FORM_VOLUNTEER_IDS.recruitInfo
  }
  if (key.startsWith('recruit.volunteer')) {
    return RECRUIT_FORM_VOLUNTEER_IDS.recruitInfo
  }
  return null
}

function economyRecruitParagraphIdForKey(key: string): string | null {
  if (key === 'recruit.institution' || key.startsWith('recruit.institution.')) {
    return ECONOMY_RECRUIT_FORM_INSTITUTION_IDS.participantRecruitInfo
  }
  return recruitParagraphIdForKey(key)
}

function ujatRecruitParagraphIdForKey(key: string): string | null {
  if (key === 'recruit.institution' || key.startsWith('recruit.institution.')) {
    return UJAT_RECRUIT_FORM_INSTITUTION_IDS.participantRecruitInfo
  }
  if (key.startsWith('recruit.volunteer.h1.interviewSchedule')) {
    return UJAT_RECRUIT_FORM_VOLUNTEER_IDS.interviewSchedule
  }
  if (key.startsWith('recruit.volunteer.h2.interviewSchedule')) {
    return UJAT_RECRUIT_FORM_VOLUNTEER_IDS.interviewSchedule
  }
  if (key.startsWith('recruit.volunteer.')) {
    return UJAT_RECRUIT_FORM_VOLUNTEER_IDS.recruitInfo
  }
  return null
}

export type RegistrationWizardIncompleteMapVariant =
  | 'general'
  | 'economy'
  | 'trainedTeachers'
  | 'ujat'

/** 진단 키 → 단락 id (카드 테두리·제목 강조) */
export function resolveRegistrationWizardIncompleteParagraphIds(
  keys: readonly string[],
  variant: RegistrationWizardIncompleteMapVariant
): Set<string> {
  const ids = new Set<string>()
  for (const key of keys) {
    if (key.startsWith('application.thirdParty.')) {
      const parts = key.split('.')
      const paragraphId = parts[2]
      if (paragraphId) ids.add(paragraphId)
      continue
    }
    const section = programSectionFromKey(key)
    if (section != null) {
      if (variant === 'ujat') {
        const ujatId = UJAT_PROGRAM_SECTION_PARAGRAPH[section]
        if (ujatId) ids.add(ujatId)
        continue
      }
      if (section === 'schedule') {
        ids.add(PROGRAM_REGISTRATION_IDS.educationScheduleSettings)
        continue
      }
      const programId = GENERAL_PROGRAM_SECTION_PARAGRAPH[section]
      if (programId) ids.add(programId)
    }
    const recruitId =
      variant === 'ujat'
        ? ujatRecruitParagraphIdForKey(key)
        : variant === 'economy'
          ? economyRecruitParagraphIdForKey(key)
          : recruitParagraphIdForKey(key)
    if (recruitId) ids.add(recruitId)
  }
  return ids
}

export function isRegistrationWizardFieldIncomplete(
  validationKey: string,
  incompleteKeys: ReadonlySet<string>
): boolean {
  if (incompleteKeys.has(validationKey)) return true
  return false
}

/** 가로표 제3자 제공받는 곳 셀 */
export function isRegistrationWizardHorizontalTableCellIncomplete(
  cellKey: string,
  incompleteKeys: ReadonlySet<string>
): boolean {
  return incompleteKeys.has(cellKey)
}

export function firstRegistrationWizardIncompleteParagraphId(
  paragraphIds: ReadonlySet<string>
): string | null {
  return paragraphIds.values().next().value ?? null
}
