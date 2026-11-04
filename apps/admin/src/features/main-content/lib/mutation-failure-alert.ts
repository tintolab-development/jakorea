/**
 * 메인 콘텐츠 섹션 저장 실패 — 필드 에러 / 알림 매핑
 */

import type { MainContentFieldErrors } from '@/features/main-content/lib/validate'
import {
  mapCommonRemoteMutationFailure,
  readApiErrorCode,
  readApiErrorField,
  readApiErrorMessage,
  type AdminMutationAlert,
} from '@/shared/lib/api-error-message'

export function isImpactFeaturedStoryConflictError(error: unknown): boolean {
  return readApiErrorCode(error) === 'IMPACT_FEATURED_STORY_CONFLICT'
}

/** 400 VALIDATION_ERROR · 409 IMPACT_FEATURED_STORY_CONFLICT → 해당 인풋 메시지 */
export function readMainContentFieldErrors(error: unknown): MainContentFieldErrors | null {
  const field = readApiErrorField(error)
  const message = readApiErrorMessage(error)?.trim()
  if (isImpactFeaturedStoryConflictError(error)) {
    return {
      featuredStoryId:
        message ||
        'The representative Impact Story must already be public and its publication time must have arrived.',
    }
  }
  if (readApiErrorCode(error) !== 'VALIDATION_ERROR' || !field || !message) return null
  return { [field]: message }
}

export function mainContentSaveFailureAlert(
  error: unknown,
  sectionLabel: string,
): AdminMutationAlert {
  const common = mapCommonRemoteMutationFailure(error)
  if (common) return common

  const message = readApiErrorMessage(error)
  if (message) {
    return { title: '저장 실패', content: message }
  }

  return {
    title: '저장 실패',
    content: `${sectionLabel} 저장에 실패했습니다. 다시 시도해 주세요.`,
  }
}
