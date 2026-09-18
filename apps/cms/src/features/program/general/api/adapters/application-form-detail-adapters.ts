import type { FormResponseResponse } from '@/shared/api/generated/forms-surveys/schemas/formResponseResponse'
import type { ApplicantInstructorRow } from '@/features/program/shared/model/applicant-instructor'
import type { GeneralVolunteerApplicantRow } from '@/features/program/general/model/volunteer-applicant'
import { buildFormAnswerMap } from './organization-application-form-adapters'

function pickAnswer(
  map: Record<string, string>,
  ...keys: string[]
): string | undefined {
  for (const key of keys) {
    const v = map[key]?.trim()
    if (v) return v
  }
  return undefined
}

/**
 * INSTRUCTOR_APPLICATION form_response + admin comment → 강사 신청 상세 hydrate.
 */
export function hydrateInstructorApplicationRowFromForm(input: {
  row: ApplicantInstructorRow
  formResponse: FormResponseResponse | null | undefined
  adminComment?: string | null
}): ApplicantInstructorRow {
  const map = buildFormAnswerMap(input.formResponse?.answers)
  const oneLineIntro =
    pickAnswer(map, 'oneLineIntro') ?? input.row.oneLineIntro
  const scheduleMemo = pickAnswer(map, 'availableScheduleMemo')
  const scheduleLabel = pickAnswer(
    map,
    'program-instructor-application-seed-available-schedule'
  )
  const preferredScheduleSlots =
    input.row.preferredScheduleSlots && input.row.preferredScheduleSlots.length > 0
      ? input.row.preferredScheduleSlots
      : scheduleLabel
        ? [{ slotKey: scheduleLabel, assignable: true }]
        : input.row.preferredScheduleSlots

  return {
    ...input.row,
    oneLineIntro: oneLineIntro || input.row.oneLineIntro,
    freeWriting1: scheduleMemo || input.row.freeWriting1,
    preferredScheduleSlots,
    managerComment:
      input.adminComment?.trim() || input.row.managerComment,
  }
}

/**
 * VOLUNTEER_APPLICATION form_response + admin comment → 봉사 신청 hydrate.
 */
export function hydrateVolunteerApplicationRowFromForm(input: {
  row: GeneralVolunteerApplicantRow
  formResponse: FormResponseResponse | null | undefined
  adminComment?: string | null
}): GeneralVolunteerApplicantRow {
  const map = buildFormAnswerMap(input.formResponse?.answers)
  const previousJa = pickAnswer(
    map,
    'program-volunteer-application-seed-previous-ja-program'
  )
  const freeText = pickAnswer(
    map,
    'program-volunteer-application-seed-free-text-items'
  )
  const jaExpChoice = pickAnswer(
    map,
    'program-volunteer-application-seed-ja-experience'
  )
  const hasJa =
    jaExpChoice != null
      ? /yes|있|경험/i.test(jaExpChoice) ||
        jaExpChoice.includes('program-volunteer-application-ja-experience-yes')
      : input.row.hasJaVolunteerExperience

  return {
    ...input.row,
    hasJaVolunteerExperience: hasJa,
    essayIntro: freeText || input.row.essayIntro,
    essayJaExperience: previousJa || input.row.essayJaExperience,
    essayEducationExperience:
      input.row.essayEducationExperience || freeText || '',
    essayNecessity: input.row.essayNecessity || freeText || '',
    adminComment: input.adminComment ?? input.row.adminComment,
  }
}
