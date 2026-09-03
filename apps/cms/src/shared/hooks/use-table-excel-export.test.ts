// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import type { ColumnsType } from 'antd/es/table'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { cmsAlertModal } from '@/shared/ui/cms-alert-modal-api'
import { useTableExcelExport } from '@/shared/hooks/use-table-excel-export'

vi.mock('@/shared/ui/cms-alert-modal-api', () => ({
  cmsAlertModal: { show: vi.fn() },
}))

vi.mock('@/shared/utils/table-export', () => ({
  exportTableToExcel: vi.fn().mockResolvedValue(undefined),
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

type Row = { name: string }

const columns: ColumnsType<Row> = [{ title: '이름', dataIndex: 'name', key: 'name' }]
const data: Row[] = [{ name: '홍길동' }]

describe('useTableExcelExport viewer guard', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    useAuthStore.setState({ user: null })
    const { exportTableToExcel } = await import('@/shared/utils/table-export')
    vi.mocked(exportTableToExcel).mockClear()
  })

  it('VIEWER는 exporter를 호출하지 않는다', async () => {
    useAuthStore.setState({ user: viewerUser })
    const { exportTableToExcel } = await import('@/shared/utils/table-export')

    const { result } = renderHook(() =>
      useTableExcelExport({ columns, data, filename: '목록' })
    )

    await act(async () => {
      await result.current.exportExcel()
    })

    expect(exportTableToExcel).not.toHaveBeenCalled()
    expect(cmsAlertModal.show).toHaveBeenCalledTimes(1)
  })

  it('MASTER는 exporter를 호출한다', async () => {
    useAuthStore.setState({ user: masterUser })
    const { exportTableToExcel } = await import('@/shared/utils/table-export')

    const { result } = renderHook(() =>
      useTableExcelExport({ columns, data, filename: '목록' })
    )

    await act(async () => {
      await result.current.exportExcel()
    })

    expect(exportTableToExcel).toHaveBeenCalledTimes(1)
    expect(cmsAlertModal.show).not.toHaveBeenCalled()
  })
})
