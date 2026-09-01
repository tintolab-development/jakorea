/**
 * 팝업 — 정렬 테이블 (admin DnD 코어)
 */
import {
  AdminSortableDragHandle,
  AdminSortableDndShell,
  AdminSortableTableRow,
  useAdminTableDndReorder,
} from '@/shared/ui'
import { Table } from 'antd'
import type { ColumnsType, TableProps } from 'antd/es/table'
import type { Popup } from '@/entities/popup/model/types'

export function PopupDragHandle() {
  return <AdminSortableDragHandle />
}

export function PopupsSortableTable({
  rows,
  columns,
  loading,
  rowSelection,
  onRowsReorder,
}: {
  rows: Popup[]
  columns: ColumnsType<Popup>
  loading?: boolean
  rowSelection?: TableProps<Popup>['rowSelection']
  onRowsReorder: (reorderedRows: Popup[]) => void
}) {
  const { items, rowIds, dndContextProps } = useAdminTableDndReorder({
    rows,
    onRowsReorder,
  })

  return (
    <AdminSortableDndShell rowIds={rowIds} dndContextProps={dndContextProps}>
      <Table<Popup>
        className="cms-data-table popup-table"
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
