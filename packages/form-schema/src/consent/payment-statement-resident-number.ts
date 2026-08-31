import type { PaymentStatementBasicInfoValues } from './payment-statement-basic-info.js'

/** 지급조서 주민등록번호 형식 오류 — 작성완료 시 Alert 본문 */
export const PAYMENT_STATEMENT_RESIDENT_NUMBER_INVALID_ALERT_MESSAGE =
  '올바른 주민등록번호 형식이 아닙니다.'

function digitsOnly(value: string | undefined): string {
  return (value ?? '').replace(/\D/g, '')
}

function isGregorianLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0
}

/** YYMMDD — 19xx·20xx 중 한쪽이라도 유효한 달력이면 허용 (윤년 2/29 포함) */
function isValidResidentFrontDate(front: string): boolean {
  if (!/^\d{6}$/.test(front)) return false
  const yy = Number(front.slice(0, 2))
  const mm = Number(front.slice(2, 4))
  const dd = Number(front.slice(4, 6))
  if (mm < 1 || mm > 12 || dd < 1) return false
  const febDays =
    isGregorianLeapYear(1900 + yy) || isGregorianLeapYear(2000 + yy) ? 29 : 28
  const daysInMonth = [31, febDays, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
  return dd <= daysInMonth[mm - 1]!
}

export function isValidPaymentStatementResidentNumberParts(
  residentFront: string | undefined,
  residentBack: string | undefined
): boolean {
  const front = digitsOnly(residentFront)
  const back = digitsOnly(residentBack)
  return isValidResidentFrontDate(front) && /^\d{7}$/.test(back)
}

/**
 * 앞·뒤가 모두 입력됐는데 형식(앞 6자리 생년월일 + 뒤 7자리)이 아니면 true.
 * 한쪽이 비면 필수 미완으로 두고 형식 오류는 아닌 것으로 본다.
 */
export function isPaymentStatementResidentNumberFormatInvalid(
  values: Partial<PaymentStatementBasicInfoValues> | undefined
): boolean {
  if (values == null) return false
  const front = digitsOnly(values.residentFront)
  const back = digitsOnly(values.residentBack)
  if (front === '' || back === '') return false
  return !isValidPaymentStatementResidentNumberParts(front, back)
}
