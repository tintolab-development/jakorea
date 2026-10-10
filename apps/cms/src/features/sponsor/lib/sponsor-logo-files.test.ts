import { describe, expect, it, vi, beforeEach } from 'vitest'
import {
  enrichSponsorLogoFiles,
  parseSponsorLogoFileObjectId,
  sponsorLogoFallbackFileName,
} from '@/features/sponsor/lib/sponsor-logo-files'

vi.mock('@/shared/lib/admin-file-upload/upload-maybe-mock', () => ({
  shouldMockAdminFileUpload: vi.fn(() => false),
}))

vi.mock('@/shared/lib/admin-file-upload', () => ({
  getFileStatus: vi.fn(),
}))

import { getFileStatus } from '@/shared/lib/admin-file-upload'
import { shouldMockAdminFileUpload } from '@/shared/lib/admin-file-upload/upload-maybe-mock'

const getFileStatusMock = vi.mocked(getFileStatus)
const shouldMockMock = vi.mocked(shouldMockAdminFileUpload)

describe('parseSponsorLogoFileObjectId', () => {
  it('parses numeric file object ids', () => {
    expect(parseSponsorLogoFileObjectId('2055855')).toBe(2055855)
  })

  it('returns null for legacy filename ids', () => {
    expect(parseSponsorLogoFileObjectId('samsung_logo.ai')).toBeNull()
  })
})

describe('enrichSponsorLogoFiles', () => {
  beforeEach(() => {
    getFileStatusMock.mockReset()
    shouldMockMock.mockReturnValue(false)
  })

  it('fills originalFileName from admin files API', async () => {
    getFileStatusMock.mockResolvedValue({
      fileObjectId: 2055855,
      ownerType: 'LOGO',
      originalFileName: 'brand-logo.png',
    })

    const logos = await enrichSponsorLogoFiles([{ id: '2055855', fileName: '' }])
    expect(logos).toEqual([{ id: '2055855', fileName: 'brand-logo.png' }])
    expect(getFileStatusMock).toHaveBeenCalledWith(2055855)
  })

  it('uses fallback when metadata fetch fails', async () => {
    getFileStatusMock.mockRejectedValue(new Error('network'))

    const logos = await enrichSponsorLogoFiles([{ id: '2055855', fileName: '' }])
    expect(logos[0]?.fileName).toBe(sponsorLogoFallbackFileName('2055855'))
  })
})
