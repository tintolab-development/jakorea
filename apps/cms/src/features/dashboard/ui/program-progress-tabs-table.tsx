/**
 * 전체 프로그램 진행 현황 (탭 + 테이블)
 * 탭: 모집 예정 / 수강 대기 신청 / 강의 대기 신청 / 교재 준비중 / 정산 대기
 * UI 참고: 라벨 + 카운트 배지, active 시 teal, inactive 시 gray
 */

import { useMemo } from 'react'
import { Card, Tabs, Table, Select, Space } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { FilterDropdownProps } from 'antd/es/table/interface'
import { FilterFilled } from '@ant-design/icons'
import { CmsButton } from '@/shared/ui'
import {
  mockProgramProgressByTab,
  PROGRAM_PROGRESS_TAB_LABELS,
  PROGRAM_PROGRESS_TAB_ORDER,
  PROGRAM_PROGRESS_TABLE_STATUS_FILTER_OPTIONS,
  type ProgramProgressTabRow,
} from '@/data/mock/program-progress-tabs'
import { WidgetTitleWithHandle } from './widget-title-with-handle'
import './program-progress-tabs-table.css'

function ProgramProgressStatusFilterDropdown({
  setSelectedKeys,
  selectedKeys,
  confirm,
  clearFilters,
}: FilterDropdownProps) {
  const value = selectedKeys.length ? String(selectedKeys[0]) : undefined

  return (
    <div
      className="program-progress-tabs-table__status-filter-dropdown"
      onClick={e => e.stopPropagation()}
    >
      <Select
        allowClear
        showSearch
        optionFilterProp="label"
        placeholder="진행 현황 선택"
        value={value}
        options={PROGRAM_PROGRESS_TABLE_STATUS_FILTER_OPTIONS}
        className="program-progress-tabs-table__status-filter-select"
        popupClassName="program-progress-tabs-table__status-filter-select-popup"
        onChange={next => {
          setSelectedKeys(next != null && next !== '' ? [next] : [])
        }}
      />
      <Space size="small" className="program-progress-tabs-table__status-filter-actions">
        <CmsButton variant="primary" size="small" onClick={() => confirm()}>
          적용
        </CmsButton>
        <CmsButton
          variant="default"
          size="small"
          onClick={() => {
            clearFilters?.()
            confirm()
          }}
        >
          초기화
        </CmsButton>
      </Space>
    </div>
  )
}

export function ProgramProgressTabsTable() {
  const columns = useMemo<ColumnsType<ProgramProgressTabRow>>(
    () => [
      {
        title: 'No.',
        dataIndex: 'no',
        key: 'no',
        width: 80,
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
        title: '프로그램 진행 현황',
        dataIndex: 'programProgressStatus',
        key: 'programProgressStatus',
        align: 'center',
        ellipsis: true,
        width: 180,
        minWidth: 180,
        filterDropdown: props => <ProgramProgressStatusFilterDropdown {...props} />,
        filterIcon: filtered => (
          <FilterFilled
            className="program-progress-tabs-table__filter-icon"
            style={{
              color: filtered ? 'var(--color-brand-primary, #1890ff)' : undefined,
            }}
          />
        ),
        onFilter: (value, record) => record.programProgressStatus === String(value),
      },
      {
        title: '참여자 모집 인원',
        dataIndex: 'participantRecruitment',
        key: 'participantRecruitment',
        align: 'center',
        width: 120,
      },
      {
        title: '참여자 유형',
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
    ],
    []
  )

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
          <span className="widget-card-title">전체 프로그램 진행 현황</span>
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
