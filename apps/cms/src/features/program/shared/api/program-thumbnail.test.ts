import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const fetchFileContentBlob = vi.fn()

vi.mock('@/shared/lib/admin-file-upload/attachments', () => ({
  fetchFileContentBlob: (...args: unknown[]) => fetchFileContentBlob(...args),
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
    fetchFileContentBlob.mockReset()
  })

  afterEach(() => {
    resetProgramThumbnailPreviewBlobsForTests()
  })

  it('업로드 직후 기억한 blob이면 download/content를 다시 치지 않는다', async () => {
    const file = new File(['img'], 'thumb.png', { type: 'image/png' })
    rememberProgramThumbnailPreviewBlob(42, file)
    const url = await loadProgramThumbnailPreviewUrl(42)
    expect(url.startsWith('blob:')).toBe(true)
    expect(fetchFileContentBlob).not.toHaveBeenCalled()
  })

  it('캐시가 없으면 권한 검증된 content 미리보기만 한 번 요청한다', async () => {
    fetchFileContentBlob.mockResolvedValue(new Blob(['img'], { type: 'image/png' }))
    const url = await loadProgramThumbnailPreviewUrl(7)
    expect(url.startsWith('blob:')).toBe(true)
    expect(fetchFileContentBlob).toHaveBeenCalledTimes(1)
    expect(fetchFileContentBlob).toHaveBeenCalledWith(7, { skipGlobalErrorAlert: true })
  })

  it('content 접근 거부 시 다운로드 경로로 우회하지 않는다', async () => {
    fetchFileContentBlob.mockRejectedValue(new Error('403'))
    await expect(loadProgramThumbnailPreviewUrl(9)).rejects.toThrow('403')
    expect(fetchFileContentBlob).toHaveBeenCalledTimes(1)
  })

  it('HTML 또는 JSON 응답을 이미지로 렌더링하지 않는다', async () => {
    fetchFileContentBlob.mockResolvedValue(new Blob(['error'], { type: 'text/html' }))
    await expect(loadProgramThumbnailPreviewUrl(11)).rejects.toThrow('대표 이미지를 불러오지 못했습니다')
  })

  it('삭제한 썸네일 캐시는 다시 받는다', async () => {
    rememberProgramThumbnailPreviewBlob(3, new File(['img'], 'a.png', { type: 'image/png' }))
    forgetProgramThumbnailPreviewBlob(3)
    fetchFileContentBlob.mockResolvedValue(new Blob(['img'], { type: 'image/png' }))
    await loadProgramThumbnailPreviewUrl(3)
    expect(fetchFileContentBlob).toHaveBeenCalledTimes(1)
  })
})
