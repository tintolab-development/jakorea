/**
 * 스트립 배너 — 정렬 테이블 (admin DnD 코어)
 */
import {
  AdminSortableDragHandle,
  AdminSortableDndShell,
  AdminSortableTableRow,
  useAdminTableDndReorder,
} from '@/shared/ui'
import { Table } from 'antd'
import type { ColumnsType, TableProps } from 'antd/es/table'
import type { StripBanner } from '@/entities/strip-banner/model/types'

export function StripBannerDragHandle() {
  return <AdminSortableDragHandle />
}

export function StripBannersSortableTable({
  rows,
  columns,
  loading,
  rowSelection,
  onRowsReorder,
}: {
  rows: StripBanner[]
  columns: ColumnsType<StripBanner>
  loading?: boolean
  rowSelection?: TableProps<StripBanner>['rowSelection']
  onRowsReorder: (reorderedRows: StripBanner[]) => void
}) {
  const { items, rowIds, dndContextProps } = useAdminTableDndReorder({
    rows,
    onRowsReorder,
  })

  return (
    <AdminSortableDndShell rowIds={rowIds} dndContextProps={dndContextProps}>
      <Table<StripBanner>
        className="cms-data-table strip-banner-table"
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
