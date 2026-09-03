import { AxiosError } from 'axios'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  clearDownloadLogMemoryForTests,
  listDownloadLogMemory,
  recordFileDownload,
} from '@/entities/download-log/api/download-log-service'
import { postFileAccessLog } from '@/shared/lib/post-file-access-log'
import { shouldRecordFileAccessRemotely } from '@/shared/lib/should-record-file-access-remotely'

vi.mock('@/shared/lib/query-client', () => ({
  queryClient: { invalidateQueries: vi.fn() },
}))

vi.mock('@/shared/lib/post-file-access-log', async importOriginal => {
  const actual = await importOriginal<typeof import('@/shared/lib/post-file-access-log')>()
  return {
    ...actual,
    postFileAccessLog: vi.fn().mockResolvedValue(undefined),
  }
})

vi.mock('@/shared/lib/should-record-file-access-remotely', () => ({
  shouldRecordFileAccessRemotely: vi.fn(() => false),
}))

function axiosStatusError(status: number): AxiosError {
  const error = new AxiosError('request failed')
  error.response = {
    status,
    data: {},
    statusText: 'Error',
    headers: {},
    config: {} as never,
  }
  return error
}

describe('recordFileDownload', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    clearDownloadLogMemoryForTests()
    vi.mocked(shouldRecordFileAccessRemotely).mockReturnValue(false)
  })

  it('비원격이면 메모리 stub에 기록한다', async () => {
    await recordFileDownload({ fileName: '회원_목록.xlsx', userId: 'u1', userName: '홍길동' })
    expect(postFileAccessLog).not.toHaveBeenCalled()
    expect(listDownloadLogMemory()).toHaveLength(1)
    expect(listDownloadLogMemory()[0]?.fileName).toBe('회원_목록.xlsx')
  })

  it('실세션이면 POST /api/admin/logs/file-access/client를 호출한다', async () => {
    vi.mocked(shouldRecordFileAccessRemotely).mockReturnValue(true)

    await recordFileDownload({ fileName: '회원_목록.xlsx', userId: 'u1', userName: '홍길동' })

    expect(postFileAccessLog).toHaveBeenCalledWith(
      expect.objectContaining({ fileName: '회원_목록.xlsx' })
    )
    expect(listDownloadLogMemory()).toHaveLength(0)
  })

  it('실 API POST 실패 시 throw한다', async () => {
    vi.mocked(shouldRecordFileAccessRemotely).mockReturnValue(true)
    vi.mocked(postFileAccessLog).mockRejectedValueOnce(new Error('network'))

    await expect(recordFileDownload({ fileName: '회원_목록.xlsx' })).rejects.toThrow('network')
  })

  it('client API 미구현(404/405)이면 stub에 기록한다', async () => {
    vi.mocked(shouldRecordFileAccessRemotely).mockReturnValue(true)
    vi.mocked(postFileAccessLog).mockRejectedValueOnce(axiosStatusError(404))

    await recordFileDownload({ fileName: '지급조서.pdf', userId: 'u1', userName: '홍길동' })

    expect(listDownloadLogMemory()).toHaveLength(1)
    expect(listDownloadLogMemory()[0]?.fileName).toBe('지급조서.pdf')
  })
})
