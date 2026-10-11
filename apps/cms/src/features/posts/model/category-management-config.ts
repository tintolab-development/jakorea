import type { CategoryDeleteBlockedKind } from '@/features/posts/ui/category-delete-blocked-copy'
import { getApiErrorCode, getApiErrorHttpStatus } from '@/shared/lib/extract-api-error-message'

export type CategoryManagementKind = CategoryDeleteBlockedKind

const CATEGORY_IN_USE_CODE: Record<CategoryManagementKind, string> = {
  notice: 'NOTICE_CATEGORY_IN_USE',
  faq: 'FAQ_CATEGORY_IN_USE',
  inquiry: 'INQUIRY_CATEGORY_IN_USE',
}

const CATEGORY_DUPLICATE_CODE: Record<CategoryManagementKind, string> = {
  notice: 'NOTICE_CATEGORY_NAME_ALREADY_EXISTS',
  faq: 'FAQ_CATEGORY_NAME_ALREADY_EXISTS',
  inquiry: 'INQUIRY_CATEGORY_NAME_ALREADY_EXISTS',
}

function isConflictStatus(error: unknown): boolean {
  return getApiErrorHttpStatus(error) === 409
}

export function isCategoryInUseError(error: unknown, kind: CategoryManagementKind): boolean {
  return getApiErrorCode(error) === CATEGORY_IN_USE_CODE[kind] || isConflictStatus(error)
}

export function isCategoryDuplicateError(error: unknown, kind: CategoryManagementKind): boolean {
  return getApiErrorCode(error) === CATEGORY_DUPLICATE_CODE[kind] || isConflictStatus(error)
}

export type PostWithCategoryLabel = { category?: string | null }

export function getPostCategoryLabel(post: PostWithCategoryLabel): string | undefined {
  const value = post.category
  if (value == null || value === '') {
    return undefined
  }
  return value
}
