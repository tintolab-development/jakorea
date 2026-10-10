import type { FormResponseResponse } from '@/shared/api/generated/forms-surveys/schemas/formResponseResponse'
import type { ApplicantInstructorRow } from '@/features/program/shared/model/applicant-instructor'
import type { GeneralVolunteerApplicantRow } from '@/features/program/general/model/volunteer-applicant'
import {
  PROGRAM_VOLUNTEER_FREE_TEXT_QUESTIONS,
  type ProgramVolunteerFreeTextQuestion,
} from '@/features/template/model/program-application-form-volunteer-draft'
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
  const legacyScheduleSlotKey =
    scheduleLabel && /^schedule:\d+(?::organization-application:\d+)?$/i.test(scheduleLabel)
      ? scheduleLabel
      : undefined
  const preferredScheduleSlots =
    input.row.preferredScheduleSlots && input.row.preferredScheduleSlots.length > 0
      ? input.row.preferredScheduleSlots
      : legacyScheduleSlotKey
        ? [{ slotKey: legacyScheduleSlotKey, assignable: true }]
        : input.row.preferredScheduleSlots

  return {
    ...input.row,
    oneLineIntro: oneLineIntro || input.row.oneLineIntro,
    freeWriting1: input.row.freeWriting1?.trim()
      ? input.row.freeWriting1
      : scheduleMemo || input.row.freeWriting1,
    preferredScheduleSlots,
    managerComment:
      input.adminComment?.trim() || input.row.managerComment,
  }
}

function resolveHasJaVolunteerExperience(
  map: Record<string, string>,
  row: GeneralVolunteerApplicantRow
): boolean {
  const choice = pickAnswer(map, 'program-volunteer-application-seed-ja-experience')
  if (choice == null) return row.hasJaVolunteerExperience
  return (
    /yes|있|경험/i.test(choice) ||
    choice.includes('program-volunteer-application-ja-experience-yes')
  )
}

function parseJsonRecord(raw: string | undefined): Record<string, unknown> | null {
  if (!raw?.startsWith('{')) return null
  try {
    const parsed: unknown = JSON.parse(raw)
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : null
  } catch {
    return null
  }
}

type VolunteerFreeTextAnswers = Partial<
  Record<ProgramVolunteerFreeTextQuestion['id'], string>
>

/** Platform 제출 `{ items: [{ id, bodyText }] }` → 문항별 답. 구조가 아니면 null */
function parseVolunteerFreeTextItems(raw: string | undefined): VolunteerFreeTextAnswers | null {
  const items = parseJsonRecord(raw)?.items
  if (!Array.isArray(items)) return null
  const out: VolunteerFreeTextAnswers = {}
  for (const item of items) {
    if (!item || typeof item !== 'object') continue
    const row = item as Record<string, unknown>
    const question = PROGRAM_VOLUNTEER_FREE_TEXT_QUESTIONS.find(q => q.id === row.id)
    if (question && typeof row.bodyText === 'string' && row.bodyText.trim()) {
      out[question.id] = row.bodyText.trim()
    }
  }
  return out
}

/** Platform 제출 `{ applicationYear, programName }` → 「2024 · 프로그램명」 */
function formatVolunteerPreviousJaProgram(raw: string | undefined): string | undefined {
  const record = parseJsonRecord(raw)
  if (!record) return raw
  const parts = [record.applicationYear, record.programName]
    .map(value => (typeof value === 'string' ? value.trim() : ''))
    .filter(Boolean)
  return parts.length > 0 ? parts.join(' · ') : undefined
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
  const previousJa = formatVolunteerPreviousJaProgram(
    pickAnswer(map, 'program-volunteer-application-seed-previous-ja-program')
  )
  const freeTextRaw = pickAnswer(
    map,
    'program-volunteer-application-seed-free-text-items'
  )
  const freeTextItems = parseVolunteerFreeTextItems(freeTextRaw)
  if (freeTextItems) {
    return {
      ...input.row,
      hasJaVolunteerExperience: resolveHasJaVolunteerExperience(map, input.row),
      previousJaProgram: previousJa ?? input.row.previousJaProgram,
      essayIntro: freeTextItems.intro ?? input.row.essayIntro,
      essayEducationExperience:
        freeTextItems.educationExperience ?? input.row.essayEducationExperience,
      essayNecessity: freeTextItems.necessity ?? input.row.essayNecessity,
      essayJaExperience: freeTextItems.jaExperience ?? input.row.essayJaExperience,
      adminComment: input.adminComment ?? input.row.adminComment,
    }
  }
  const freeText = freeTextRaw
  return {
    ...input.row,
    hasJaVolunteerExperience: resolveHasJaVolunteerExperience(map, input.row),
    previousJaProgram: previousJa ?? input.row.previousJaProgram,
    essayIntro: freeText || input.row.essayIntro,
    essayJaExperience: previousJa || input.row.essayJaExperience,
    essayEducationExperience:
      input.row.essayEducationExperience || freeText || '',
    essayNecessity: input.row.essayNecessity || freeText || '',
    adminComment: input.adminComment ?? input.row.adminComment,
  }
}
