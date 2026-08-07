/**
 * 후원사 — 정렬 테이블 (admin DnD 코어)
 */
import {
  AdminSortableDragHandle,
  AdminSortableDndShell,
  AdminSortableTableRow,
  useAdminTableDndReorder,
} from '@/shared/ui'
import { Table } from 'antd'
import type { ColumnsType, TableProps } from 'antd/es/table'
import type { CorporatePartner } from '@/entities/corporate-partner/model/types'

export function CorporatePartnerDragHandle() {
  return <AdminSortableDragHandle />
}

export function CorporatePartnersSortableTable({
  rows,
  columns,
  loading,
  rowSelection,
  onRowsReorder,
  locale,
}: {
  rows: CorporatePartner[]
  columns: ColumnsType<CorporatePartner>
  loading?: boolean
  rowSelection?: TableProps<CorporatePartner>['rowSelection']
  onRowsReorder: (reorderedRows: CorporatePartner[]) => void
  locale?: TableProps<CorporatePartner>['locale']
}) {
  const { items, rowIds, dndContextProps } = useAdminTableDndReorder({
    rows,
    onRowsReorder,
  })

  return (
    <AdminSortableDndShell rowIds={rowIds} dndContextProps={dndContextProps}>
      <Table<CorporatePartner>
        className="cms-data-table corporate-partner-table"
        rowKey="id"
        loading={loading}
        dataSource={items}
        columns={columns}
        pagination={false}
        rowSelection={rowSelection}
        locale={locale}
        components={{ body: { row: AdminSortableTableRow } }}
      />
    </AdminSortableDndShell>
  )
}
