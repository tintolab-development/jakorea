import { describe, expect, it } from 'vitest'
import {
  mapSponsorContactResponse,
  mapSponsorDetailResponse,
  mapSponsorResponse,
  mapYearlyBusinessResponse,
  mergeYearlyBusinessRows,
  parseSponsorContactType,
  shouldPersistYearlyBusinessRow,
  toSponsorContactRequest,
  toSponsorRequestFromRegister,
  toYearlyBusinessRequest,
} from './sponsor-adapters'

describe('mapSponsorResponse', () => {
  it('maps list aggregate columns from SponsorResponse', () => {
    const row = mapSponsorResponse({
      id: 'sp-1',
      name: '스타벅스',
      createdAt: '2026-03-30T00:00:00.000Z',
      updatedAt: '2026-03-30T00:00:00.000Z',
      programCount: 13,
      totalDonationAmount: 91_500_000,
      totalBeneficiaryCount: 915,
    })
    expect(row.programCount).toBe(13)
    expect(row.totalDonationAmount).toBe(91_500_000)
    expect(row.totalBeneficiaryCount).toBe(915)
  })

  it('defaults missing donation aggregates to 0', () => {
    const row = mapSponsorResponse({
      id: 'sp-1',
      name: '스타벅스',
    })
    expect(row.programCount).toBe(0)
    expect(row.totalDonationAmount).toBe(0)
    expect(row.totalBeneficiaryCount).toBe(0)
  })
})

describe('mapSponsorDetailResponse', () => {
  it('maps homepage and a single logoFileId to logos', () => {
    const detail = mapSponsorDetailResponse({
      id: 'sp-1',
      name: '삼성',
      homepageUrl: 'https://www.samsung.com',
      logoFileId: 'samsung_logo.ai',
    })
    expect(detail.homepageUrl).toBe('https://www.samsung.com')
    expect(detail.logos).toEqual([{ id: 'samsung_logo.ai', fileName: 'samsung_logo.ai' }])
  })
})

describe('toSponsorRequestFromRegister', () => {
  it('maps register fields to SponsorRequest instead of description text', () => {
    expect(
      toSponsorRequestFromRegister({
        nameDisplayKo: '스타벅스',
        nameDisplayEn: 'STARBUCKS',
        organizationKind: 'corporate',
        businessNumber: '124-81-00998',
        sponsorshipStartDate: '2026-03-30T00:00:00.000Z',
        sponsorshipStatus: 'active',
        executives: '홍길동',
        district: '서울특별시 중구',
        detailAddress: '을지로 100',
        homepageUrl: 'https://www.starbucks.co.kr',
        securityMemo: '비고',
        logoFile: null,
      })
    ).toEqual({
      name: '스타벅스',
      nameEn: 'STARBUCKS',
      nameDisplayKo: '스타벅스',
      nameDisplayEn: 'STARBUCKS',
      businessNumber: '124-81-00998',
      executives: '홍길동',
      address: '서울특별시 중구 을지로 100',
      organizationKind: 'corporate',
      sponsorshipStatus: 'active',
      sponsorshipStartDate: '2026-03-30T00:00:00.000Z',
      securityMemo: '비고',
      homepageUrl: 'https://www.starbucks.co.kr',
    })
  })
})

