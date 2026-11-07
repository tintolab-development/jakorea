/**
 * 메인 콘텐츠 섹션 저장 실패 — 필드 에러 / 알림 매핑
 */

import type { MainContentFieldErrors } from '@/features/main-content/lib/validate'
import {
  isBlankRequiredValidationError,
  readApiErrorCode,
  readApiErrorField,
  readApiErrorMessage,
  type AdminMutationAlert,
} from '@/shared/lib/api-error-message'
import { mapAdminMutationAlert, REQUIRED_FIELDS_INCOMPLETE_ALERT } from '@/shared/ui'

export function isImpactFeaturedStoryConflictError(error: unknown): boolean {
  return readApiErrorCode(error) === 'IMPACT_FEATURED_STORY_CONFLICT'
}

/** 400 VALIDATION_ERROR · 409 IMPACT_FEATURED_STORY_CONFLICT → 해당 인풋 메시지 */
export function readMainContentFieldErrors(error: unknown): MainContentFieldErrors | null {
  if (isBlankRequiredValidationError(error)) return null
  const field = readApiErrorField(error)
  const message = readApiErrorMessage(error)?.trim()
  if (isImpactFeaturedStoryConflictError(error)) {
    return {
      featuredStoryId: '공개된 임팩트 스토리를 선택해 주세요.',
    }
  }
  if (readApiErrorCode(error) !== 'VALIDATION_ERROR' || !field || !message) return null
  if (/must not be blank|must not be empty|is required/i.test(message)) return null
  return { [field]: message }
}

export function mainContentSaveFailureAlert(
  error: unknown,
  sectionLabel: string,
): AdminMutationAlert {
  const mapped = mapAdminMutationAlert(error)
  if (mapped) return mapped
  if (isBlankRequiredValidationError(error)) return REQUIRED_FIELDS_INCOMPLETE_ALERT

  const message = readApiErrorMessage(error)
  if (message && !/must not be blank|must not be empty/i.test(message)) {
    return { title: '저장 실패', content: message }
  }

  return {
    title: '저장 실패',
    content: `${sectionLabel} 저장에 실패했습니다. 다시 시도해 주세요.`,
  }
}
