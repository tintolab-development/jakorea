/**
 * 수입·지출 — 정렬 테이블 (admin DnD 코어)
 */
import {
  AdminSortableDragHandle,
  AdminSortableDndShell,
  AdminSortableTableRow,
  useAdminTableDndReorder,
} from '@/shared/ui'
import { CmsDataTable } from '@/shared/ui/cms-data-table'
import type { ColumnsType, TableProps } from 'antd/es/table'
import type { FinanceItem } from '@/entities/income-expense/model/types'

export function FinanceItemDragHandle() {
  return <AdminSortableDragHandle />
}

export function FinanceItemsSortableTable({
  rows,
  columns,
  loading,
  rowSelection,
  onRowsReorder,
  withCategory = false,
  uniformLayout = false,
  isEditing = false,
}: {
  rows: FinanceItem[]
  columns: ColumnsType<FinanceItem>
  loading?: boolean
  rowSelection?: TableProps<FinanceItem>['rowSelection']
  onRowsReorder: (reorderedRows: FinanceItem[]) => void
  /** 지출 테이블 탭 — 구분 열 포함 시안 열 비율 */
  withCategory?: boolean
  /** 지출 그래프 · 수입/지출 테이블 탭 — 조회 중앙 / 수정 좌측 · 필수 */
  uniformLayout?: boolean
  isEditing?: boolean
}) {
  const { items, rowIds, dndContextProps } = useAdminTableDndReorder({
    rows,
    onRowsReorder,
  })

  const tableClassName = [
    'cms-data-table',
    'cms-data-table--skip-auto-no-col',
    'income-expense-table',
    withCategory && 'income-expense-table--expense',
    uniformLayout && 'income-expense-table--uniform',
    isEditing && 'income-expense-table--editing',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <AdminSortableDndShell rowIds={rowIds} dndContextProps={dndContextProps}>
      <CmsDataTable<FinanceItem>
        className={tableClassName}
        rowKey="id"
        loading={loading}
        dataSource={items}
        columns={columns}
        pagination={false}
        rowSelection={rowSelection}
        components={{ body: { row: AdminSortableTableRow } }}
      />
    </AdminSortableDndShell>
  )
}
