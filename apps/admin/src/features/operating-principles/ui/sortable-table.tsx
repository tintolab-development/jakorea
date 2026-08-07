/**
 * 운영 원칙 — 정렬 테이블 (admin DnD 코어)
 */
import {
  AdminSortableDragHandle,
  AdminSortableDndShell,
  AdminSortableTableRow,
  useAdminTableDndReorder,
} from '@/shared/ui'
import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { OperatingPrinciple } from '@/entities/operating-principles/model/types'

export function PrincipleDragHandle() {
  return <AdminSortableDragHandle />
}

export function PrinciplesSortableTable({
  rows,
  columns,
  loading,
  onRowsReorder,
}: {
  rows: OperatingPrinciple[]
  columns: ColumnsType<OperatingPrinciple>
  loading?: boolean
  onRowsReorder: (reorderedRows: OperatingPrinciple[]) => void
}) {
  const { items, rowIds, dndContextProps } = useAdminTableDndReorder({
    rows,
    onRowsReorder,
  })

  return (
    <AdminSortableDndShell rowIds={rowIds} dndContextProps={dndContextProps}>
      <Table<OperatingPrinciple>
        className="cms-data-table principles-sortable-table"
        rowKey="id"
        loading={loading}
        dataSource={items}
        columns={columns}
        pagination={false}
        components={{ body: { row: AdminSortableTableRow } }}
      />
    </AdminSortableDndShell>
  )
}
