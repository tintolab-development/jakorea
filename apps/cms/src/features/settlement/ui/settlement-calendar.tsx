/**
 * 정산 캘린더 컴포넌트
 * Phase 5.2.4: 본인 정산 정보 - 월별 정산 캘린더 뷰
 */

import { useMemo } from 'react'
import { Calendar, Popover, Tag, Space } from 'antd'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import type { CalendarMode } from 'antd/es/calendar/generateCalendar'
import type { Settlement } from '@/types/domain'
import { programService } from '@/entities/program/api/program-service'
import { settlementStatusStatusConfig, getSettlementStatusLabel, getSettlementStatusColor } from '@/shared/constants/status'
import { StatusBadge } from '@/shared/ui/status-badge'
import { domainColorsHex } from '@/shared/constants/colors'
import './settlement-calendar.css'

interface SettlementCalendarProps {
  settlements: Settlement[]
  onDateSelect: (date: Dayjs, settlement?: Settlement) => void
  onPanelChange?: (date: Dayjs, mode: CalendarMode) => void
  selectedPeriod?: string // YYYY-MM 형식
}

export function SettlementCalendar({
  settlements,
  onDateSelect,
  onPanelChange,
  selectedPeriod,
}: SettlementCalendarProps) {
  // 선택된 월의 첫 날짜
  const currentDate = useMemo(() => {
    if (selectedPeriod) {
      const [year, month] = selectedPeriod.split('-').map(Number)
      return dayjs().year(year).month(month - 1).date(1)
    }
    return dayjs().date(1)
  }, [selectedPeriod])

  // 날짜별 정산 목록 가져오기
  const getListData = (value: Dayjs) => {
    const dateStr = value.format('YYYY-MM-DD')
    return settlements.filter(s => {
      // createdAt을 기준으로 날짜 매칭
      const settlementDate = dayjs(s.createdAt).format('YYYY-MM-DD')
      return settlementDate === dateStr
    })
  }

  // 날짜 셀 렌더링
  const dateCellRender = (value: Dayjs) => {
    const listData = getListData(value)

    if (listData.length === 0) {
      return null
    }

    return (
      <div
        className="settlement-cell"
        onClick={e => {
          // settlement-item이 아닌 빈 영역 클릭 시 첫 번째 정산의 상세 열기
          const target = e.target as HTMLElement
          if (!target.closest('.settlement-item') && listData.length > 0) {
            onDateSelect(value, listData[0])
          }
        }}
      >
        <div className="settlement-list">
          {listData.map(settlement => {
            const program = programService.getByIdSync(settlement.programId)

            const popoverContent = (
              <div className="settlement-popover">
                <div className="settlement-popover-title">
                  <strong>정산 정보</strong>
                </div>
                <div className="settlement-popover-item">
                  <span className="settlement-popover-label">정산 ID:</span>
                  <span>{settlement.id.slice(-8)}</span>
                </div>
                <div className="settlement-popover-item">
                  <span className="settlement-popover-label">프로그램:</span>
                  <span>{program ? program.title : `프로그램 정보 오류 (ID: ${settlement.programId.slice(-8)})`}</span>
                </div>
                <div className="settlement-popover-item">
                  <span className="settlement-popover-label">상태:</span>
                  <StatusBadge status={settlement.status} statusConfig={settlementStatusStatusConfig} />
                </div>
                <div className="settlement-popover-item">
                  <span className="settlement-popover-label">금액:</span>
                  <span>{settlement.totalAmount.toLocaleString()}원</span>
                </div>
              </div>
            )

            return (
              <Popover
                key={settlement.id}
                content={popoverContent}
                trigger="hover"
                placement="right"
                overlayClassName="settlement-popover-overlay"
              >
                <div
                  className="settlement-item"
                  onClick={e => {
                    e.stopPropagation()
                    e.preventDefault()
                    onDateSelect(value, settlement)
                  }}
                  onDoubleClick={e => {
                    e.stopPropagation()
                    e.preventDefault()
                    onDateSelect(value, settlement)
                  }}
                >
                  <div
                    className="settlement-dot"
                    style={{
                      backgroundColor: getSettlementStatusColor(settlement.status),
                    }}
                    title={program ? program.title : '정산 (프로그램 정보 오류)'}
                  />
                  <div className="settlement-item-amount">
                    {settlement.totalAmount.toLocaleString()}원
                  </div>
                  <div className="settlement-item-status">
                    {getSettlementStatusLabel(settlement.status)}
                  </div>
                </div>
              </Popover>
            )
          })}
        </div>
      </div>
    )
  }

  // 월 셀 렌더링 (연간 뷰용)
  const monthCellRender = (value: Dayjs) => {
    const monthStart = value.startOf('month')
    const monthEnd = value.endOf('month')
    const monthSettlements = settlements.filter(s => {
      const settlementDate = dayjs(s.createdAt)
      return settlementDate >= monthStart && settlementDate <= monthEnd
    })

    return monthSettlements.length > 0 ? (
      <div className="settlement-month-summary">
        <Tag color={domainColorsHex.settlement.primary}>{monthSettlements.length}개</Tag>
      </div>
    ) : null
  }

  return (
    <div>
      <Calendar
        mode="month"
        value={currentDate}
        cellRender={(value, info) => {
          if (info.type === 'month') {
            return monthCellRender(value)
          }
          return dateCellRender(value)
        }}
        onSelect={date => {
          const listData = getListData(date)
          onDateSelect(date, listData[0])
        }}
        onPanelChange={(date, newMode) => {
          onPanelChange?.(date, newMode)
        }}
        headerRender={({ value }) => {
          const year = value.year()
          const month = value.month() + 1
          const monthNames = [
            '1월',
            '2월',
            '3월',
            '4월',
            '5월',
            '6월',
            '7월',
            '8월',
            '9월',
            '10월',
            '11월',
            '12월',
          ]

          return (
            <div className="settlement-calendar-header">
              <Space size="middle">
                <span style={{ fontSize: 16, fontWeight: 500 }}>
                  {year}년 {monthNames[month - 1]}
                </span>
              </Space>
            </div>
          )
        }}
      />
    </div>
  )
}

