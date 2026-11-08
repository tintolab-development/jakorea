import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { FILE_ACCESS_CLIENT_LOG_META_ENV } from '@/shared/lib/download-access-log-meta'
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

  it('POST /api/admin/logs/file-access/client 로 fileName·userAgent만 보낸다', async () => {
    await expect(
      postFileAccessLog({
        fileName: '계좌 지급 대상 목록_20261107.xlsx',
        userAgent: 'Mozilla/5.0',
      })
    ).resolves.toEqual({})

    expect(customInstance).toHaveBeenCalledTimes(1)
    expect(customInstance).toHaveBeenCalledWith(
      expect.objectContaining({
        url: FILE_ACCESS_LOG_CREATE_PATH,
        method: 'POST',
        data: {
          fileName: '계좌 지급 대상 목록_20261107.xlsx',
          userAgent: 'Mozilla/5.0',
        },
      }),
      { skipGlobalErrorAlert: true }
    )
    expect(vi.mocked(customInstance).mock.calls[0]?.[0]).not.toHaveProperty('data.ipAddress')
  })

  it('성공 data null을 빈 객체로 정규화하지 않고 id를 만들지 않는다', async () => {
    await expect(postFileAccessLog({ fileName: '지급조서.pdf' })).resolves.toEqual({})
  })

  it('userAgent는 255자로 자른다', async () => {
    await postFileAccessLog({
      fileName: '목록.xlsx',
      userAgent: 'A'.repeat(300),
    })
    expect(customInstance).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          fileName: '목록.xlsx',
          userAgent: 'A'.repeat(255),
        },
      }),
      { skipGlobalErrorAlert: true }
    )
  })
})

describe('postFileAccessLog accessLog (downloadKind·containedPiiTypes)', () => {
  beforeEach(() => {
    vi.mocked(customInstance).mockReset()
    vi.mocked(customInstance).mockResolvedValue({ success: true, data: null })
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  const accessLog = { downloadKind: 'MEMBER_LIST_EXPORT', containedPiiTypes: ['NAME'] } as const

  it('플래그가 꺼져 있으면 기존 body(fileName·userAgent)만 보낸다', async () => {
    vi.stubEnv(FILE_ACCESS_CLIENT_LOG_META_ENV, 'false')
    await postFileAccessLog({ fileName: '회원목록.xlsx', userAgent: 'UA', accessLog })
    expect(vi.mocked(customInstance).mock.calls[0]?.[0]).toEqual(
      expect.objectContaining({ data: { fileName: '회원목록.xlsx', userAgent: 'UA' } })
    )
  })

  it('플래그가 켜지면 downloadKind·containedPiiTypes를 함께 보낸다', async () => {
    vi.stubEnv(FILE_ACCESS_CLIENT_LOG_META_ENV, 'true')
    await postFileAccessLog({ fileName: '회원목록.xlsx', userAgent: 'UA', accessLog })
    expect(vi.mocked(customInstance).mock.calls[0]?.[0]).toEqual(
      expect.objectContaining({
        data: {
          fileName: '회원목록.xlsx',
          userAgent: 'UA',
          downloadKind: 'MEMBER_LIST_EXPORT',
          containedPiiTypes: ['NAME'],
        },
      })
    )
  })
})
