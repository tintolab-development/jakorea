/**
 * Footer 섹션 공통 — 정렬 테이블 (admin DnD 코어)
 */

import {
  AdminSortableDragHandle,
  AdminSortableDndShell,
  AdminSortableTableRow,
  useAdminTableDndReorder,
} from '@/shared/ui'
import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'

type RowWithId = { id: string }

export function FooterDragHandle() {
  return <AdminSortableDragHandle />
}

export function FooterSortableTable<T extends RowWithId>({
  rows,
  columns,
  loading,
  className,
  onRowsReorder,
}: {
  rows: T[]
  columns: ColumnsType<T>
  loading?: boolean
  className?: string
  onRowsReorder: (reorderedRows: T[]) => void
}) {
  const { items, rowIds, dndContextProps } = useAdminTableDndReorder({
    rows,
    onRowsReorder,
  })

  const tableClass = [
    'cms-data-table',
    'cms-data-table--skip-auto-no-col',
    'footer-sortable-table',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <AdminSortableDndShell rowIds={rowIds} dndContextProps={dndContextProps}>
      <Table<T>
        className={tableClass}
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
