import { beforeEach, describe, expect, it, vi } from 'vitest'
import { customInstance } from '@/shared/api/orval-mutator'
import {
  FILE_ACCESS_LOG_CREATE_PATH,
  postFileAccessLog,
} from '@/shared/lib/post-file-access-log'

vi.mock('@/shared/api/orval-mutator', () => ({
  customInstance: vi.fn().mockResolvedValue({ success: true, data: null }),
}))

describe('postFileAccessLog', () => {
  beforeEach(() => {
    vi.mocked(customInstance).mockReset()
    vi.mocked(customInstance).mockResolvedValue({ success: true, data: null })
  })

  it('빈 파일명이면 throw한다', async () => {
    await expect(postFileAccessLog({ fileName: '   ' })).rejects.toThrow('다운로드 파일명이 없습니다.')
    expect(customInstance).not.toHaveBeenCalled()
  })

  it('POST /api/admin/logs/file-access/client 로 보낸다', async () => {
    await postFileAccessLog({
      fileName: '회원_목록_20260903.xlsx',
      userAgent: 'Mozilla/5.0',
    })

    expect(customInstance).toHaveBeenCalledWith(
      expect.objectContaining({
        url: FILE_ACCESS_LOG_CREATE_PATH,
        method: 'POST',
        data: {
          fileName: '회원_목록_20260903.xlsx',
          userAgent: 'Mozilla/5.0',
        },
      }),
      { skipGlobalErrorAlert: true }
    )
  })

  it('응답 id를 반환한다', async () => {
    vi.mocked(customInstance).mockResolvedValueOnce({ success: true, data: { id: '42' } })
    await expect(postFileAccessLog({ fileName: '지급조서.pdf' })).resolves.toEqual({ id: '42' })
  })
})
