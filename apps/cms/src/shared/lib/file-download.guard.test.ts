// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { saveAs } from 'file-saver'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { cmsAlertModal } from '@/shared/ui/cms-alert-modal-api'
import { downloadBlob, downloadExcel } from '@/shared/utils/file-download'
import { downloadFile } from '@/shared/lib/file-download'
import {
  clearDownloadLogMemoryForTests,
  listDownloadLogMemory,
} from '@/entities/download-log/api/download-log-service'
import { postFileAccessLog } from '@/shared/lib/post-file-access-log'
import { shouldRecordFileAccessRemotely } from '@/shared/lib/should-record-file-access-remotely'

vi.mock('file-saver', () => ({
  saveAs: vi.fn(),
}))

vi.mock('@/shared/ui/cms-alert-modal-api', () => ({
  cmsAlertModal: { show: vi.fn() },
}))

vi.mock('@/shared/lib/query-client', () => ({
  queryClient: { invalidateQueries: vi.fn() },
}))

vi.mock('@/shared/lib/post-file-access-log', () => ({
  postFileAccessLog: vi.fn().mockResolvedValue({}),
  FILE_ACCESS_LOG_CREATE_PATH: '/api/admin/logs/file-access/client',
}))

vi.mock('@/shared/lib/should-record-file-access-remotely', () => ({
  shouldRecordFileAccessRemotely: vi.fn(() => false),
}))

const masterUser = {
  id: 'master-1',
  email: 'admin1@jakorea.org',
  name: '김관리',
  role: 'ADMIN' as const,
  roleCode: 'MASTER' as const,
  adminLevel: 'MASTER' as const,
  isActive: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}

const viewerUser = {
  id: 'viewer-1',
  email: 'viewer1@jakorea.org',
  name: '뷰어관리',
  role: 'ADMIN' as const,
  roleCode: 'VIEWER' as const,
  adminLevel: 'GENERAL' as const,
  isActive: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}

describe('downloadBlob / downloadExcel access log', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    clearDownloadLogMemoryForTests()
    vi.mocked(shouldRecordFileAccessRemotely).mockReturnValue(false)
    vi.mocked(postFileAccessLog).mockResolvedValue({})
    useAuthStore.setState({ user: masterUser, token: null })
    localStorage.setItem('auth_user', JSON.stringify(masterUser))
  })

  it('VIEWER는 downloadBlob을 실행하지 않는다', async () => {
    useAuthStore.setState({ user: viewerUser })
    await downloadBlob(new Blob(['x']), 'test.xlsx')
    expect(saveAs).not.toHaveBeenCalled()
    expect(cmsAlertModal.show).toHaveBeenCalledTimes(1)
  })

  it('MASTER는 이력 기록 후 downloadExcel을 실행한다', async () => {
    await downloadExcel(new ArrayBuffer(8), 'test.xlsx')
    expect(listDownloadLogMemory()).toHaveLength(1)
    expect(listDownloadLogMemory()[0]?.fileName).toBe('test.xlsx')
    expect(saveAs).toHaveBeenCalledTimes(1)
  })

  it('skipAccessLog면 이력 없이 저장한다', async () => {
    await downloadBlob(new Blob(['x']), 'cert.pdf', { skipAccessLog: true })
    expect(listDownloadLogMemory()).toHaveLength(0)
    expect(saveAs).toHaveBeenCalledTimes(1)
  })

  it('실 API 이력 기록 실패 시 파일을 저장하지 않는다', async () => {
    vi.mocked(shouldRecordFileAccessRemotely).mockReturnValue(true)
    vi.mocked(postFileAccessLog).mockRejectedValueOnce(new Error('log failed'))
    await expect(downloadBlob(new Blob(['x']), 'fail.xlsx')).rejects.toThrow('log failed')
    expect(saveAs).not.toHaveBeenCalled()
  })

  it('실세션이면 POST file-access 후 저장한다', async () => {
    vi.mocked(shouldRecordFileAccessRemotely).mockReturnValue(true)
    await downloadBlob(new Blob(['x']), '회원_목록.xlsx')
    expect(postFileAccessLog).toHaveBeenCalledWith(
      expect.objectContaining({ fileName: '회원_목록.xlsx' })
    )
    expect(saveAs).toHaveBeenCalledTimes(1)
  })
})

describe('downloadFile access log', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    clearDownloadLogMemoryForTests()
    vi.mocked(shouldRecordFileAccessRemotely).mockReturnValue(false)
    useAuthStore.setState({ user: masterUser })
    localStorage.setItem('auth_user', JSON.stringify(masterUser))
  })

  it('VIEWER는 downloadFile을 실행하지 않는다', async () => {
    useAuthStore.setState({ user: viewerUser })
    await downloadFile('notice.pdf')
    expect(cmsAlertModal.show).toHaveBeenCalledTimes(1)
    expect(listDownloadLogMemory()).toHaveLength(0)
  })
})
