/**
 * 지급조서 확인 등 — 클릭 가능한 정산 목록 테이블 (공통 Table props 캡슐화)
 */

import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { TableProps } from 'antd'
import type { TableRowSelection } from 'antd/es/table/interface'

const TABLE_CLASS = 'cms-data-table cms-data-table--fluid'

export type PaymentOrdersTableProps<T extends object> = {
  columns: ColumnsType<T>
  dataSource: NonNullable<TableProps<T>['dataSource']>
  onRowClick: (record: T) => void
  rowKey?: TableProps<T>['rowKey']
  rowSelection?: TableRowSelection<T>
  scroll?: TableProps<T>['scroll']
}

export function PaymentOrdersTable<T extends object>({
  columns,
  dataSource,
  onRowClick,
  rowKey,
  rowSelection,
  scroll,
}: PaymentOrdersTableProps<T>) {
  return (
    <Table<T>
      className={TABLE_CLASS}
      columns={columns}
      dataSource={dataSource}
      pagination={false}
      rowKey={rowKey}
      rowSelection={rowSelection}
      scroll={scroll}
      onRow={record => ({
        onClick: e => {
          if (rowSelection) {
            const t = e.target as HTMLElement
            if (t.closest('.ant-table-selection-column')) return
          }
          onRowClick(record)
        },
        style: { cursor: 'pointer' },
      })}
    />
  )
}
