import type { ApplyTrainedTeachersBasicInfoValues } from '../ui/apply-trained-teachers-basic-info/apply-trained-teachers-basic-info-answers.ts'
import { findIncompleteTrainedTeachersBasicInfoMessage } from '../ui/apply-trained-teachers-basic-info/apply-trained-teachers-basic-info-incomplete.ts'

export type ApplicationIncompleteField = {
  message: string
  paragraphId: string
  field?: string
}

export function fieldForTrainedTeachersBasicInfoIncompleteMessage(
  message: string,
): string | undefined {
  if (message.includes('학급')) return 'classCount'
  if (message.includes('학생')) return 'studentCount'
  if (message.includes('학년')) return 'applicationGrade'
  if (message.includes('기관명') || message.includes('학교명')) return 'schoolName'
  if (message.includes('소재지')) return 'regionLabel'
  if (message.includes('주소')) return 'addressDetail'
  if (message.includes('신청 사유')) return 'applicationReason'
  return undefined
}

export function resolveGeneralBasicInfoApplyIncomplete(
  values: ApplyTrainedTeachersBasicInfoValues,
  paragraphId: string,
): ApplicationIncompleteField | null {
  const message = findIncompleteTrainedTeachersBasicInfoMessage(values)
  if (!message) return null
  return {
    message,
    paragraphId,
    field: fieldForTrainedTeachersBasicInfoIncompleteMessage(message),
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
