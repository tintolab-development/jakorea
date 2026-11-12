import { isValidEmail, parseBirthDate } from '@/features/auth/sign-up'
import { getBirthDateRangeMessage } from '@/features/auth/sign-up/lib/utils'
import { getKstToday } from '@/features/auth/sign-up/lib/birth-date-bounds'
import { parseIsoDate } from '@/shared/ui/pf-date-input/date-utils'
import {
  TALENT_APPLY_LONG_TEXT_MAX_LENGTH,
  type TalentApplyFieldKey,
  type TalentApplyFormValues,
} from './apply-form'

function isRequiredLongTextInvalid(value: string): boolean {
  const trimmed = value.trim()
  return trimmed.length === 0 || trimmed.length > TALENT_APPLY_LONG_TEXT_MAX_LENGTH
}

export type TalentApplyFieldErrors = Partial<Record<TalentApplyFieldKey, boolean>>

/**
 * QA-0503: 생년월일 범위 오류 안내(오늘(KST) 이후 · 만 120세 초과) — 작성 중 실시간으로 쓴다.
 * 입력 중(미완성)·형식 오류·빈 값은 null.
 */
export function talentApplyBirthDateMessage(value: string, now: Date = new Date()): string | null {
  return getBirthDateRangeMessage(value, now)
}

export const TALENT_APPLY_PERIOD_PAST_MESSAGE = '오늘 이전 날짜는 선택할 수 없습니다.'
export const TALENT_APPLY_PERIOD_ORDER_MESSAGE = '종료일은 시작일과 같거나 이후 날짜로 입력해 주세요.'

export type TalentApplyPeriodCheck = {
  startInvalid: boolean
  endInvalid: boolean
  /** 값이 있는데 맞지 않을 때만 안내 문구. 빈 값은 기존처럼 테두리 강조만 */
  message: string | null
}

/**
 * QA-0504: 작성 중 실시간 확인 — 고른 날짜만 본다(빈 칸은 오류로 보지 않음).
 * 오늘(KST) 이전 날짜는 고르는 즉시, 종료일이 시작일보다 빠르면 둘 다 고른 즉시 안내한다.
 */
export function checkTalentApplyPeriodLive(
  periodStart: string,
  periodEnd: string,
  now: Date = new Date()
): TalentApplyPeriodCheck {
  const start = periodStart.trim() ? parseIsoDate(periodStart) : null
  const end = periodEnd.trim() ? parseIsoDate(periodEnd) : null
  const today = getKstToday(now).getTime()
  const startPast = start != null && start.getTime() < today
  const endPast = end != null && end.getTime() < today
  if (startPast || endPast) {
    return { startInvalid: startPast, endInvalid: endPast, message: TALENT_APPLY_PERIOD_PAST_MESSAGE }
  }
  if (start && end && end.getTime() < start.getTime()) {
    return { startInvalid: false, endInvalid: true, message: TALENT_APPLY_PERIOD_ORDER_MESSAGE }
  }
  return { startInvalid: false, endInvalid: false, message: null }
}

/**
 * QA-0504: 제출 검증 — 빈 값(기존처럼 테두리만)과 실시간 확인 조건을 함께 막는다.
 */
export function checkTalentApplyPeriod(
  periodStart: string,
  periodEnd: string,
  now: Date = new Date()
): TalentApplyPeriodCheck {
  const startRaw = periodStart.trim()
  const endRaw = periodEnd.trim()
  if (!startRaw || !endRaw) {
    return { startInvalid: true, endInvalid: true, message: null }
  }
  if (!parseIsoDate(startRaw) || !parseIsoDate(endRaw)) {
    return {
      startInvalid: !parseIsoDate(startRaw),
      endInvalid: !parseIsoDate(endRaw),
      message: null,
    }
  }
  return checkTalentApplyPeriodLive(startRaw, endRaw, now)
}

export function collectTalentApplyFieldErrors(
  values: TalentApplyFormValues,
  now: Date = new Date()
): TalentApplyFieldErrors {
  const errors: TalentApplyFieldErrors = {}

  if (!values.name.trim()) errors.name = true
  if (!values.birthDate.trim() || parseBirthDate(values.birthDate, now) == null) {
    errors.birthDate = true
  }
  if (!values.gender) errors.gender = true
  if (!values.phone.trim()) errors.phone = true
  if (!values.email.trim() || !isValidEmail(values.email.trim())) errors.email = true
  if (!values.affiliation.trim()) errors.affiliation = true
  if (!values.sido.trim()) errors.sido = true
  if (!values.sigungu.trim()) errors.sigungu = true
  const period = checkTalentApplyPeriod(values.periodStart, values.periodEnd, now)
  if (period.startInvalid) errors.periodStart = true
  if (period.endInvalid) errors.periodEnd = true
  if (isRequiredLongTextInvalid(values.bio)) errors.bio = true
  if (isRequiredLongTextInvalid(values.talentIntro)) errors.talentIntro = true
  if (isRequiredLongTextInvalid(values.motivation)) errors.motivation = true
  if (!values.jaParticipation) errors.jaParticipation = true
  if (!values.privacyAgreed) errors.privacy = true

  return errors
}

export function hasTalentApplyFieldErrors(errors: TalentApplyFieldErrors): boolean {
  return Object.values(errors).some(Boolean)
}
