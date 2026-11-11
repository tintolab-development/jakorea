import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  mergeInstructorDetailFromMaskedMember,
  mergeInstructorDetailFromPrivacyUnmask,
} from './merge-instructor-detail-from-privacy-unmask'
import type { PaymentOrderAdminInstructorDetail } from '@/features/settlement-management/model/payment-order-admin-list'

const baseDetail: PaymentOrderAdminInstructorDetail = {
  instructorNo: 1,
  nameKo: '김강사',
  nameEn: '-',
  address: '-',
  phone: '-',
  email: '-',
  bankName: '-',
  accountNumber: '-',
  accountHolder: '-',
  totalEstimatedAmount: 0,
  programRows: [],
}

describe('mergeInstructorDetailFromPrivacyUnmask', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-11-02T12:00:00+09:00'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('unmask 응답의 연락처·계좌·성별·생년월일을 상세에 반영한다', () => {
    const merged = mergeInstructorDetailFromPrivacyUnmask(baseDetail, {
      member: {
        name: '김원문',
        phone: '010-1234-5678',
        email: 'kim@example.com',
        gender: 'MALE',
        birthDate: '1985-03-12',
      },
      profile: {
        homeAddress: { line: '서울 강남구', detail: '역삼동 1' },
      },
      settlement: {
        bankName: '국민',
        accountNumber: '1234567890',
        accountHolder: '김원문',
      },
    })
    expect(merged).toMatchObject({
      nameKo: '김원문',
      phone: '010-1234-5678',
      email: 'kim@example.com',
      address: '서울 강남구 역삼동 1',
      bankName: '국민',
      accountNumber: '1234567890',
      accountHolder: '김원문',
      genderBirthDisplay: '남성 | 1985. 03. 12 (만 41세)',
    })
  })

  it('unmask가 없으면 원본을 유지한다', () => {
    expect(mergeInstructorDetailFromPrivacyUnmask(baseDetail, null)).toBe(baseDetail)
  })
})

describe('mergeInstructorDetailFromMaskedMember', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-11-02T12:00:00+09:00'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('마스킹 GET의 성별·생년월일을 조회 전 헤더에 채운다', () => {
    const merged = mergeInstructorDetailFromMaskedMember(baseDetail, {
      member: {
        gender: '**',
        birthDate: '1985-**-**',
        phone: '010-****-2201',
        email: 'e2e-settle-***@local.demo',
      },
    })
    // 마스킹 생년월일은 월·일을 모르므로 FE가 만 나이를 계산하지 않는다(Step 6.4 P3).
    expect(merged.genderBirthDisplay).toBe('** | 1985.**.**')
    expect(merged.phone).toBe('010-****-2201')
  })
})