describe('yearly business adapters', () => {
  it('maps businessYear to year', () => {
    expect(
      mapYearlyBusinessResponse({
        id: 'yb-1',
        businessYear: 2024,
        donationAmount: 1000,
        beneficiaryCount: 12,
        memo: '메모',
        businessName: '2024년 후원',
        managerNameSnapshot: '김담당',
      })
    ).toEqual({
      id: 'yb-1',
      year: 2024,
      donationAmount: 1000,
      beneficiaryCount: 12,
      memo: '메모',
      businessName: '2024년 후원',
      managerNameSnapshot: '김담당',
    })
  })

  it('maps year back to businessYear and fills required businessName', () => {
    expect(
      toYearlyBusinessRequest({
        id: 'yb-1',
        year: 2025,
        donationAmount: 2000,
        beneficiaryCount: 3,
        memo: '',
        businessName: '',
        managerNameSnapshot: '',
      })
    ).toEqual({
      businessYear: 2025,
      businessName: '2025년',
      donationAmount: 2000,
      beneficiaryCount: 3,
      memo: '',
    })
  })

  it('keeps existing businessName and manager snapshot on request', () => {
    expect(
      toYearlyBusinessRequest({
        id: 'yb-1',
        year: 2025,
        donationAmount: 2000,
        beneficiaryCount: 3,
        memo: '',
        businessName: 'JA 후원',
        managerNameSnapshot: '이담당',
      })
    ).toMatchObject({
      businessName: 'JA 후원',
      managerNameSnapshot: '이담당',
    })
  })

  it('persists existing rows and filled new rows, skips empty placeholders', () => {
    expect(
      shouldPersistYearlyBusinessRow({
        id: 'yb-1',
        year: 2024,
        donationAmount: 0,
        beneficiaryCount: 0,
        memo: '',
        businessName: '',
        managerNameSnapshot: '',
      })
    ).toBe(true)
    expect(
      shouldPersistYearlyBusinessRow({
        id: '',
        year: 2026,
        donationAmount: 1000,
        beneficiaryCount: 0,
        memo: '',
        businessName: '',
        managerNameSnapshot: '',
      })
    ).toBe(true)
    expect(
      shouldPersistYearlyBusinessRow({
        id: '',
        year: 2026,
        donationAmount: 0,
        beneficiaryCount: 0,
        memo: '',
        businessName: '',
        managerNameSnapshot: '',
      })
    ).toBe(false)
  })

  it('fills missing years from sponsorship start to now, newest first', () => {
    const rows = mergeYearlyBusinessRows(
      [
        {
          id: 'yb-1',
          year: 2024,
          donationAmount: 10,
          beneficiaryCount: 1,
          memo: '',
          businessName: '2024년',
          managerNameSnapshot: '',
        },
      ],
      '2023-03-01',
      new Date('2025-08-24')
    )
    expect(rows.map(row => row.year)).toEqual([2025, 2024, 2023])
    expect(rows.find(row => row.year === 2024)?.id).toBe('yb-1')
    expect(rows.find(row => row.year === 2025)?.id).toBe('')
  })
})

describe('toSponsorContactRequest', () => {
  it('omits blank officePhone so the server does not validate placeholder text', () => {
    expect(
      toSponsorContactRequest(
        {
          contactType: 'lead',
          name: '김담당',
          department: '부서',
          position: '직함',
          officePhone: '',
          phone: '010-9999-8888',
          email: 'email@mail.com',
          companyAddress: '회사주소',
          memo: '비고',
        },
        'lead'
      )
    ).toEqual({
      name: '김담당',
      department: '부서',
      position: '직함',
      mobilePhone: '010-9999-8888',
      email: 'email@mail.com',
      companyAddress: '회사주소',
      memo: '비고',
      primary: true,
      contactType: 'lead',
    })
  })
})

describe('mapSponsorContactResponse', () => {
  it('maps the expanded contact list fields', () => {
    expect(
      mapSponsorContactResponse({
        id: 'c-1',
        name: '김제이',
        department: '디자인마케팅팀',
        position: '책임',
        officePhone: '02-1234-5678',
        mobilePhone: '010-2431-0000',
        email: 'gwan123@naver.com',
        companyAddress: '서울특별시 강서구 화곡동 936-16',
        memo: '',
        contactType: 'lead',
        createdAt: '2026-02-10T00:15:00.000Z',
      })
    ).toEqual({
      id: 'c-1',
      name: '김제이',
      department: '디자인마케팅팀',
      position: '책임',
      officePhone: '02-1234-5678',
      phone: '010-2431-0000',
      email: 'gwan123@naver.com',
      companyAddress: '서울특별시 강서구 화곡동 936-16',
      memo: '',
      registeredAt: '2026-02-10T00:15:00.000Z',
      contactType: 'lead',
    })
  })
})

describe('parseSponsorContactType', () => {
  it('maps lead aliases including uppercase and korean labels', () => {
    expect(parseSponsorContactType({ contactType: 'LEAD' })).toBe('lead')
    expect(parseSponsorContactType({ contactType: 'primary' })).toBe('lead')
    expect(parseSponsorContactType({ contactType: '주담당자' })).toBe('lead')
    expect(parseSponsorContactType({ primary: true })).toBe('lead')
  })

  it('maps assistant aliases and falls back to primary=false', () => {
    expect(parseSponsorContactType({ contactType: 'ASSISTANT' })).toBe('assistant')
    expect(parseSponsorContactType({ contactType: '담당자' })).toBe('assistant')
    expect(parseSponsorContactType({ primary: false })).toBe('assistant')
    expect(parseSponsorContactType({})).toBe('assistant')
  })
})
