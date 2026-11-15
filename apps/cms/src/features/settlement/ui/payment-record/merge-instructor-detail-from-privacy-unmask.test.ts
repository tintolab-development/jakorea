import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  applyLatestReceiptPayeeAccount,
  mergeInstructorDetailFromIndividualMember,
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

describe('mergeInstructorDetailFromIndividualMember', () => {
  it('개인회원 응답의 연락처·주소를 반영하고 계좌는 그대로 둔다', () => {
    const merged = mergeInstructorDetailFromIndividualMember(baseDetail, {
      member: { name: '가상 참여자', phone: '010-****-1234', email: 'a***@example.com' },
      address: '서울특별시 가상구',
      addressDetail: '101호',
    })
    expect(merged).toMatchObject({
      nameKo: '김강사',
      phone: '010-****-1234',
      email: 'a***@example.com',
      address: '서울특별시 가상구 101호',
      bankName: '-',
      accountNumber: '-',
    })
  })

  it('원문(includeName)일 때만 성명을 덮는다', () => {
    const merged = mergeInstructorDetailFromIndividualMember(
      baseDetail,
      { member: { name: '가상 참여자' } },
      { includeName: true }
    )
    expect(merged.nameKo).toBe('가상 참여자')
  })

  it('응답이 없으면 원본을 유지한다', () => {
    expect(mergeInstructorDetailFromIndividualMember(baseDetail, undefined)).toBe(baseDetail)
  })
})

describe('applyLatestReceiptPayeeAccount — 가장 최근 신청 건 계좌', () => {
  const row = (id: number | undefined, account?: Record<string, string>) =>
    ({ individualSettlementApplicationId: id, ...account }) as never

  it('영수증 신청 ID가 가장 큰 행의 계좌를 쓴다', () => {
    const merged = applyLatestReceiptPayeeAccount({
      ...baseDetail,
      programRows: [
        row(3, { payeeBankName: '가상은행A', payeeAccountNumberMasked: '111-***', payeeAccountHolder: '가*' }),
        row(9, { payeeBankName: '가상은행B', payeeAccountNumberMasked: '222-***', payeeAccountHolder: '나*' }),
      ],
    })
    expect(merged).toMatchObject({ bankName: '가상은행B', accountNumber: '222-***', accountHolder: '나*' })
  })

  it('최근 신청 건에 계좌가 없으면 빈 값(화면 「-」), 예전 건 계좌로 대신하지 않는다', () => {
    const merged = applyLatestReceiptPayeeAccount({
      ...baseDetail,
      programRows: [
        row(3, { payeeBankName: '가상은행A', payeeAccountNumberMasked: '111-***', payeeAccountHolder: '가*' }),
        row(9),
      ],
    })
    expect(merged).toMatchObject({ bankName: '', accountNumber: '', accountHolder: '' })
  })

  it('영수증 행이 없으면 그대로 둔다', () => {
    expect(applyLatestReceiptPayeeAccount({ ...baseDetail, programRows: [row(undefined)] })).toEqual({
      ...baseDetail,
      programRows: [row(undefined)],
    })
  })
})
