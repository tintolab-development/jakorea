/**
 * 지급조서 확인 등 — 클릭 가능한 정산 목록 테이블 (공통 Table props 캡슐화)
 */

import type { ColumnsType } from 'antd/es/table'
import type { TableProps } from 'antd'
import { CmsDataTable } from '@/shared/ui/cms-data-table'

const TABLE_CLASS = 'cms-data-table'

export type PaymentOrdersTableProps<T extends object> = {
  columns: ColumnsType<T>
  dataSource: NonNullable<TableProps<T>['dataSource']>
  onRowClick: (record: T) => void
  rowKey?: TableProps<T>['rowKey']
}

/**
 * 행 선택(체크박스) 열 없음 — 클릭으로 상세만 연다.
 * 표 최소 폭·가로 스크롤은 CmsDataTable 공통 계산(열 width 합 · 유연 열)을 따른다.
 */
export function PaymentOrdersTable<T extends object>({
  columns,
  dataSource,
  onRowClick,
  rowKey,
}: PaymentOrdersTableProps<T>) {
  return (
    <CmsDataTable<T>
      className={TABLE_CLASS}
      columns={columns}
      dataSource={dataSource}
      pagination={false}
      rowKey={rowKey}
      onRow={record => ({
        onClick: () => onRowClick(record),
        style: { cursor: 'pointer' },
      })}
    />
  )
}
