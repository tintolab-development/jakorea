import { beforeEach, describe, expect, it, vi } from 'vitest'
import { saveAs } from 'file-saver'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { cmsAlertModal } from '@/shared/ui/cms-alert-modal-api'
import { downloadBlob, downloadExcel } from '@/shared/utils/file-download'
import { downloadFile } from '@/shared/lib/file-download'

vi.mock('file-saver', () => ({
  saveAs: vi.fn(),
}))

vi.mock('@/entities/download-log/api/download-log-service', () => ({
  recordFileDownload: vi.fn(),
}))

vi.mock('@/shared/ui/cms-alert-modal-api', () => ({
  cmsAlertModal: { show: vi.fn() },
}))

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

describe('downloadBlob / downloadExcel viewer guard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAuthStore.setState({ user: null })
  })

  it('VIEWER는 downloadBlob을 실행하지 않는다', () => {
    useAuthStore.setState({ user: viewerUser })
    downloadBlob(new Blob(['x']), 'test.xlsx')
    expect(saveAs).not.toHaveBeenCalled()
    expect(cmsAlertModal.show).toHaveBeenCalledTimes(1)
  })

  it('MASTER는 downloadExcel을 실행한다', () => {
    useAuthStore.setState({ user: masterUser })
    downloadExcel(new ArrayBuffer(8), 'test.xlsx')
    expect(saveAs).toHaveBeenCalledTimes(1)
    expect(cmsAlertModal.show).not.toHaveBeenCalled()
  })
})

describe('downloadFile viewer guard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAuthStore.setState({ user: null })
  })

  it('VIEWER는 downloadFile을 실행하지 않는다', () => {
    useAuthStore.setState({ user: viewerUser })
    downloadFile('notice.pdf')
    expect(cmsAlertModal.show).toHaveBeenCalledTimes(1)
  })
})
