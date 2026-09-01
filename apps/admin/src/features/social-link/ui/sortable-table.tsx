/**
 * 소셜 링크 — 정렬 테이블 (admin DnD 코어)
 */
import {
  AdminSortableDragHandle,
  AdminSortableDndShell,
  AdminSortableTableRow,
  useAdminTableDndReorder,
} from '@/shared/ui'
import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { SocialLink } from '@/entities/social-link/model/types'

export function SocialLinkDragHandle() {
  return <AdminSortableDragHandle />
}

export function SocialLinksSortableTable({
  rows,
  columns,
  loading,
  onRowsReorder,
}: {
  rows: SocialLink[]
  columns: ColumnsType<SocialLink>
  loading?: boolean
  onRowsReorder: (reorderedRows: SocialLink[]) => void
}) {
  const { items, rowIds, dndContextProps } = useAdminTableDndReorder({
    rows,
    onRowsReorder,
  })

  return (
    <AdminSortableDndShell rowIds={rowIds} dndContextProps={dndContextProps}>
      <Table<SocialLink>
        className="cms-data-table social-link-table"
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
