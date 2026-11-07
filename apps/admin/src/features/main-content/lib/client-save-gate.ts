import type { Dispatch, SetStateAction } from 'react'
import type { AdminMutationAlert } from '@/shared/lib/api-error-message'
import { REQUIRED_FIELDS_INCOMPLETE_ALERT } from '@/shared/ui'
import {
  formatOnlyMainContentFieldErrors,
  hasFieldErrors,
  hasIncompleteRequiredMainContentFields,
  type MainContentFieldErrors,
} from './validate'

type ShowAlert = (alert: AdminMutationAlert) => void

/** 빈 필수 → 공통 안내. 형식·길이는 한글 입력 확인. */
export function applyMainContentClientSaveGate(
  errors: MainContentFieldErrors,
  showAlert: ShowAlert,
  setFieldErrors: Dispatch<SetStateAction<MainContentFieldErrors>>,
): boolean {
  if (hasIncompleteRequiredMainContentFields(errors)) {
    showAlert(REQUIRED_FIELDS_INCOMPLETE_ALERT)
    return true
  }
  const formatErrors = formatOnlyMainContentFieldErrors(errors)
  if (hasFieldErrors(formatErrors)) {
    setFieldErrors(formatErrors)
    const first = Object.values(formatErrors)[0]
    showAlert({ title: '입력 확인', content: first })
    return true
  }
  return false
}
