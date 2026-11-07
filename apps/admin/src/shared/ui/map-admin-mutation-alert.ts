import {
  isBlankRequiredValidationError,
  mapCommonRemoteMutationFailure,
  type AdminMutationAlert,
} from '@/shared/lib/api-error-message'
import { REQUIRED_FIELDS_INCOMPLETE_ALERT } from './required-fields-incomplete-alert'

/** 저장 실패 — 빈 필수값은 공통 안내, lock/권한은 공통 매핑 */
export function mapAdminMutationAlert(error: unknown): AdminMutationAlert | null {
  if (isBlankRequiredValidationError(error)) return REQUIRED_FIELDS_INCOMPLETE_ALERT
  return mapCommonRemoteMutationFailure(error)
}
