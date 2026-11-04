/**
 * 히어로 배너 — 정렬 테이블 (admin DnD 코어)
 */
import {
  AdminSortableDragHandle,
  AdminSortableDndShell,
  AdminSortableTableRow,
  useAdminTableDndReorder,
} from '@/shared/ui'
import { CmsDataTable } from '@/shared/ui/cms-data-table'
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
  dragDisabled,
  onRowsReorder,
}: {
  rows: HeroBanner[]
  columns: ColumnsType<HeroBanner>
  loading?: boolean
  rowSelection?: TableProps<HeroBanner>['rowSelection']
  dragDisabled?: boolean
  onRowsReorder: (reorderedRows: HeroBanner[]) => void
}) {
  const disabled = Boolean(dragDisabled)
  const { items, rowIds, dndContextProps } = useAdminTableDndReorder({
    rows,
    onRowsReorder,
    disabled,
  })

  return (
    <AdminSortableDndShell
      rowIds={rowIds}
      dndContextProps={dndContextProps}
      dragDisabled={disabled}
    >
      <CmsDataTable<HeroBanner>
        className="cms-data-table cms-data-table--skip-auto-no-col hero-banner-table"
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
