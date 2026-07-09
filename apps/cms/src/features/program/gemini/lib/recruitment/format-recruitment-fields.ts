import {
  GEMINI_RECRUITMENT_EDUCATION_FORM_OPTIONS,
  GEMINI_RECRUITMENT_EDUCATION_TARGET_OPTIONS,
} from './add-form-options'
import type { GeminiRecruitmentAddFormSnapshot } from './add-local-save'

export function formatEducationTargetLevels(levels: string[]): string {
  if (levels.length === 0) return '-'
  const labels = levels
    .map(level => GEMINI_RECRUITMENT_EDUCATION_TARGET_OPTIONS.find(o => o.value === level)?.label)
    .filter(Boolean)
  return labels.length > 0 ? labels.join(', ') : '-'
}

export function formatEducationForm(value: string): string {
  return GEMINI_RECRUITMENT_EDUCATION_FORM_OPTIONS.find(o => o.value === value)?.label ?? '-'
}

export function formatInquiryContact(values: {
  inquiryContactName: string
  inquiryTel: string
  inquiryEmail: string
}): string {
  const name = values.inquiryContactName.trim()
  const tel = values.inquiryTel.trim()
  const email = values.inquiryEmail.trim()
  if (!name && !tel && !email) return '-'
  const parts: string[] = []
  if (name) parts.push(`문의처 : ${name}`)
  if (tel) parts.push(`Tel : ${tel}`)
  if (email) parts.push(`E-mail : ${email}`)
  return parts.join(' | ')
}

export function formatNotes(notesNotApplicable: boolean, notes: string): string {
  if (notesNotApplicable) return '-'
  const trimmed = notes.trim()
  return trimmed || '-'
}

export function formatOptionalText(value: string): string {
  const trimmed = value.trim()
  return trimmed || '-'
}

export function formatMinStudentCount(count: number | null | undefined): string {
  if (count == null || !Number.isFinite(count) || count < 1) return '-'
  return `${count.toLocaleString('ko-KR')}명`
}

export function formatAttachmentFileNames(names: string[]): string {
  if (names.length === 0) return '-'
  return names.join(', ')
}

export type GeminiRecruitmentFormFieldValues = Omit<
  GeminiRecruitmentAddFormSnapshot,
  'institutionSectionDescription' | 'detailSectionDescription'
>
