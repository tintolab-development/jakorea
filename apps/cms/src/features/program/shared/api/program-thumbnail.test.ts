import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const loadAdminFileBlob = vi.fn()

vi.mock('@/shared/lib/admin-file-upload/attachments', () => ({
  loadAdminFileBlob: (...args: unknown[]) => loadAdminFileBlob(...args),
}))

vi.mock('@/shared/api/orval-mutator', () => ({
  default: vi.fn(),
}))

import {
  forgetProgramThumbnailPreviewBlob,
  loadProgramThumbnailPreviewUrl,
  rememberProgramThumbnailPreviewBlob,
  resetProgramThumbnailPreviewBlobsForTests,
} from '@/features/program/shared/api/program-thumbnail'

describe('loadProgramThumbnailPreviewUrl', () => {
  beforeEach(() => {
    resetProgramThumbnailPreviewBlobsForTests()
    loadAdminFileBlob.mockReset()
  })

  afterEach(() => {
    resetProgramThumbnailPreviewBlobsForTests()
  })

  it('업로드 직후 기억한 blob이면 download/content를 다시 치지 않는다', async () => {
    const file = new File(['img'], 'thumb.png', { type: 'image/png' })
    rememberProgramThumbnailPreviewBlob(42, file)
    const url = await loadProgramThumbnailPreviewUrl(42)
    expect(url.startsWith('blob:')).toBe(true)
    expect(loadAdminFileBlob).not.toHaveBeenCalled()
  })

  it('캐시가 없으면 download만 한 번 받고 content로 재시도하지 않는다', async () => {
    loadAdminFileBlob.mockResolvedValue(new Blob(['img'], { type: 'image/png' }))
    const url = await loadProgramThumbnailPreviewUrl(7)
    expect(url.startsWith('blob:')).toBe(true)
    expect(loadAdminFileBlob).toHaveBeenCalledTimes(1)
    expect(loadAdminFileBlob).toHaveBeenCalledWith(7, { skipGlobalErrorAlert: true })
  })

  it('download 실패를 content 404 fallback으로 가리지 않는다', async () => {
    loadAdminFileBlob.mockRejectedValue(new Error('403'))
    await expect(loadProgramThumbnailPreviewUrl(9)).rejects.toThrow('403')
    expect(loadAdminFileBlob).toHaveBeenCalledTimes(1)
  })

  it('삭제한 썸네일 캐시는 다시 받는다', async () => {
    rememberProgramThumbnailPreviewBlob(3, new File(['img'], 'a.png', { type: 'image/png' }))
    forgetProgramThumbnailPreviewBlob(3)
    loadAdminFileBlob.mockResolvedValue(new Blob(['img'], { type: 'image/png' }))
    await loadProgramThumbnailPreviewUrl(3)
    expect(loadAdminFileBlob).toHaveBeenCalledTimes(1)
  })
})
