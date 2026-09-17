import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/entities/user/api/auth-service', () => ({
  hasRemoteAdminJwt: () => true,
}))

vi.mock('@/shared/config/real-api-modules', () => ({
  isRealApiModuleEnabled: () => true,
}))

vi.mock('@/features/sponsor/api/sponsor-logo-upload', () => ({
  uploadSponsorLogoFile: vi.fn(),
}))

vi.mock('@/features/sponsor/api/sponsors-api-client', async importOriginal => {
  const actual = await importOriginal<typeof import('@/features/sponsor/api/sponsors-api-client')>()
  return {
    ...actual,
    createSponsorRemote: vi.fn(),
    fetchSponsorRemote: vi.fn(),
    fetchSponsorContactsRemote: vi.fn(),
    fetchYearlyBusinessesRemote: vi.fn(),
    addYearlyBusinessRemote: vi.fn(),
    bulkDeleteSponsorContactsRemote: vi.fn(),
    bulkDeleteSponsorProgramHistoriesRemote: vi.fn(),
    updateYearlyBusinessRemote: vi.fn(),
    updateSponsorContactRemote: vi.fn(),
    updateSponsorRemote: vi.fn(),
  }
})

import { uploadSponsorLogoFile } from '@/features/sponsor/api/sponsor-logo-upload'
import {
  addYearlyBusinessRemote,
  bulkDeleteSponsorContactsRemote,
  bulkDeleteSponsorProgramHistoriesRemote,
  createSponsorRemote,
  fetchSponsorContactsRemote,
  fetchSponsorRemote,
  fetchYearlyBusinessesRemote,
  updateSponsorRemote,
  updateSponsorContactRemote,
  updateYearlyBusinessRemote,
} from '@/features/sponsor/api/sponsors-api-client'
import {
  createSponsor,
  deleteSponsorContacts,
  deleteSponsorProgramHistories,
  getSponsorContacts,
  getSponsorDetail,
  getSponsorYearlyBusinesses,
  saveSponsorYearlyBusinesses,
  updateSponsorContact,
} from './admin-sponsors-service'

const fetchSponsorRemoteMock = vi.mocked(fetchSponsorRemote)
const fetchSponsorContactsRemoteMock = vi.mocked(fetchSponsorContactsRemote)
const fetchYearlyBusinessesRemoteMock = vi.mocked(fetchYearlyBusinessesRemote)
const addYearlyBusinessRemoteMock = vi.mocked(addYearlyBusinessRemote)
const bulkDeleteSponsorContactsRemoteMock = vi.mocked(bulkDeleteSponsorContactsRemote)
const bulkDeleteSponsorProgramHistoriesRemoteMock = vi.mocked(
  bulkDeleteSponsorProgramHistoriesRemote
)
const updateYearlyBusinessRemoteMock = vi.mocked(updateYearlyBusinessRemote)
const updateSponsorContactRemoteMock = vi.mocked(updateSponsorContactRemote)
const createSponsorRemoteMock = vi.mocked(createSponsorRemote)
const updateSponsorRemoteMock = vi.mocked(updateSponsorRemote)
const uploadSponsorLogoFileMock = vi.mocked(uploadSponsorLogoFile)

describe('createSponsor', () => {
  beforeEach(() => {
    createSponsorRemoteMock.mockReset()
    updateSponsorRemoteMock.mockReset()
    uploadSponsorLogoFileMock.mockReset()
  })

  it('생성된 후원사 id로 로고를 업로드하고 fileObjectId를 PATCH한다', async () => {
    const logoFile = new File(['logo'], 'sponsor.png', { type: 'image/png' })
    createSponsorRemoteMock.mockResolvedValue({
      id: '10',
      name: '후원사',
      createdAt: '2026-09-17T00:00:00Z',
      updatedAt: '2026-09-17T00:00:00Z',
    })
    uploadSponsorLogoFileMock.mockResolvedValue(301)
    updateSponsorRemoteMock.mockResolvedValue({
      id: '10',
      name: '후원사',
      logoFileId: '301',
      createdAt: '2026-09-17T00:00:00Z',
      updatedAt: '2026-09-17T00:00:00Z',
    })

    const created = await createSponsor({
      nameDisplayKo: '후원사',
      nameDisplayEn: 'Sponsor',
      organizationKind: 'corporate',
      businessNumber: '',
      sponsorshipStartDate: '2026-09-17T00:00:00.000Z',
      sponsorshipStatus: 'active',
      executives: '',
      district: '',
      detailAddress: '',
      homepageUrl: '',
      securityMemo: '',
      logoFile,
    })

    expect(uploadSponsorLogoFileMock).toHaveBeenCalledWith(10, logoFile)
    expect(updateSponsorRemoteMock).toHaveBeenCalledWith(
      '10',
      expect.objectContaining({ logoFileId: '301' })
    )
    expect(created.logoFileId).toBe('301')
  })
})

describe('deleteSponsorContacts', () => {
  it('선택한 담당자 id를 일괄 삭제 API에 전달한다', async () => {
    bulkDeleteSponsorContactsRemoteMock.mockResolvedValue()

    await deleteSponsorContacts(['201', '202'])

    expect(bulkDeleteSponsorContactsRemoteMock).toHaveBeenCalledWith(['201', '202'])
  })
})

describe('deleteSponsorProgramHistories', () => {
  it('후원사 id와 선택 이력의 programId를 일괄 삭제 API에 전달한다', async () => {
    bulkDeleteSponsorProgramHistoriesRemoteMock.mockResolvedValue()

    await deleteSponsorProgramHistories('10', ['101', '102'])

    expect(bulkDeleteSponsorProgramHistoriesRemoteMock).toHaveBeenCalledWith('10', [
      '101',
      '102',
    ])
  })
})

