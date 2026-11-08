/**
 * 글로벌 가치 — 정렬 테이블 (admin DnD 코어)
 */
import {
  AdminSortableDragHandle,
  AdminSortableDndShell,
  AdminSortableTableRow,
  useAdminTableDndReorder,
} from '@/shared/ui'
import { CmsDataTable } from '@/shared/ui/cms-data-table'
import { TABLE_ROW_FILL_FIELDS_CLASS } from '@/shared/ui/table-row-fill-fields'
import type { ColumnsType } from 'antd/es/table'
import type { GlobalValue } from '@/entities/global-value/model/types'

export function GlobalValueDragHandle() {
  return <AdminSortableDragHandle />
}

export function GlobalValuesSortableTable({
  rows,
  columns,
  loading,
  onRowsReorder,
}: {
  rows: GlobalValue[]
  columns: ColumnsType<GlobalValue>
  loading?: boolean
  onRowsReorder: (reorderedRows: GlobalValue[]) => void
}) {
  const { items, rowIds, dndContextProps } = useAdminTableDndReorder({
    rows,
    onRowsReorder,
  })

  return (
    <AdminSortableDndShell rowIds={rowIds} dndContextProps={dndContextProps}>
      <CmsDataTable<GlobalValue>
        className={`cms-data-table global-value-table ${TABLE_ROW_FILL_FIELDS_CLASS}`}
        rowKey="id"
        loading={loading}
        dataSource={items}
        columns={columns}
        pagination={false}
        tableLayout="fixed"
        components={{ body: { row: AdminSortableTableRow } }}
      />
    </AdminSortableDndShell>
  )
}
