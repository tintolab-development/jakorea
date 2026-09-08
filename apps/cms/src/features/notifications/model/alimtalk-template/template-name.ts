/**
 * 알림톡 템플릿명 — CMS에서는 주로 조회·필터용.
 * 입력 UI가 생기면 메일/문자와 동일 placeholder·sanitize를 사용한다.
 */
import {
  sanitizeNotificationTemplateNameInput,
  TEMPLATE_NAME_INPUT_PLACEHOLDER,
} from '@/features/notifications/model/template-name-input'

export { TEMPLATE_NAME_INPUT_PLACEHOLDER as ALIMTALK_TEMPLATE_NAME_PLACEHOLDER }
export { sanitizeNotificationTemplateNameInput as sanitizeAlimtalkTemplateNameInput }

export const ALIMTALK_TEMPLATE_NAME_PATTERN = /^[\uAC00-\uD7A3A-Za-z0-9_-]+$/

export const ALIMTALK_TEMPLATE_NAME_INVALID_MESSAGE =
  '알림톡 템플릿명은 한글·영문·숫자·_·-만 사용할 수 있습니다. 공백은 사용할 수 없습니다.'

export const ALIMTALK_TEMPLATE_NAME_REQUIRED_MESSAGE = '템플릿명을 입력해 주세요.'

export function validateAlimtalkTemplateName(name: string): string | null {
  const trimmed = name.trim()
  if (!trimmed) return ALIMTALK_TEMPLATE_NAME_REQUIRED_MESSAGE
  if (!ALIMTALK_TEMPLATE_NAME_PATTERN.test(trimmed)) return ALIMTALK_TEMPLATE_NAME_INVALID_MESSAGE
  return null
}
