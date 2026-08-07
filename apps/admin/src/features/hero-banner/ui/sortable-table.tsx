/**
 * 히어로 배너 — 정렬 테이블 (admin DnD 코어)
 */
import {
  AdminSortableDragHandle,
  AdminSortableDndShell,
  AdminSortableTableRow,
  useAdminTableDndReorder,
} from '@/shared/ui'
import { Table } from 'antd'
import type { ColumnsType, TableProps } from 'antd/es/table'
import type { HeroBanner } from '@/entities/hero-banner/model/types'

export function HeroBannerDragHandle() {
  return <AdminSortableDragHandle />
}

export function HeroBannersSortableTable({
  rows,
  columns,
  loading,
  rowSelection,
  onRowsReorder,
}: {
  rows: HeroBanner[]
  columns: ColumnsType<HeroBanner>
  loading?: boolean
  rowSelection?: TableProps<HeroBanner>['rowSelection']
  onRowsReorder: (reorderedRows: HeroBanner[]) => void
}) {
  const { items, rowIds, dndContextProps } = useAdminTableDndReorder({
    rows,
    onRowsReorder,
  })

  return (
    <AdminSortableDndShell rowIds={rowIds} dndContextProps={dndContextProps}>
      <Table<HeroBanner>
        className="cms-data-table hero-banner-table"
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
