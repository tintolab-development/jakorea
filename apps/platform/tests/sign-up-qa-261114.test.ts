import { describe, expect, it } from 'vitest'

import { parsePasswordResetEligibilityResponse } from '../src/features/auth/find-password/api/parse'
import { buildConfirmationRows } from '../src/features/auth/sign-up/lib/utils'
import { getPasswordDerived } from '../src/features/auth/sign-up/lib/password/password.logic'
import { isProfileStepValid } from '../src/features/auth/sign-up/lib/profile/profile.logic'

const baseConfirmationInput = {
  birthDate: '1990.01.01',
  gender: 'female' as const,
  schoolStatus: 'none' as const,
  address: '서울특별시 강서구 마곡중앙로 171',
  addressDetail: '714호',
  email: 'member@example.com',
  volunteerId: '',
  name: '홍길동',
  phone: '01012345678',
}

describe('입력 정보 확인 행 순서', () => {
  it('일반회원(14세 이상)은 이메일 ID가 회원유형 바로 다음이다', () => {
    const labels = buildConfirmationRows({ ...baseConfirmationInput, selectedType: 'general' }).map(
      row => row.label,
    )

    expect(labels.slice(0, 3)).toEqual(['회원유형', '이메일 ID', '이름'])
    expect(labels.filter(label => label === '이메일 ID')).toHaveLength(1)
  })

  it('교사회원 순서는 그대로 둔다(이메일 ID 마지막)', () => {
    const labels = buildConfirmationRows({ ...baseConfirmationInput, selectedType: 'teacher' }).map(
      row => row.label,
    )

    expect(labels[0]).toBe('회원유형')
    expect(labels[labels.length - 1]).toBe('이메일 ID')
  })
})

describe('재학 여부 미선택', () => {
  it('재학 여부를 고르지 않으면 회원 정보 단계를 통과할 수 없다', () => {
    expect(isProfileStepValid('서울특별시 강서구 마곡중앙로 171', '714호', null, '', '')).toBe(false)
    expect(isProfileStepValid('서울특별시 강서구 마곡중앙로 171', '714호', 'none', '', '')).toBe(true)
  })
})

describe('비밀번호 조건 미충족', () => {
  it('값이 있고 조건을 못 맞추면 즉시 에러로 판정한다', () => {
    expect(getPasswordDerived('', '').isPolicyUnmet).toBe(false)
    expect(getPasswordDerived('abc', '').isPolicyUnmet).toBe(true)
    expect(getPasswordDerived('abcd1234!', '').isPolicyUnmet).toBe(false)
  })
})

describe('비밀번호 찾기 계정 확인 응답', () => {
  it('eligible=true일 때만 통과로 본다', () => {
    expect(
      parsePasswordResetEligibilityResponse({
        success: true,
        data: { eligible: true, message: 'ok', nextAction: 'SET_NEW_PASSWORD' },
      }),
    ).toEqual({ eligible: true, message: 'ok', nextAction: 'SET_NEW_PASSWORD' })

    expect(
      parsePasswordResetEligibilityResponse({ eligible: false, nextAction: 'REENTER_EMAIL' })
        .eligible,
    ).toBe(false)
    expect(parsePasswordResetEligibilityResponse({}).eligible).toBe(false)
  })
})
