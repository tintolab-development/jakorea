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

  it('resolveData가 있으면 화면에 로드된 데이터 대신 해석된 전체 데이터를 exporter에 전달한다', async () => {
    useAuthStore.setState({ user: masterUser })
    const { exportTableToExcel } = await import('@/shared/utils/table-export')
    const resolveData = vi.fn().mockResolvedValue([{ name: '전체 회원' }])

    const { result } = renderHook(() =>
      useTableExcelExport({
        columns,
        data: [],
        resolveData,
        filename: '목록',
      })
    )

    await act(async () => {
      await result.current.exportExcel()
    })

    expect(resolveData).toHaveBeenCalledTimes(1)
    expect(exportTableToExcel).toHaveBeenCalledWith(columns, [{ name: '전체 회원' }], '목록')
    expect(cmsAlertModal.show).not.toHaveBeenCalled()
  })
})

type KeyedRow = { id: string; name: string }

const keyedColumns: ColumnsType<KeyedRow> = [{ title: '이름', dataIndex: 'name', key: 'name' }]
const keyedData: KeyedRow[] = [
  { id: 'a', name: '홍길동' },
  { id: 'b', name: '김영희' },
  { id: 'c', name: '박민수' },
]

describe('useTableExcelExport selection', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    useAuthStore.setState({ user: masterUser })
    const { exportTableToExcel } = await import('@/shared/utils/table-export')
    vi.mocked(exportTableToExcel).mockClear()
  })

  it('selectedRowKeys가 빈 배열이면 다운로드하지 않고 선택 안내를 띄운다', async () => {
    const { exportTableToExcel } = await import('@/shared/utils/table-export')

    const { result } = renderHook(() =>
      useTableExcelExport({
        columns: keyedColumns,
        data: keyedData,
        selectedRowKeys: [],
        filename: '목록',
      })
    )

    await act(async () => {
      await result.current.exportExcel()
    })

    expect(exportTableToExcel).not.toHaveBeenCalled()
    expect(cmsAlertModal.show).toHaveBeenCalledWith({
      title: '항목 선택 안내',
      content: '선택된 항목이 없습니다.\n항목 선택 후 다시 시도해 주세요.',
    })
  })

  it('선택한 행만 exporter에 전달한다', async () => {
    const { exportTableToExcel } = await import('@/shared/utils/table-export')

    const { result } = renderHook(() =>
      useTableExcelExport({
        columns: keyedColumns,
        data: keyedData,
        selectedRowKeys: ['a', 'c'],
        filename: '목록',
      })
    )

    await act(async () => {
      await result.current.exportExcel()
    })

    expect(exportTableToExcel).toHaveBeenCalledWith(
      keyedColumns,
      [
        { id: 'a', name: '홍길동' },
        { id: 'c', name: '박민수' },
      ],
      '목록'
    )
    expect(cmsAlertModal.show).not.toHaveBeenCalled()
  })

  it('전체 선택 키면 필터된 data 전부를 내보낸다', async () => {
    const { exportTableToExcel } = await import('@/shared/utils/table-export')

    const { result } = renderHook(() =>
      useTableExcelExport({
        columns: keyedColumns,
        data: keyedData,
        selectedRowKeys: ['a', 'b', 'c'],
        filename: '목록',
      })
    )

    await act(async () => {
      await result.current.exportExcel()
    })

    expect(exportTableToExcel).toHaveBeenCalledWith(keyedColumns, keyedData, '목록')
  })

  it('필터된 data와 선택 키의 교집합만 내보낸다', async () => {
    const { exportTableToExcel } = await import('@/shared/utils/table-export')
    const filtered = keyedData.filter(row => row.id !== 'b')

    const { result } = renderHook(() =>
      useTableExcelExport({
        columns: keyedColumns,
        data: filtered,
        selectedRowKeys: ['a', 'b'],
        filename: '목록',
      })
    )

    await act(async () => {
      await result.current.exportExcel()
    })

    expect(exportTableToExcel).toHaveBeenCalledWith(
      keyedColumns,
      [{ id: 'a', name: '홍길동' }],
      '목록'
    )
  })

  it('selectedRowKeys를 생략하면 현재 data를 일괄 다운로드한다', async () => {
    const { exportTableToExcel } = await import('@/shared/utils/table-export')

    const { result } = renderHook(() =>
      useTableExcelExport({
        columns: keyedColumns,
        data: keyedData,
        filename: '목록',
      })
    )

    await act(async () => {
      await result.current.exportExcel()
    })

    expect(exportTableToExcel).toHaveBeenCalledWith(keyedColumns, keyedData, '목록')
    expect(cmsAlertModal.show).not.toHaveBeenCalled()
  })
})
