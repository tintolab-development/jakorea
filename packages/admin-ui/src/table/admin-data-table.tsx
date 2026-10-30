import { Table } from 'antd'
import type { TableProps } from 'antd/es/table'
import type { ReactNode } from 'react'
import { mergeAdminDataTableClassName } from './table-class.js'
import './admin-data-table.css'

export type AdminDataTableProps<RecordType extends object = object> = TableProps<RecordType> & {
  emptyText?: ReactNode
}

export { mergeAdminDataTableClassName } from './table-class.js'

export function AdminDataTable<RecordType extends object = object>({
  className,
  locale,
  emptyText,
  ...rest
}: AdminDataTableProps<RecordType>) {
  const mergedLocale =
    emptyText !== undefined
      ? { ...locale, emptyText }
      : locale

  return (
    <Table<RecordType>
      {...rest}
      className={mergeAdminDataTableClassName(className)}
      locale={mergedLocale}
    />
  )
}

AdminDataTable.Summary = Table.Summary
