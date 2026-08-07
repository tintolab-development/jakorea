/**
 * 이사회 구성원 — 정렬 테이블 (admin DnD 코어)
 */
import type React from 'react'
import {
  AdminSortableDragHandle,
  AdminSortableDndShell,
  AdminSortableTableRow,
  useAdminTableDndReorder,
} from '@/shared/ui'
import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { BoardMember } from '@/entities/board-members/model/types'

export function BoardMemberDragHandle() {
  return <AdminSortableDragHandle />
}

export function BoardMembersSortableTable({
  rows,
  columns,
  loading,
  rowSelection,
  selectionColumnWidth = 56,
  scrollX,
  onRowsReorder,
}: {
  rows: BoardMember[]
  columns: ColumnsType<BoardMember>
  loading?: boolean
  rowSelection?: {
    selectedRowKeys: React.Key[]
    onChange: (keys: React.Key[]) => void
  }
  selectionColumnWidth?: number
  scrollX?: number | true
  onRowsReorder: (reorderedRows: BoardMember[]) => void
}) {
  const { items, rowIds, dndContextProps } = useAdminTableDndReorder({
    rows,
    onRowsReorder,
  })

  return (
    <AdminSortableDndShell rowIds={rowIds} dndContextProps={dndContextProps}>
      <Table<BoardMember>
        className="cms-data-table cms-data-table--skip-auto-no-col board-members-table"
        rowKey="id"
        loading={loading}
        dataSource={items}
        columns={columns}
        pagination={false}
        tableLayout="fixed"
        rowSelection={
          rowSelection
            ? {
                selectedRowKeys: rowSelection.selectedRowKeys,
                onChange: rowSelection.onChange,
                columnWidth: selectionColumnWidth,
              }
            : undefined
        }
        components={{ body: { row: AdminSortableTableRow } }}
        scroll={{ x: scrollX ?? true }}
      />
    </AdminSortableDndShell>
  )
}
