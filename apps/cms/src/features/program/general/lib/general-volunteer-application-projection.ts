import type { GeneralVolunteerApplicantRow } from '@/features/program/general/model/volunteer-applicant'

type GeneralVolunteerProjectionFields = Pick<
  GeneralVolunteerApplicantRow,
  | 'hasJaVolunteerExperience'
  | 'previousJaProgram'
  | 'essayIntro'
  | 'essayEducationExperience'
  | 'essayNecessity'
  | 'essayJaExperience'
>

const ESSAY_KEYS = [
  'essayIntro',
  'essayEducationExperience',
  'essayNecessity',
  'essayJaExperience',
] as const

function text(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

function formatPreviousJaProgram(value: unknown): string | undefined {
  if (!value || typeof value !== 'object') return text(value)
  const record = value as Record<string, unknown>
  const parts = [text(record.applicationYear), text(record.programName)].filter(Boolean)
  return parts.length > 0 ? parts.join(' · ') : undefined
}

/** 상세 응답 `application.general`. 없는 필드는 base 값을 유지한다. */
export function readGeneralVolunteerProjection(
  application: unknown,
  base: GeneralVolunteerProjectionFields,
): GeneralVolunteerProjectionFields {
  if (!application || typeof application !== 'object') return base
  const raw = (application as { general?: unknown }).general
  if (!raw || typeof raw !== 'object') return base
  const projection = raw as Record<string, unknown>
  const next: GeneralVolunteerProjectionFields = { ...base }
  if (typeof projection.jaExperience === 'boolean') {
    next.hasJaVolunteerExperience = projection.jaExperience
  }
  const previousJaProgram = formatPreviousJaProgram(projection.previousJaProgram)
  if (previousJaProgram) next.previousJaProgram = previousJaProgram
  for (const key of ESSAY_KEYS) {
    const value = text(projection[key])
    if (value) next[key] = value
  }
  return next
}
