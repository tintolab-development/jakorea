/**
 * 문자 템플릿명(displayName)
 * 허용: 한글·영문·숫자·_·- / 공백·기타 특수문자 금지
 */
import {
  sanitizeNotificationTemplateNameInput,
  TEMPLATE_NAME_INPUT_PLACEHOLDER,
} from '@/features/notifications/model/template-name-input'

export { TEMPLATE_NAME_INPUT_PLACEHOLDER as SMS_TEMPLATE_NAME_PLACEHOLDER }
export { sanitizeNotificationTemplateNameInput as sanitizeSmsTemplateNameInput }

export const SMS_TEMPLATE_NAME_PATTERN = /^[\uAC00-\uD7A3A-Za-z0-9_-]+$/

export const SMS_TEMPLATE_NAME_INVALID_MESSAGE =
  '문자 템플릿명은 한글·영문·숫자·_·-만 사용할 수 있습니다. 공백은 사용할 수 없습니다.'

export const SMS_TEMPLATE_NAME_REQUIRED_MESSAGE = '템플릿명을 입력해 주세요.'

export function isValidSmsTemplateName(name: string): boolean {
  const trimmed = name.trim()
  if (!trimmed) return false
  return SMS_TEMPLATE_NAME_PATTERN.test(trimmed)
}

export function validateSmsTemplateName(name: string): string | null {
  const trimmed = name.trim()
  if (!trimmed) return SMS_TEMPLATE_NAME_REQUIRED_MESSAGE
  if (!SMS_TEMPLATE_NAME_PATTERN.test(trimmed)) return SMS_TEMPLATE_NAME_INVALID_MESSAGE
  return null
}
