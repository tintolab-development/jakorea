/**
 * GNB 하위 메뉴 — 정렬 테이블 (admin DnD 코어)
 */
import { useMemo, type HTMLAttributes } from 'react'
import {
  AdminSortableDragHandle,
  AdminSortableDndShell,
  AdminSortableTableRow,
  useAdminTableDndReorder,
} from '@/shared/ui'
import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { GnbSubMenu } from '@/entities/gnb-menu/model/types'

type SortableRowProps = HTMLAttributes<HTMLTableRowElement> & {
  'data-row-key'?: string | number
}

export function GnbMenuDragHandle() {
  return <AdminSortableDragHandle />
}

export function GnbMenuSortableTable({
  rows,
  columns,
  dragDisabled,
  onRowsReorder,
}: {
  rows: GnbSubMenu[]
  columns: ColumnsType<GnbSubMenu>
  dragDisabled?: boolean
  onRowsReorder: (reorderedRows: GnbSubMenu[]) => void
}) {
  const disabled = Boolean(dragDisabled)
  const { items, rowIds, dndContextProps } = useAdminTableDndReorder({
    rows,
    onRowsReorder,
    disabled,
  })

  const SortableRow = useMemo(() => {
    function GnbMenuSortableRow(props: SortableRowProps) {
      return <AdminSortableTableRow {...props} dragDisabled={disabled} />
    }
    return GnbMenuSortableRow
  }, [disabled])

  return (
    <AdminSortableDndShell rowIds={rowIds} dndContextProps={dndContextProps}>
      <Table<GnbSubMenu>
        className="cms-data-table gnb-menu-table"
        rowKey="id"
        dataSource={items}
        columns={columns}
        pagination={false}
        components={{ body: { row: SortableRow } }}
      />
    </AdminSortableDndShell>
  )
}
