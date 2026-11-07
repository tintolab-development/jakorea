/**
 * 임팩트 스토리 · 카테고리 mutation 실패 알림
 */

import {
  type AdminMutationAlert,
  readApiErrorCode,
  readApiErrorMessage,
} from '@/shared/lib/api-error-message'
import { mapAdminMutationAlert } from '@/shared/ui'

function mapBodyValidationFailure(
  error: unknown,
  title: string,
): AdminMutationAlert | null {
  const code = readApiErrorCode(error) ?? ''
  const message = readApiErrorMessage(error) ?? ''
  const blob = `${code} ${message}`

  if (/sanitiz/i.test(blob) && /body|required|img|iframe/i.test(blob)) {
    return {
      title,
      content: '본문에서 허용되지 않은 이미지나 영상이 제거되어 저장하지 못했습니다.',
    }
  }
  if (
    /VALIDATION_ERROR/i.test(code) ||
    /validation failed/i.test(message) ||
    /100000|maxLength|size must be/i.test(blob)
  ) {
    return {
      title,
      content:
        '본문이 너무 길거나 형식이 올바르지 않습니다. 이미지를 파일로 다시 삽입한 뒤 저장해 주세요.',
    }
  }
  return null
}

export function impactStoryMutationFailureAlert(
  error: unknown,
  fallbackContent: string,
  title = '저장 실패',
): AdminMutationAlert {
  const common = mapAdminMutationAlert(error)
  if (common) return common

  const body = mapBodyValidationFailure(error, title)
  if (body) return body

  return { title, content: fallbackContent }
}

export function impactStoryCategoryMutationFailureAlert(error: unknown): AdminMutationAlert {
  const common = mapAdminMutationAlert(error)
  if (common) return common

  const code = readApiErrorCode(error) ?? ''
  const message = readApiErrorMessage(error) ?? ''
  const blob = `${code} ${message}`

  if (/DUPLICATE|already exists|동일한|unique/i.test(blob)) {
    return {
      title: '카테고리 중복',
      content: '동일한 카테고리명이 이미 존재합니다.',
    }
  }
  if (/IN_USE|storyCount|사용 중|cannot delete|in use/i.test(blob)) {
    return {
      title: '삭제 불가',
      content: '사용 중인 카테고리는 삭제할 수 없습니다.',
    }
  }

  return {
    title: '저장 실패',
    content: '카테고리 저장에 실패했습니다. 다시 시도해 주세요.',
  }
}
