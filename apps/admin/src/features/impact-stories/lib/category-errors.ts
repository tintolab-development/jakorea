/**
 * 임팩트 스토리 카테고리 저장 API 오류 분류 — CMS 게시글 카테고리와 동일 분기
 */

import {
  isOptimisticLockConflictError,
  readApiErrorCode,
  readApiErrorMessage,
} from '@/shared/lib/api-error-message'

function errorBlob(error: unknown): string {
  const code = readApiErrorCode(error) ?? ''
  const message = readApiErrorMessage(error) ?? ''
  return `${code} ${message}`
}

export function isImpactCategoryInUseError(error: unknown): boolean {
  const blob = errorBlob(error)
  return /IN_USE|storyCount|사용 중|cannot delete|in use/i.test(blob)
}

export function isImpactCategoryDuplicateError(error: unknown): boolean {
  const blob = errorBlob(error)
  return /DUPLICATE|already exists|동일한|unique/i.test(blob)
}

export function isImpactCategoryConcurrentModificationError(error: unknown): boolean {
  if (isOptimisticLockConflictError(error)) return true
  const blob = errorBlob(error)
  return /CONCURRENT_MODIFICATION|version/i.test(blob) && /categor/i.test(blob)
}
