/**
 * 공지사항 mutation 실패 알림
 */

import {
  type AdminMutationAlert,
  mapCommonRemoteMutationFailure,
  readApiErrorCode,
  readApiErrorField,
  readApiErrorMessage,
} from '@/shared/lib/api-error-message'

const BODY_TOO_LONG =
  '본문이 너무 길거나 형식이 올바르지 않습니다. 이미지를 파일로 다시 삽입한 뒤 저장해 주세요.'
const BODY_SANITIZE =
  '본문에서 허용되지 않은 이미지나 영상이 제거되어 저장하지 못했습니다.'
const PUBLISH_AT_BOUNDARY = '게시일시는 00분 또는 30분만 선택할 수 있습니다.'

export function noticeMutationFailureAlert(
  error: unknown,
  fallbackContent: string,
  title = '저장 실패',
): AdminMutationAlert {
  const common = mapCommonRemoteMutationFailure(error)
  if (common) return common

  const code = readApiErrorCode(error) ?? ''
  const message = readApiErrorMessage(error) ?? ''
  const field = readApiErrorField(error) ?? ''
  const blob = `${code} ${field} ${message}`

  if (field === 'publishAt' || /30-minute boundary/i.test(message)) {
    return { title, content: PUBLISH_AT_BOUNDARY }
  }

  if (field === 'body') {
    if (/sanitiz|required after HTML/i.test(blob)) {
      return { title, content: BODY_SANITIZE }
    }
    if (/100000|maxLength|size must be|too long/i.test(blob)) {
      return { title, content: BODY_TOO_LONG }
    }
    return { title, content: message.trim() || fallbackContent }
  }

  if (/sanitiz/i.test(blob) && /body|required|img|iframe/i.test(blob)) {
    return { title, content: BODY_SANITIZE }
  }
  if (/100000|maxLength|size must be|too long/i.test(blob)) {
    return { title, content: BODY_TOO_LONG }
  }
  if (/VALIDATION_ERROR/i.test(code) || /validation failed/i.test(message)) {
    return { title, content: message.trim() || fallbackContent }
  }

  return { title, content: fallbackContent }
}
