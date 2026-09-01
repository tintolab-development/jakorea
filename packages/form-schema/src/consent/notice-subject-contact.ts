import { formatKoreanPhoneNumber, isValidKoreanPhoneNumber } from '@jakorea/domain/shared/korean-phone'
import {
  AGREEMENT_NOTICE_PARAGRAPH_IDS,
  AGREEMENT_NOTICE_SUBJECT_ITEM_IDS,
  type WritingFormDraft,
} from '../writing-form/draft-schema.js'

export const NOTICE_SUBJECT_BIRTH_INVALID_ALERT_MESSAGE = '올바른 생년월일을 입력해 주세요.'
export const NOTICE_SUBJECT_PHONE_INVALID_ALERT_MESSAGE =
  '올바른 전화번호 형식이 아닙니다 (예: 010-1234-5678)'

function isGregorianLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0
}

function isValidCalendarYyyyMmDd(year: number, month: number, day: number): boolean {
  if (year < 1 || month < 1 || month > 12 || day < 1) return false
  const febDays = isGregorianLeapYear(year) ? 29 : 28
  const daysInMonth = [31, febDays, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
  return day <= daysInMonth[month - 1]!
}

/** 숫자만 모아 YYYY.MM.DD 로 점 자동 삽입 */
export function formatConsentBirthDateInput(raw: string): string {
  const digits = (raw ?? '').replace(/\D/g, '').slice(0, 8)
  if (digits.length <= 4) return digits
  if (digits.length <= 6) return `${digits.slice(0, 4)}.${digits.slice(4)}`
  return `${digits.slice(0, 4)}.${digits.slice(4, 6)}.${digits.slice(6)}`
}

export function isValidConsentBirthDate(raw: string): boolean {
  const digits = (raw ?? '').replace(/\D/g, '')
  if (digits.length !== 8) return false
  return isValidCalendarYyyyMmDd(
    Number(digits.slice(0, 4)),
    Number(digits.slice(4, 6)),
    Number(digits.slice(6, 8))
  )
}

/** 값이 있는데 YYYY.MM.DD(유효 달력)가 아니면 true. 공란은 필수 미완으로 둔다. */
export function isConsentBirthDateFormatInvalid(raw: string): boolean {
  if ((raw ?? '').replace(/\D/g, '') === '') return false
  return !isValidConsentBirthDate(raw)
}

export function formatConsentPhoneInput(raw: string): string {
  return formatKoreanPhoneNumber(raw ?? '')
}

/** 값이 있는데 국내 전화번호 형식이 아니면 true. 공란은 필수 미완으로 둔다. */
export function isConsentPhoneFormatInvalid(raw: string): boolean {
  if ((raw ?? '').trim() === '') return false
  return !isValidKoreanPhoneNumber(raw)
}

export function applyConsentShortEssayItemInput(itemId: string, raw: string): string {
  if (itemId === AGREEMENT_NOTICE_SUBJECT_ITEM_IDS.birth) {
    return formatConsentBirthDateInput(raw)
  }
  if (itemId === AGREEMENT_NOTICE_SUBJECT_ITEM_IDS.phone) {
    return formatConsentPhoneInput(raw)
  }
  return raw
}

function readNoticeSubjectItem(draft: WritingFormDraft, itemId: string): string {
  const subject = draft.paragraphs.find(
    paragraph => paragraph.id === AGREEMENT_NOTICE_PARAGRAPH_IDS.subject
  )
  if (subject == null || subject.kind !== 'single_item' || subject.variant !== 'short_essay') {
    return ''
  }
  return subject.items?.find(item => item.id === itemId)?.bodyText ?? ''
}

/** 작성완료 — 행정정보 대상자 본인 생년월일·전화번호 형식 오류 메시지 */
export function getMemberConsentInvalidNoticeSubjectContactAlertMessage(
  draft: WritingFormDraft
): string | null {
  const birth = readNoticeSubjectItem(draft, AGREEMENT_NOTICE_SUBJECT_ITEM_IDS.birth)
  if (isConsentBirthDateFormatInvalid(birth)) {
    return NOTICE_SUBJECT_BIRTH_INVALID_ALERT_MESSAGE
  }
  const phone = readNoticeSubjectItem(draft, AGREEMENT_NOTICE_SUBJECT_ITEM_IDS.phone)
  if (isConsentPhoneFormatInvalid(phone)) {
    return NOTICE_SUBJECT_PHONE_INVALID_ALERT_MESSAGE
  }
  return null
}
