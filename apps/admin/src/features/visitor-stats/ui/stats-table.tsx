/**
 * 방문자 통계 목록 테이블
 */

import { useMemo } from 'react'
import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type {
  VisitorStatsRow,
  VisitorStatsUnit,
} from '@/entities/visitor-stats/model/types'
import { formatVisitorCount } from '@/features/visitor-stats/lib/format'

import './section-shared.css'

const PERIOD_COL_TITLE: Record<VisitorStatsUnit, string> = {
  year: '연도',
  month: '년월',
  day: '날짜',
}

type Props = {
  unit: VisitorStatsUnit
  rows: VisitorStatsRow[]
  loading?: boolean
}

export function VisitorStatsTable({ unit, rows, loading }: Props) {
  const columns = useMemo<ColumnsType<VisitorStatsRow>>(
    () => [
      {
        title: PERIOD_COL_TITLE[unit],
        dataIndex: 'label',
        key: 'label',
        align: 'center',
        ellipsis: true,
      },
      {
        title: '방문자 수',
        dataIndex: 'visitors',
        key: 'visitors',
        align: 'center',
        render: (value: number) => formatVisitorCount(value),
      },
    ],
    [unit]
  )

  return (
    <div className="cms-data-table visitor-stats-table">
      <Table<VisitorStatsRow>
        rowKey="id"
        columns={columns}
        dataSource={rows}
        loading={loading}
        pagination={false}
        tableLayout="fixed"
        locale={{ emptyText: '검색 결과가 없습니다.' }}
      />
    </div>
  )
}
