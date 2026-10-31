import {
  UJAT_INSTITUTION_SUBMIT_CONFIRMATION_YEAR_PLACEHOLDER,
  UJAT_PROGRAM_APPLICATION_FORM_INSTITUTION_IDS,
  migrateUjatProgramApplicationInstitutionParagraphs,
} from '@jakorea/form-schema/paragraph-ids/ujat-program-application-form-institution-draft'
import {
  UJAT_PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS,
  applyUjatVolunteerSubmitConfirmationCohort,
  migrateUjatProgramApplicationVolunteerChoiceParagraphs,
} from '@jakorea/form-schema/paragraph-ids/ujat-program-application-form-volunteer-draft'
import type { WritingFormDraft } from '@jakorea/form-schema/writing-form'

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  return value as Record<string, unknown>
}

function currentAcademicSemester(now: Date): 1 | 2 {
  const month = now.getMonth() + 1
  return month >= 3 && month <= 8 ? 1 : 2
}

/**
 * BE `form.runtimeContext.activityTerm` — `"1기"` / `"2기"` (기 접미사 포함).
 * 없거나 빈 값이면 null → 확인 문구에서 기수 자리를 뺀다.
 */
function readUjatActivityTerm(runtimeContext: unknown): string | null {
  const runtime = asRecord(runtimeContext)
  if (!runtime) return null
  const audience = asRecord(runtime.audienceApplication)
  // SSOT: form.runtimeContext.activityTerm. 하위 키는 레거시 호환.
  const candidates = [
    runtime.activityTerm,
    runtime.ujatActivityTerm,
    runtime.volunteerActivityTerm,
    audience?.activityTerm,
    audience?.ujatActivityTerm,
  ]
  for (const value of candidates) {
    if (typeof value === 'string' && value.trim()) return value.trim().replace(/기$/, '')
    if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  }
  return null
}

function replaceInstitutionSubmitConfirmationYear(
  draft: WritingFormDraft,
  year: number,
): WritingFormDraft {
  return {
    ...draft,
    paragraphs: draft.paragraphs.map(paragraph => {
      if (paragraph.id !== UJAT_PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.submitConfirmation) {
        return paragraph
      }
      if (paragraph.kind !== 'single_item' || paragraph.variant !== 'multiple_choice') {
        return paragraph
      }
      return {
        ...paragraph,
        items: paragraph.items.map(item => ({
          ...item,
          label: item.label.replace(
            new RegExp(`${UJAT_INSTITUTION_SUBMIT_CONFIRMATION_YEAR_PLACEHOLDER}년|\\d{4}년`),
            `${year}년`,
          ),
        })),
      }
    }),
  }
}

function replaceVolunteerGradeHintYear(
  draft: WritingFormDraft,
  year: number,
  semester: 1 | 2,
): WritingFormDraft {
  return {
    ...draft,
    paragraphs: draft.paragraphs.map(paragraph => {
      if (paragraph.id !== UJAT_PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS.basicInfo) return paragraph
      const description = paragraph.paragraphDescription
      if (!description?.includes('202N') && !description?.includes('N학기')) return paragraph
      return {
        ...paragraph,
        paragraphDescription: description
          .replace(/202N/g, String(year))
          .replace(/N학기/g, `${semester}학기`),
      }
    }),
  }
}

function replaceVolunteerSubmitConfirmationCohort(
  draft: WritingFormDraft,
  cohort: string | null,
): WritingFormDraft {
  return {
    ...draft,
    paragraphs: draft.paragraphs.map(paragraph => {
      if (paragraph.id !== UJAT_PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS.submitConfirmation) {
        return paragraph
      }
      if (paragraph.kind !== 'single_item' || paragraph.variant !== 'multiple_choice') {
        return paragraph
      }
      return {
        ...paragraph,
        items: paragraph.items.map(item => ({
          ...item,
          label: applyUjatVolunteerSubmitConfirmationCohort(item.label, cohort),
        })),
      }
    }),
  }
}

/** CMS fill과 같이 시드 플레이스홀더를 작성 연도·기수로 맞춘다. */
export function preparePortalUjatApplicationDraft(
  draft: WritingFormDraft,
  now: Date = new Date(),
  runtimeContext?: unknown,
): WritingFormDraft {
  const year = now.getFullYear()
  const semester = currentAcademicSemester(now)
  const cohort = readUjatActivityTerm(runtimeContext)
  const migratedInstitution = migrateUjatProgramApplicationInstitutionParagraphs(draft)
  const migratedVolunteer =
    migrateUjatProgramApplicationVolunteerChoiceParagraphs(migratedInstitution)
  return replaceVolunteerSubmitConfirmationCohort(
    replaceVolunteerGradeHintYear(
      replaceInstitutionSubmitConfirmationYear(migratedVolunteer, year),
      year,
      semester,
    ),
    cohort,
  )
}
