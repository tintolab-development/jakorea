/**
 * 지급조서 확인 등 — 클릭 가능한 정산 목록 테이블 (공통 Table props 캡슐화)
 */

import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { TableProps } from 'antd'

const TABLE_CLASS = 'cms-data-table cms-data-table--fluid'

export type PaymentOrdersTableProps<T extends object> = {
  columns: ColumnsType<T>
  dataSource: NonNullable<TableProps<T>['dataSource']>
  onRowClick: (record: T) => void
  rowKey?: TableProps<T>['rowKey']
  scroll?: TableProps<T>['scroll']
}

/** 행 선택(체크박스) 열 없음 — 클릭으로 상세만 연다. */
export function PaymentOrdersTable<T extends object>({
  columns,
  dataSource,
  onRowClick,
  rowKey,
  scroll,
}: PaymentOrdersTableProps<T>) {
  return (
    <Table<T>
      className={TABLE_CLASS}
      columns={columns}
      dataSource={dataSource}
      pagination={false}
      rowKey={rowKey}
      scroll={scroll}
      onRow={record => ({
        onClick: () => onRowClick(record),
        style: { cursor: 'pointer' },
      })}
    />
  )
}