describe('getSponsorDetail', () => {
  beforeEach(() => {
    fetchSponsorRemoteMock.mockReset()
    fetchYearlyBusinessesRemoteMock.mockReset()
  })

  it('fetches sponsor only — does not call yearly-businesses', async () => {
    fetchSponsorRemoteMock.mockResolvedValue({
      id: 'sp-1',
      name: '후원사',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    })

    const detail = await getSponsorDetail('sp-1')

    expect(fetchSponsorRemoteMock).toHaveBeenCalledOnce()
    expect(fetchSponsorRemoteMock).toHaveBeenCalledWith('sp-1')
    expect(fetchYearlyBusinessesRemoteMock).not.toHaveBeenCalled()
    expect(detail.id).toBe('sp-1')
    expect(detail.yearlyBusinesses.every(row => row.id === '')).toBe(true)
  })

  it('maps embed yearlyBusinesses when the detail payload includes them', async () => {
    fetchSponsorRemoteMock.mockResolvedValue({
      id: 'sp-1',
      name: '후원사',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      yearlyBusinesses: [
        {
          id: 'yb-1',
          businessYear: 2024,
          donationAmount: 1000,
          beneficiaryCount: 2,
          memo: '',
        },
      ],
    })

    const detail = await getSponsorDetail('sp-1')

    expect(fetchYearlyBusinessesRemoteMock).not.toHaveBeenCalled()
    expect(detail.yearlyBusinesses.some(row => row.id === 'yb-1')).toBe(true)
  })
})

describe('getSponsorYearlyBusinesses', () => {
  beforeEach(() => {
    fetchYearlyBusinessesRemoteMock.mockReset()
  })

  it('maps yearly GET rows without merging placeholder years', async () => {
    fetchYearlyBusinessesRemoteMock.mockResolvedValue([
      {
        id: 'yb-1',
        businessYear: 2024,
        donationAmount: 5000,
        beneficiaryCount: 10,
        memo: '메모',
      },
    ])

    await expect(getSponsorYearlyBusinesses('sp-1')).resolves.toEqual([
      {
        id: 'yb-1',
        year: 2024,
        donationAmount: 5000,
        beneficiaryCount: 10,
        memo: '메모',
        businessName: '',
        managerNameSnapshot: '',
      },
    ])
    expect(fetchYearlyBusinessesRemoteMock).toHaveBeenCalledWith('sp-1')
  })
})

describe('saveSponsorYearlyBusinesses', () => {
  beforeEach(() => {
    addYearlyBusinessRemoteMock.mockReset()
    updateYearlyBusinessRemoteMock.mockReset()
    addYearlyBusinessRemoteMock.mockResolvedValue({ id: 'yb-new' })
    updateYearlyBusinessRemoteMock.mockResolvedValue({ id: 'yb-1' })
  })

  it('patches existing rows and posts filled years with required businessName', async () => {
    await saveSponsorYearlyBusinesses('sp-1', [
      {
        id: 'yb-1',
        year: 2025,
        donationAmount: 0,
        beneficiaryCount: 0,
        memo: '',
        businessName: 'JA 후원',
        managerNameSnapshot: '',
      },
      {
        id: '',
        year: 2026,
        donationAmount: 3000,
        beneficiaryCount: 2,
        memo: '',
        businessName: '',
        managerNameSnapshot: '',
      },
      {
        id: '',
        year: 2024,
        donationAmount: 0,
        beneficiaryCount: 0,
        memo: '',
        businessName: '',
        managerNameSnapshot: '',
      },
    ])

    expect(updateYearlyBusinessRemoteMock).toHaveBeenCalledWith('yb-1', {
      businessYear: 2025,
      businessName: 'JA 후원',
      donationAmount: 0,
      beneficiaryCount: 0,
      memo: '',
    })
    expect(addYearlyBusinessRemoteMock).toHaveBeenCalledOnce()
    expect(addYearlyBusinessRemoteMock).toHaveBeenCalledWith('sp-1', {
      businessYear: 2026,
      businessName: '2026년',
      donationAmount: 3000,
      beneficiaryCount: 2,
      memo: '',
    })
  })
})

describe('getSponsorContacts', () => {
  beforeEach(() => {
    fetchSponsorContactsRemoteMock.mockReset()
  })

  it('maps list responses and forwards filter params', async () => {
    fetchSponsorContactsRemoteMock.mockResolvedValue([
      {
        id: 'c-1',
        name: '김후원',
        contactType: 'LEAD',
        department: '기획',
      },
    ])

    const rows = await getSponsorContacts('sp-1', { department: '기획' })

    expect(fetchSponsorContactsRemoteMock).toHaveBeenCalledWith('sp-1', { department: '기획' })
    expect(rows).toEqual([
      expect.objectContaining({
        id: 'c-1',
        name: '김후원',
        contactType: 'lead',
        department: '기획',
      }),
    ])
  })
})

describe('updateSponsorContact', () => {
  beforeEach(() => {
    updateSponsorContactRemoteMock.mockReset()
  })

  it('keeps the requested type when the patch response omits type fields', async () => {
    updateSponsorContactRemoteMock.mockResolvedValue({
      id: 'c-1',
      name: '김후원',
    })

    const updated = await updateSponsorContact({
      id: 'c-1',
      name: '김후원',
      department: '기획',
      position: '매니저',
      officePhone: '',
      phone: '010',
      email: '',
      companyAddress: '',
      memo: '',
      registeredAt: '',
      contactType: 'lead',
    })

    expect(updated.contactType).toBe('lead')
    expect(updated.id).toBe('c-1')
  })
})
