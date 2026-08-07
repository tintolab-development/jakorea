/**
 * 수입·지출 — 정렬 테이블 (admin DnD 코어)
 */
import {
  AdminSortableDragHandle,
  AdminSortableDndShell,
  AdminSortableTableRow,
  useAdminTableDndReorder,
} from '@/shared/ui'
import { Table } from 'antd'
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
}: {
  rows: FinanceItem[]
  columns: ColumnsType<FinanceItem>
  loading?: boolean
  rowSelection?: TableProps<FinanceItem>['rowSelection']
  onRowsReorder: (reorderedRows: FinanceItem[]) => void
  /** 지출 테이블 탭 — 구분 열 포함 시안 열 비율 */
  withCategory?: boolean
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
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <AdminSortableDndShell rowIds={rowIds} dndContextProps={dndContextProps}>
      <Table<FinanceItem>
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
