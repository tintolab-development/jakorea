import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/shared/instance/axios-instance', () => ({
  axiosClient: { request: vi.fn() },
}))
vi.mock('@/shared/api/orval-mutator', () => ({ default: vi.fn(), customInstance: vi.fn() }))
vi.mock('@/shared/lib/admin-file-upload/attachments', () => ({
  loadSensitiveAdminFileBlob: vi.fn(),
}))
vi.mock('@/shared/utils/file-download', async () => {
  const actual = await vi.importActual<typeof import('@/shared/utils/file-download')>(
    '@/shared/utils/file-download'
  )
  return { ...actual, downloadBlob: vi.fn() }
})
vi.mock('@/features/auth/model/auth-store', () => ({
  useAuthStore: { getState: () => ({ user: { permissionCodes: null } }) },
}))
vi.mock('@/shared/lib/admin-role-policy', () => ({
  resolveAdminRoleCodeFromUser: () => 'MASTER',
  showAdminAccessDeniedAlert: vi.fn(),
}))

import customInstance from '@/shared/api/orval-mutator'
import { axiosClient } from '@/shared/instance/axios-instance'
import { loadSensitiveAdminFileBlob } from '@/shared/lib/admin-file-upload/attachments'
import { downloadBlob } from '@/shared/utils/file-download'
import {
  PERFORMANCE_EXPORT_DOWNLOAD_REASON,
  exportPerformanceRecordsRemote,
} from './performance-api-client'

describe('exportPerformanceRecordsRemote', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('200 동기 응답은 바로 저장하고 client 이력은 생략한다 (서버 기록)', async () => {
    const blob = new Blob(['xlsx'])
    vi.mocked(axiosClient.request).mockResolvedValue({
      status: 200,
      data: blob,
      headers: { 'content-disposition': 'attachment; filename="performance_all_pall_v1.xlsx"' },
    })

    await exportPerformanceRecordsRemote({})

    expect(loadSensitiveAdminFileBlob).not.toHaveBeenCalled()
    // 서버 영문 이름 대신 규칙 이름으로 저장한다.
    expect(downloadBlob).toHaveBeenCalledWith(
      blob,
      expect.stringMatching(/^\[JA Korea\] CMS 어드민_실적데이터_\d{6}\.xlsx$/),
      { skipAccessLog: true }
    )
  })

  it('서버 이름이 이미 [JA Korea] 규칙이면 그 이름으로 저장한다', async () => {
    const blob = new Blob(['xlsx'])
    vi.mocked(axiosClient.request).mockResolvedValue({
      status: 200,
      data: blob,
      headers: {
        'content-disposition':
          "attachment; filename*=UTF-8''%5BJA%20Korea%5D%20CMS%20%EC%96%B4%EB%93%9C%EB%AF%BC_%EC%8B%A4%EC%A0%81%EB%8D%B0%EC%9D%B4%ED%84%B0_261101.xlsx",
      },
    })

    await exportPerformanceRecordsRemote({})

    expect(downloadBlob).toHaveBeenCalledWith(
      blob,
      '[JA Korea] CMS 어드민_실적데이터_261101.xlsx',
      { skipAccessLog: true }
    )
  })

  it('202 job 결과 파일은 sensitive-downloads(claim→stream)로 받고 client 이력은 생략한다', async () => {
    const fileBlob = new Blob(['xlsx'])
    vi.mocked(axiosClient.request).mockResolvedValue({
      status: 202,
      data: new Blob([''], { type: 'application/json' }),
      headers: { 'x-generated-file-job-id': '9' },
    })
    vi.mocked(customInstance).mockResolvedValue({ jobStatus: 'COMPLETED', fileObjectId: 55 })
    vi.mocked(loadSensitiveAdminFileBlob).mockResolvedValue(fileBlob)

    await exportPerformanceRecordsRemote({})

    expect(loadSensitiveAdminFileBlob).toHaveBeenCalledWith({
      fileObjectId: 55,
      reason: PERFORMANCE_EXPORT_DOWNLOAD_REASON,
    })
    expect(PERFORMANCE_EXPORT_DOWNLOAD_REASON).toBe('실적 데이터 엑셀 다운로드')
    expect(downloadBlob).toHaveBeenCalledWith(fileBlob, expect.stringMatching(/\.xlsx$/), {
      skipAccessLog: true,
    })
  })

  it('stream 실패(503 등)면 파일을 저장하지 않는다', async () => {
    vi.mocked(axiosClient.request).mockResolvedValue({
      status: 202,
      data: { generatedFileJobId: 9 },
      headers: {},
    })
    vi.mocked(customInstance).mockResolvedValue({ jobStatus: 'COMPLETED', fileObjectId: 55 })
    vi.mocked(loadSensitiveAdminFileBlob).mockRejectedValue(new Error('AUDIT_LOG_UNAVAILABLE'))

    await expect(exportPerformanceRecordsRemote({})).rejects.toThrow('AUDIT_LOG_UNAVAILABLE')
    expect(downloadBlob).not.toHaveBeenCalled()
  })
})
