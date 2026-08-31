import { describe, expect, it, vi, beforeEach } from 'vitest'
import {
  shouldMockConsentFileUpload,
  uploadConsentEvidenceFile,
} from './upload-consent-evidence-file'

vi.mock('@/shared/config/real-api-modules', () => ({
  isRealApiModuleEnabled: vi.fn(),
}))

vi.mock('@/shared/api/orval-mutator', () => ({
  customInstance: vi.fn(),
}))

import { isRealApiModuleEnabled } from '@/shared/config/real-api-modules'
import { customInstance } from '@/shared/api/orval-mutator'

describe('uploadConsentEvidenceFile', () => {
  beforeEach(() => {
    vi.mocked(isRealApiModuleEnabled).mockReset()
    vi.mocked(customInstance).mockReset()
  })

  it('files 모듈 비활성 시 stub fileObjectId를 반환한다', async () => {
    vi.mocked(isRealApiModuleEnabled).mockReturnValue(false)
    vi.mocked(customInstance).mockResolvedValue({
      success: true,
      data: { id: 42, version: '1.0' },
    })

    const file = new File(['x'], 'crime.png', { type: 'image/png' })
    const id = await uploadConsentEvidenceFile({ file })

    expect(id).toBe(900_000_001 + (file.size % 1000))
    expect(customInstance).toHaveBeenCalledTimes(1)
    expect(vi.mocked(customInstance).mock.calls[0]?.[0]?.url).toContain('CRIMINAL_HISTORY')
  })

  it('files 모듈 활성 시 upload-requests를 호출한다', async () => {
    vi.mocked(isRealApiModuleEnabled).mockImplementation(module => module === 'files')
    vi.mocked(customInstance)
      .mockResolvedValueOnce({
        success: true,
        data: {
          fileObjectId: 501,
          uploadUrl: 'https://example.com/upload',
          method: 'PUT',
        },
      })
      .mockResolvedValueOnce({
        success: true,
        data: { fileObjectId: 501 },
      })

    global.fetch = vi.fn().mockResolvedValue({ ok: true }) as typeof fetch

    const file = new File(['xy'], 'crime.png', { type: 'image/png' })
    const id = await uploadConsentEvidenceFile({ file, memberId: 1001 })

    expect(id).toBe(501)
    expect(customInstance).toHaveBeenCalledTimes(2)
    const prepareCall = vi.mocked(customInstance).mock.calls[0]?.[0]
    expect(prepareCall?.url).toBe('/api/admin/files/upload-requests')
    expect(prepareCall?.data).toMatchObject({ ownerId: 1001 })
  })

  it('shouldMockConsentFileUpload는 files 모듈 활성 여부를 따른다', () => {
    vi.mocked(isRealApiModuleEnabled).mockReturnValue(false)
    expect(shouldMockConsentFileUpload()).toBe(true)
    vi.mocked(isRealApiModuleEnabled).mockReturnValue(true)
    expect(shouldMockConsentFileUpload()).toBe(false)
  })
})
