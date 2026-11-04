/**
 * 메뉴별 조회 통계 — 요약 테이블 (상위 5메뉴 + 총합)
 */

import { CmsDataTable } from '@/shared/ui/cms-data-table'
import type { ColumnsType } from 'antd/es/table'
import type { MenuViewSummary } from '@/entities/menu-view-stats/model/types'
import { formatCount } from '@/features/menu-view-stats/lib/format-count'

type SummaryRow = MenuViewSummary & { key: string }

const COL_WIDTH = '16.6667%'

const columns: ColumnsType<SummaryRow> = [
  {
    title: 'JA Korea',
    dataIndex: 'jaKorea',
    key: 'jaKorea',
    width: COL_WIDTH,
    align: 'center',
    render: (v: number) => formatCount(v),
  },
  {
    title: '임팩트 스토리',
    dataIndex: 'impact',
    key: 'impact',
    width: COL_WIDTH,
    align: 'center',
    render: (v: number) => formatCount(v),
  },
  {
    title: '교육 소개',
    dataIndex: 'education',
    key: 'education',
    width: COL_WIDTH,
    align: 'center',
    render: (v: number) => formatCount(v),
  },
  {
    title: '참여하기',
    dataIndex: 'participate',
    key: 'participate',
    width: COL_WIDTH,
    align: 'center',
    render: (v: number) => formatCount(v),
  },
  {
    title: '후원하기',
    dataIndex: 'sponsor',
    key: 'sponsor',
    width: COL_WIDTH,
    align: 'center',
    render: (v: number) => formatCount(v),
  },
  {
    title: '총 조회수 합계',
    dataIndex: 'total',
    key: 'total',
    width: COL_WIDTH,
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
      <CmsDataTable<SummaryRow>
        className="cms-data-table cms-data-table--skip-auto-no-col menu-view-stats-summary__table"
        columns={columns}
        dataSource={dataSource}
        pagination={false}
        loading={loading}
        rowKey="key"
        size="middle"
        tableLayout="fixed"
      />
    </div>
  )
}
