import { describe, expect, it } from 'vitest'
import {
  checkTalentApplyPeriod,
  checkTalentApplyPeriodLive,
  talentApplyBirthDateMessage,
  TALENT_APPLY_PERIOD_ORDER_MESSAGE,
  TALENT_APPLY_PERIOD_PAST_MESSAGE,
} from '../src/features/talent-donation/lib/validate-apply-form'
import {
  BIRTH_DATE_FUTURE_MESSAGE,
  BIRTH_DATE_TOO_OLD_MESSAGE,
} from '../src/features/auth/sign-up/lib/birth-date-bounds'

const now = new Date('2026-11-12T10:00:00+09:00')

describe('재능기부 생년월일 안내 (QA-0503)', () => {
  it('오늘 이후·만 120세 초과는 입력란 아래 문구를 보여 준다', () => {
    expect(talentApplyBirthDateMessage('2026.11.13', now)).toBe(BIRTH_DATE_FUTURE_MESSAGE)
    expect(talentApplyBirthDateMessage('1900.01.01', now)).toBe(BIRTH_DATE_TOO_OLD_MESSAGE)
  })

  it('정상·빈 값·형식 오류는 범위 문구가 없다', () => {
    expect(talentApplyBirthDateMessage('1990.05.20', now)).toBeNull()
    expect(talentApplyBirthDateMessage('', now)).toBeNull()
    expect(talentApplyBirthDateMessage('1990-05-20', now)).toBeNull()
  })
})

describe('재능기부 가능 기간 (QA-0504)', () => {
  it('빈 값은 기존처럼 두 칸 모두 오류(문구 없음)', () => {
    expect(checkTalentApplyPeriod('', '2026-12-01', now)).toEqual({
      startInvalid: true,
      endInvalid: true,
      message: null,
    })
  })

  it('오늘은 허용하고, 오늘 이전 날짜는 막는다', () => {
    expect(checkTalentApplyPeriod('2026-11-12', '2026-11-12', now).message).toBeNull()
    expect(checkTalentApplyPeriod('2026-11-11', '2026-12-01', now)).toEqual({
      startInvalid: true,
      endInvalid: false,
      message: TALENT_APPLY_PERIOD_PAST_MESSAGE,
    })
  })

  it('종료일이 시작일보다 빠르면 막는다', () => {
    expect(checkTalentApplyPeriod('2026-12-10', '2026-12-01', now)).toEqual({
      startInvalid: false,
      endInvalid: true,
      message: TALENT_APPLY_PERIOD_ORDER_MESSAGE,
    })
  })

  it('KST 자정 경계: KST 11-13 00:00에는 11-12가 지난 날짜다', () => {
    const kstMidnight = new Date('2026-11-12T15:00:00Z')
    expect(checkTalentApplyPeriod('2026-11-12', '2026-11-20', kstMidnight).message).toBe(
      TALENT_APPLY_PERIOD_PAST_MESSAGE
    )
    expect(checkTalentApplyPeriod('2026-11-13', '2026-11-20', kstMidnight).message).toBeNull()
  })
})

describe('재능기부 가능 기간 — 작성 중 실시간 확인', () => {
  it('한 칸만 골라도 지난 날짜면 바로 안내하고, 빈 칸은 오류로 보지 않는다', () => {
    expect(checkTalentApplyPeriodLive('2026-08-02', '', now)).toEqual({
      startInvalid: true,
      endInvalid: false,
      message: TALENT_APPLY_PERIOD_PAST_MESSAGE,
    })
    expect(checkTalentApplyPeriodLive('', '', now)).toEqual({
      startInvalid: false,
      endInvalid: false,
      message: null,
    })
    expect(checkTalentApplyPeriodLive('2026-12-01', '', now).message).toBeNull()
  })

  it('두 칸을 모두 고르면 순서도 바로 확인한다', () => {
    expect(checkTalentApplyPeriodLive('2026-12-10', '2026-12-01', now).message).toBe(
      TALENT_APPLY_PERIOD_ORDER_MESSAGE
    )
  })
})

describe('생년월일 범위 — 작성 중 실시간 안내', () => {
  it('입력 중(미완성)에는 안내하지 않고, 다 입력한 순간 안내한다', () => {
    expect(talentApplyBirthDateMessage('2030', now)).toBeNull()
    expect(talentApplyBirthDateMessage('2030.01', now)).toBeNull()
    expect(talentApplyBirthDateMessage('2030.01.01', now)).toBe(BIRTH_DATE_FUTURE_MESSAGE)
  })
})
