/**
 * 전체 프로그램 진행 현황 (탭 + 테이블)
 * 탭: 모집 예정 / 수강 대기 신청 / 강의 대기 신청 / 교재 준비중 / 정산 대기
 * UI 참고: 라벨 + 카운트 배지, active 시 teal, inactive 시 gray
 */

import { Card, Tabs, Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import {
  mockProgramProgressByTab,
  PROGRAM_PROGRESS_TAB_LABELS,
  PROGRAM_PROGRESS_TAB_ORDER,
  type ProgramProgressTabRow,
} from '@/data/mock/program-progress-tabs'
import { WidgetTitleWithHandle } from './widget-title-with-handle'
import './program-progress-tabs-table.css'

export function ProgramProgressTabsTable() {
  const tabItems = PROGRAM_PROGRESS_TAB_ORDER.map(key => {
    const data = mockProgramProgressByTab[key]
    const label = PROGRAM_PROGRESS_TAB_LABELS[key]
    return {
      key,
      label: (
        <span className="program-progress-tabs-table__tab-inner">
          <span className="program-progress-tabs-table__tab-text">{label}</span>
          <span className="program-progress-tabs-table__tab-badge">{data.length}건</span>
        </span>
      ),
      children: (
        <Table
          dataSource={data}
          rowKey="id"
          columns={columns}
          pagination={false}
          size="middle"
          className="program-progress-tabs-table__table cms-data-table cms-data-table--widget"
        />
      ),
    }
  })

  return (
    <Card
      className="program-progress-tabs-table"
      title={
        <WidgetTitleWithHandle>
          <span>전체 프로그램 진행 현황</span>
        </WidgetTitleWithHandle>
      }
    >
      <Tabs
        defaultActiveKey="planned"
        items={tabItems}
        className="program-progress-tabs-table__tabs"
      />
    </Card>
  )
}

const columns: ColumnsType<ProgramProgressTabRow> = [
  {
    title: 'No.',
    dataIndex: 'no',
    key: 'no',
    width: 56,
    align: 'center',
  },
  {
    title: '프로그램명',
    dataIndex: 'programName',
    key: 'programName',
    align: 'center',
    ellipsis: true,
    width: 220,
  },
  {
    title: '후원사',
    dataIndex: 'sponsor',
    key: 'sponsor',
    align: 'center',
    ellipsis: true,
    width: 140,
  },
  {
    title: '수강자 유형',
    dataIndex: 'participantType',
    key: 'participantType',
    align: 'center',
    width: 100,
  },
  {
    title: '교육 대상',
    dataIndex: 'educationTarget',
    key: 'educationTarget',
    align: 'center',
    width: 90,
  },
  {
    title: '모집 기간',
    dataIndex: 'applicationPeriod',
    key: 'applicationPeriod',
    align: 'center',
    width: 140,
  },
  {
    title: '운영 기간',
    dataIndex: 'operatingPeriod',
    key: 'operatingPeriod',
    align: 'center',
    width: 140,
  },
]
