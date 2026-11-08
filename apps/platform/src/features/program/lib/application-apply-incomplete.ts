import type { ApplyInstitutionBasicInfoValues } from '../ui/apply-institution-basic-info/apply-institution-basic-info-answers.ts'
import { findIncompleteInstitutionBasicInfoMessage } from '../ui/apply-institution-basic-info/apply-institution-basic-info-incomplete.ts'

export type ApplicationIncompleteField = {
  message: string
  paragraphId: string
  field?: string
}

export function fieldForInstitutionBasicInfoIncompleteMessage(
  message: string,
): string | undefined {
  if (message.includes('학급')) return 'classCount'
  if (message.includes('학생')) return 'studentCount'
  if (message.includes('학년')) return 'applicationGrade'
  if (message.includes('기관명') || message.includes('학교명')) return 'schoolName'
  if (message.includes('소재지')) return 'regionLabel'
  if (message.includes('주소')) return 'addressDetail'
  if (message.includes('신청 사유')) return 'applicationReason'
  if (message.includes('교사명')) return 'teacherName'
  if (message.includes('연락처')) return 'teacherTel'
  if (message.includes('이메일')) return 'teacherEmail'
  return undefined
}

export function resolveGeneralBasicInfoApplyIncomplete(
  values: ApplyInstitutionBasicInfoValues,
  paragraphId: string,
): ApplicationIncompleteField | null {
  const message = findIncompleteInstitutionBasicInfoMessage(values)
  if (!message) return null
  return {
    message,
    paragraphId,
    field: fieldForInstitutionBasicInfoIncompleteMessage(message),
  }
}

export function focusIncompleteApplicationField(
  root: HTMLElement | null,
  incomplete: ApplicationIncompleteField | null,
): void {
  if (!root || !incomplete) return
  root
    .querySelectorAll<HTMLElement>('[data-application-error="true"]')
    .forEach(element => {
      delete element.dataset.applicationError
    })
  const paragraphs = Array.from(root.querySelectorAll<HTMLElement>('[data-paragraph-id]'))
  const target =
    paragraphs.find(element => element.dataset.paragraphId === incomplete.paragraphId) ?? null
  if (!target) return
  target.dataset.applicationError = 'true'
  const fieldTarget = incomplete.field
    ? target.querySelector<HTMLElement>(`[data-field="${incomplete.field}"]`)
    : null
  const scrollTarget = fieldTarget ?? target
  scrollTarget.scrollIntoView?.({ behavior: 'smooth', block: 'center' })
  const focusable = (fieldTarget ?? target).querySelector<HTMLElement>(
    'input:not([disabled]), textarea:not([disabled]), select:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex="-1"])',
  )
  focusable?.focus({ preventScroll: true })
}
