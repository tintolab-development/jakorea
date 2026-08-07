/**
 * 메뉴별 조회 통계 — 요약 테이블 (상위 5메뉴 + 총합)
 */

import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { MenuViewSummary } from '@/entities/menu-view-stats/model/types'
import { formatCount } from '@/features/menu-view-stats/lib/format-count'

type SummaryRow = MenuViewSummary & { key: string }

const columns: ColumnsType<SummaryRow> = [
  {
    title: 'JA Korea',
    dataIndex: 'jaKorea',
    key: 'jaKorea',
    align: 'center',
    render: (v: number) => formatCount(v),
  },
  {
    title: '임팩트 스토리',
    dataIndex: 'impact',
    key: 'impact',
    align: 'center',
    render: (v: number) => formatCount(v),
  },
  {
    title: '교육 소개',
    dataIndex: 'education',
    key: 'education',
    align: 'center',
    render: (v: number) => formatCount(v),
  },
  {
    title: '참여하기',
    dataIndex: 'participate',
    key: 'participate',
    align: 'center',
    render: (v: number) => formatCount(v),
  },
  {
    title: '후원하기',
    dataIndex: 'sponsor',
    key: 'sponsor',
    align: 'center',
    render: (v: number) => formatCount(v),
  },
  {
    title: '총 조회수 합계',
    dataIndex: 'total',
    key: 'total',
    align: 'center',
    render: (v: number) => formatCount(v),
  },
]

type Props = {
  summary: MenuViewSummary
  loading?: boolean
}

export function MenuViewSummaryTable({ summary, loading }: Props) {
  const dataSource: SummaryRow[] = [{ key: 'summary', ...summary }]

  return (
    <div className="cms-data-table menu-view-stats-summary">
      <Table<SummaryRow>
        className="menu-view-stats-summary__table"
        columns={columns}
        dataSource={dataSource}
        pagination={false}
        loading={loading}
        rowKey="key"
        size="middle"
      />
    </div>
  )
}
