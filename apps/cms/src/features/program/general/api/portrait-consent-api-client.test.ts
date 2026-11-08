import { beforeEach, describe, expect, it, vi } from 'vitest'

const { customInstanceMock, loadSensitiveAdminFileBlobMock, downloadBlobMock } = vi.hoisted(() => ({
  customInstanceMock: vi.fn(),
  loadSensitiveAdminFileBlobMock: vi.fn(),
  downloadBlobMock: vi.fn(),
}))

vi.mock('@/shared/api/orval-mutator', () => ({
  default: customInstanceMock,
  customInstance: customInstanceMock,
}))

vi.mock('@/shared/lib/admin-file-upload', () => ({
  loadSensitiveAdminFileBlob: loadSensitiveAdminFileBlobMock,
}))

vi.mock('@/shared/utils/file-download', () => ({
  downloadBlob: downloadBlobMock,
}))

import customInstance from '@/shared/api/orval-mutator'
import {
  downloadOrganizationPortraitConsentFile,
  fetchOrganizationPortraitConsentRemote,
  PORTRAIT_CONSENT_FILE_DOWNLOAD_REASON,
} from './portrait-consent-api-client'

describe('fetchOrganizationPortraitConsentRemote', () => {
  beforeEach(() => {
    vi.mocked(customInstance).mockReset()
  })

  it('기관 단위 초상권 동의서 GET을 호출한다', async () => {
    vi.mocked(customInstance).mockResolvedValue({
      success: true,
      data: {
        fileObjectId: 88001,
        originalFileName: '초상권동의서.pdf',
        status: 'SUBMITTED',
      },
    })

    await expect(fetchOrganizationPortraitConsentRemote('1691524')).resolves.toEqual({
      fileObjectId: 88001,
      originalFileName: '초상권동의서.pdf',
      status: 'SUBMITTED',
    })
    expect(customInstance).toHaveBeenCalledWith(
      {
        url: '/api/admin/organization-applications/1691524/portrait-consent',
        method: 'GET',
      },
      { skipGlobalErrorAlert: true }
    )
  })

  it('미제출·빈 본문·404는 null이다', async () => {
    vi.mocked(customInstance).mockResolvedValue({ success: true, data: {} })
    await expect(fetchOrganizationPortraitConsentRemote(1691524)).resolves.toBeNull()

    vi.mocked(customInstance).mockResolvedValue(null)
    await expect(fetchOrganizationPortraitConsentRemote(1691524)).resolves.toBeNull()

    vi.mocked(customInstance).mockRejectedValue({ response: { status: 404 } })
    await expect(fetchOrganizationPortraitConsentRemote(1691524)).resolves.toBeNull()
  })
})

describe('downloadOrganizationPortraitConsentFile', () => {
  beforeEach(() => {
    loadSensitiveAdminFileBlobMock.mockReset()
    downloadBlobMock.mockReset()
  })

  it('민감 파일 claim+stream으로 업로드 원본을 저장한다', async () => {
    const blob = new Blob(['docx-bytes'])
    loadSensitiveAdminFileBlobMock.mockResolvedValue(blob)
    downloadBlobMock.mockResolvedValue(undefined)

    await downloadOrganizationPortraitConsentFile({
      fileObjectId: 88001,
      fileName: '학교전체_초상권.docx',
    })

    expect(loadSensitiveAdminFileBlobMock).toHaveBeenCalledWith({
      fileObjectId: 88001,
      reason: PORTRAIT_CONSENT_FILE_DOWNLOAD_REASON,
    })
    expect(downloadBlobMock).toHaveBeenCalledWith(blob, '학교전체_초상권.docx', {
      skipAccessLog: true,
    })
  })
})
