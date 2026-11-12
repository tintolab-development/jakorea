import { beforeEach, describe, expect, it, vi } from 'vitest'

const { fetchFileContentBlobMock, loadAdminFileBlobMock, downloadAdminFileMock } = vi.hoisted(
  () => ({
    fetchFileContentBlobMock: vi.fn(),
    loadAdminFileBlobMock: vi.fn(),
    downloadAdminFileMock: vi.fn(),
  })
)

vi.mock('@/shared/lib/admin-file-upload', () => ({
  fetchFileContentBlob: fetchFileContentBlobMock,
  loadAdminFileBlob: loadAdminFileBlobMock,
  downloadAdminFile: downloadAdminFileMock,
}))

import { loadLogoBlob } from '@/features/sponsor/lib/logo-preview-blob'

describe('loadLogoBlob (QA-0110)', () => {
  beforeEach(() => {
    fetchFileContentBlobMock.mockReset()
    loadAdminFileBlobMock.mockReset()
    downloadAdminFileMock.mockReset()
  })

  it('미리보기는 인라인 content 경로로 받고 다운로드 경로는 쓰지 않는다', async () => {
    const blob = new Blob(['x'], { type: 'image/png' })
    fetchFileContentBlobMock.mockResolvedValue(blob)

    await expect(loadLogoBlob(101)).resolves.toBe(blob)

    expect(fetchFileContentBlobMock).toHaveBeenCalledWith(101, { skipGlobalErrorAlert: true })
    expect(loadAdminFileBlobMock).not.toHaveBeenCalled()
    expect(downloadAdminFileMock).not.toHaveBeenCalled()
  })

  it('같은 세션에서는 같은 로고를 다시 요청하지 않는다', async () => {
    const blob = new Blob(['x'], { type: 'image/png' })
    fetchFileContentBlobMock.mockResolvedValue(blob)

    await loadLogoBlob(202)
    await loadLogoBlob(202)

    expect(fetchFileContentBlobMock).toHaveBeenCalledTimes(1)
  })

  it('실패하면 캐시를 비워 다음에 다시 요청한다', async () => {
    fetchFileContentBlobMock.mockRejectedValueOnce(new Error('404'))
    await expect(loadLogoBlob(303)).rejects.toThrow('404')

    const blob = new Blob(['x'], { type: 'image/png' })
    fetchFileContentBlobMock.mockResolvedValueOnce(blob)
    await expect(loadLogoBlob(303)).resolves.toBe(blob)
    expect(fetchFileContentBlobMock).toHaveBeenCalledTimes(2)
  })
})
