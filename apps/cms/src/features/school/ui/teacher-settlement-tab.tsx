/**
 * 교사 회원 상세 모달 — 정산 현황 탭
 */

import { useState, useMemo, useCallback } from 'react'
import { Table, Input, Empty } from 'antd'
import { LeftOutlined, RightOutlined, SearchOutlined, CalendarOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { AppButton } from '@/shared/ui/app-button'
import {
  type SettlementOverviewData,
  type SettlementRow,
  type SettlementRowStatus,
  SETTLEMENT_ROW_STATUS_LABELS,
} from '@/data/mock/school-detail'
import dayjs from 'dayjs'

export interface TeacherSettlementTabProps {
  data: SettlementOverviewData
}

const STATUS_CLASS: Record<SettlementRowStatus, string> = {
  pending: 'settlement-tab__badge--pending',
  reviewing: 'settlement-tab__badge--reviewing',
  completed: 'settlement-tab__badge--completed',
}

export function TeacherSettlementTab({ data }: TeacherSettlementTabProps) {
  const [currentMonth, setCurrentMonth] = useState(() => dayjs(data.month))
  const [searchText, setSearchText] = useState('')
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])

  const filteredRows = useMemo(() => {
    if (!searchText.trim()) return data.rows
    const keyword = searchText.trim().toLowerCase()
    return data.rows.filter(r => r.programName.toLowerCase().includes(keyword))
  }, [data.rows, searchText])

  const handlePrevMonth = useCallback(() => {
    setCurrentMonth(prev => prev.subtract(1, 'month'))
  }, [])

  const handleNextMonth = useCallback(() => {
    setCurrentMonth(prev => prev.add(1, 'month'))
  }, [])

  const monthLabel = currentMonth.format('YYYY. MM')

  const columns: ColumnsType<SettlementRow> = [
    {
      title: 'No.',
      dataIndex: 'no',
      key: 'no',
      width: 70,
      align: 'center' as const,
    },
    {
      title: '프로그램명',
      dataIndex: 'programName',
      key: 'programName',
      ellipsis: true,
      align: 'center' as const,
    },
    {
      title: '강의 진행일',
      dataIndex: 'lectureDate',
      key: 'lectureDate',
      width: 200,
      align: 'center' as const,
    },
    {
      title: '강의 진행 시간',
      dataIndex: 'lectureDuration',
      key: 'lectureDuration',
      width: 130,
      align: 'center' as const,
    },
    {
      title: '정산 상태',
      dataIndex: 'status',
      key: 'status',
      width: 140,
      align: 'center' as const,
      render: (status: SettlementRowStatus) => (
        <span className={`settlement-tab__badge ${STATUS_CLASS[status]}`}>
          {SETTLEMENT_ROW_STATUS_LABELS[status]}
        </span>
      ),
    },
    {
      title: '정산 금액',
      dataIndex: 'amount',
      key: 'amount',
      width: 130,
      align: 'right' as const,
      render: (amount: number) => `${amount.toLocaleString()}원`,
    },
  ]

  const rowSelection = {
    selectedRowKeys,
    onChange: (keys: React.Key[]) => setSelectedRowKeys(keys),
  }

  return (
    <div className="settlement-tab">
      {/* 상단 컨트롤: 월 네비게이터 + 검색 + 버튼들 */}
      <div className="settlement-tab__controls">
        <div className="settlement-tab__month-nav">
          <span className="settlement-tab__month-label">{monthLabel}</span>
          <button
            className="settlement-tab__month-arrow"
            onClick={handlePrevMonth}
            type="button"
            title="이전 월"
          >
            <LeftOutlined />
          </button>
          <button
            className="settlement-tab__month-arrow"
            onClick={handleNextMonth}
            type="button"
            title="다음 월"
          >
            <RightOutlined />
          </button>
        </div>

        <div className="settlement-tab__controls-right">
          <Input
            className="settlement-tab__search"
            placeholder="프로그램명으로 검색"
            prefix={<SearchOutlined style={{ color: '#bbb' }} />}
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            allowClear
          />
          <AppButton variant="cancel" size="middle" className="settlement-tab__btn-calendar">
            <CalendarOutlined style={{ marginRight: 4 }} />
            캘린더 뷰로 보기
          </AppButton>
          <AppButton variant="primary" size="middle">
            지급조서 발급
          </AppButton>
          <AppButton variant="primary" size="middle" className="settlement-tab__btn-settle">
            강의료 정산
          </AppButton>
        </div>
      </div>

      {/* 요약 카드 */}
      <div className="settlement-tab__summary">
        <div className="settlement-tab__summary-card">
          <span className="settlement-tab__summary-label settlement-tab__summary-label--expected">
            정산 예정금
          </span>
          <span className="settlement-tab__summary-value settlement-tab__summary-value--expected">
            {data.expectedAmount.toLocaleString()}
            <span className="settlement-tab__summary-unit">원</span>
          </span>
        </div>

        <div className="settlement-tab__summary-divider" />

        <div className="settlement-tab__summary-card">
          <span className="settlement-tab__summary-label">정산 완료금</span>
          <span className="settlement-tab__summary-value">
            {data.completedAmount.toLocaleString()}
            <span className="settlement-tab__summary-unit">건</span>
          </span>
        </div>

        <div className="settlement-tab__summary-divider" />

        <div className="settlement-tab__summary-card">
          <span className="settlement-tab__summary-label">
            {currentMonth.format('M')}월 총 정산금
          </span>
          <span className="settlement-tab__summary-value">
            {data.totalAmount.toLocaleString()}
            <span className="settlement-tab__summary-unit">건</span>
          </span>
        </div>
      </div>

      {/* 테이블 */}
      {filteredRows.length > 0 ? (
        <Table<SettlementRow>
          columns={columns}
          dataSource={filteredRows}
          rowKey="id"
          pagination={false}
          size="middle"
          className="settlement-tab__table"
          rowSelection={{
            type: 'checkbox' as const,
            ...rowSelection,
            columnWidth: 48,
            renderCell: (_value, _record, _index, originNode) => (
              <div className="settlement-tab__checkbox-cell">{originNode}</div>
            ),
          }}
        />
      ) : (
        <Empty description="정산 내역이 없습니다." />
      )}
    </div>
  )
}
