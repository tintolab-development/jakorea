import { AdminDataTable, type AdminDataTableProps } from '@jakorea/admin-ui/table'

export type CmsDataTableProps<RecordType extends object = object> = AdminDataTableProps<RecordType>

export function CmsDataTable<RecordType extends object = object>(
  props: CmsDataTableProps<RecordType>
) {
  return <AdminDataTable<RecordType> {...props} />
}

CmsDataTable.Summary = AdminDataTable.Summary
