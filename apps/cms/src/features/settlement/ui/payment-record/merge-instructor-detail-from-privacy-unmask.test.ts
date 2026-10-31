import { describe, expect, it } from 'vitest'
import { mergeInstructorDetailFromPrivacyUnmask } from './merge-instructor-detail-from-privacy-unmask'
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
  it('unmask 응답의 연락처·계좌를 상세에 반영한다', () => {
    const merged = mergeInstructorDetailFromPrivacyUnmask(baseDetail, {
      member: {
        name: '김원문',
        phone: '010-1234-5678',
        email: 'kim@example.com',
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
    })
  })

  it('unmask가 없으면 원본을 유지한다', () => {
    expect(mergeInstructorDetailFromPrivacyUnmask(baseDetail, null)).toBe(baseDetail)
  })
})
