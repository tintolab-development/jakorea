/**
 * 공지사항 mutation 실패 알림
 */

import {
  mapCommonRemoteMutationFailure,
  readApiErrorCode,
  readApiErrorMessage,
} from '@/shared/lib/api-error-message'

export function noticeMutationFailureAlert(
  error: unknown,
  fallbackContent: string,
  title = '저장 실패',
): { title: string; content: string } {
  const common = mapCommonRemoteMutationFailure(error)
  if (common) return common

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

  return { title, content: fallbackContent }
}
