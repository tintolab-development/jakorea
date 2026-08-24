import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/entities/user/api/auth-service', () => ({
  hasRemoteAdminJwt: () => true,
}))

vi.mock('@/shared/config/real-api-modules', () => ({
  isRealApiModuleEnabled: () => true,
}))

vi.mock('@/features/sponsor/api/sponsors-api-client', async importOriginal => {
  const actual = await importOriginal<typeof import('@/features/sponsor/api/sponsors-api-client')>()
  return {
    ...actual,
    fetchSponsorRemote: vi.fn(),
    fetchYearlyBusinessesRemote: vi.fn(),
    addYearlyBusinessRemote: vi.fn(),
    updateYearlyBusinessRemote: vi.fn(),
  }
})

import {
  addYearlyBusinessRemote,
  fetchSponsorRemote,
  fetchYearlyBusinessesRemote,
  updateYearlyBusinessRemote,
} from '@/features/sponsor/api/sponsors-api-client'
import {
  getSponsorDetail,
  getSponsorYearlyBusinesses,
  saveSponsorYearlyBusinesses,
} from './admin-sponsors-service'

const fetchSponsorRemoteMock = vi.mocked(fetchSponsorRemote)
const fetchYearlyBusinessesRemoteMock = vi.mocked(fetchYearlyBusinessesRemote)
const addYearlyBusinessRemoteMock = vi.mocked(addYearlyBusinessRemote)
const updateYearlyBusinessRemoteMock = vi.mocked(updateYearlyBusinessRemote)

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
