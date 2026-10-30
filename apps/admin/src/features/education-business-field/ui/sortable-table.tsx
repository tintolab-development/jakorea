/**
 * 교육 사업 분야 — 정렬 테이블 (admin DnD 코어)
 */
import {
  AdminSortableDragHandle,
  AdminSortableDndShell,
  AdminSortableTableRow,
  useAdminTableDndReorder,
} from '@/shared/ui'
import { CmsDataTable } from '@/shared/ui/cms-data-table'
import type { ColumnsType } from 'antd/es/table'
import type { EducationBusinessField } from '@/entities/education-business-field/model/types'

export function EducationBusinessFieldDragHandle() {
  return <AdminSortableDragHandle />
}

export function EducationBusinessFieldsSortableTable({
  rows,
  columns,
  loading,
  onRowsReorder,
}: {
  rows: EducationBusinessField[]
  columns: ColumnsType<EducationBusinessField>
  loading?: boolean
  onRowsReorder: (reorderedRows: EducationBusinessField[]) => void
}) {
  const { items, rowIds, dndContextProps } = useAdminTableDndReorder({
    rows,
    onRowsReorder,
  })

  return (
    <AdminSortableDndShell rowIds={rowIds} dndContextProps={dndContextProps}>
      <CmsDataTable<EducationBusinessField>
        className="cms-data-table education-fields-table"
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
