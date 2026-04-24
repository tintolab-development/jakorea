/**
 * 교사 회원 상세 모달 — 정산 현황 탭
 */

import { useState, useMemo, useCallback } from 'react'
import { Table, Input, Empty, Checkbox, Calendar } from 'antd'
import {
  LeftOutlined,
  RightOutlined,
  SearchOutlined,
  CalendarOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
const CAL_WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
import { AppButton } from '@/shared/ui/app-button'
import { SettlementStatusBadge } from '@/shared/components/settlement-status-badge'
import type { SettlementStatusKey } from '@/shared/components/settlement-status-badge'
import {
  StatusDropdownCell,
  STATUS_DROPDOWN_CELL_CLASSNAME,
} from '@/shared/components/status-dropdown-cell'
import {
  type SettlementOverviewData,
  type SettlementRow,
  type SettlementRowStatus,
  SETTLEMENT_ROW_STATUS_LABELS,
} from '@/data/mock/school-detail'
import { SettlementDetailModal, type BankInfo } from './settlement-detail-modal'
import { TABLE_COLUMN_WIDTHS } from '@/shared/constants/table'

export interface TeacherSettlementTabProps {
  data: SettlementOverviewData
  teacherName?: string
  bankInfo?: BankInfo
}

type ViewMode = 'list' | 'calendar'

const SETTLEMENT_ROW_STATUS_KEYS: SettlementRowStatus[] = ['pending', 'reviewing', 'completed', 'rejected']

const STATUS_TAG_STYLE: Record<SettlementRowStatus, { bg: string; color: string }> = {
  pending: { bg: '#e8f5e9', color: '#1e8c29' },
  reviewing: { bg: '#fff3e0', color: '#e67e22' },
  completed: { bg: '#e0f2f1', color: '#01A1AF' },
  rejected: { bg: '#fdecea', color: '#d32f2f' },
}

export function TeacherSettlementTab({ data, teacherName, bankInfo }: TeacherSettlementTabProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [currentMonth, setCurrentMonth] = useState(() => dayjs(data.month))
  const [searchText, setSearchText] = useState('')
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [overrides, setOverrides] = useState<Record<string, { status?: SettlementRowStatus }>>({})
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(null)
  const [calendarSelectedKeys, setCalendarSelectedKeys] = useState<React.Key[]>([])
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [detailModalRowId, setDetailModalRowId] = useState<string | null>(null)
  const [openStatusDropdownId, setOpenStatusDropdownId] = useState<string | null>(null)

  const handleOpenDetail = useCallback((row: SettlementRow) => {
    setDetailModalRowId(row.id)
    setDetailModalOpen(true)
  }, [])

  const handleReject = useCallback((_reason: string) => {
    if (!detailModalRowId) return
    setOverrides(prev => ({
      ...prev,
      [detailModalRowId]: { status: 'rejected' as SettlementRowStatus },
    }))
  }, [detailModalRowId])

  const handlePaymentComplete = useCallback(() => {
    if (!detailModalRowId) return
    setOverrides(prev => ({
      ...prev,
      [detailModalRowId]: { status: 'completed' as SettlementRowStatus },
    }))
  }, [detailModalRowId])

  const rows = useMemo(() => {
    if (Object.keys(overrides).length === 0) return data.rows
    return data.rows.map(row => {
      const override = overrides[row.id]
      if (!override) return row
      return {
        ...row,
        ...override,
        detail: {
          ...row.detail,
          ...(override.status ? { status: override.status } : {}),
        },
      }
    })
  }, [data.rows, overrides])

  const detailModalData = useMemo(() => {
    if (!detailModalRowId) return null
    const row = rows.find(r => r.id === detailModalRowId)
    return row?.detail ?? null
  }, [rows, detailModalRowId])

  const filteredRows = useMemo(() => {
    if (!searchText.trim()) return rows
    const keyword = searchText.trim().toLowerCase()
    return rows.filter(r => r.programName.toLowerCase().includes(keyword))
  }, [rows, searchText])

  const handleStatusChange = useCallback((rowId: string, status: SettlementRowStatus) => {
    setOverrides(prev => ({
      ...prev,
      [rowId]: { ...prev[rowId], status },
    }))
  }, [])

  const handlePrevMonth = useCallback(() => {
    setCurrentMonth(prev => prev.subtract(1, 'month'))
  }, [])

  const handleNextMonth = useCallback(() => {
    setCurrentMonth(prev => prev.add(1, 'month'))
  }, [])

  const monthLabel = currentMonth.format('YYYY. MM')

  // --- Calendar: date → settlements map ---
  const dateSettlementMap = useMemo(() => {
    const map = new Map<string, SettlementRow[]>()
    for (const row of rows) {
      const match = row.lectureDate.match(/(\d+)\.\s*(\d+)\.\s*(\d+)/)
      if (!match) continue
      const key = `${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(row)
    }
    return map
  }, [rows])

  const getSettlementsForDate = useCallback(
    (date: Dayjs) => dateSettlementMap.get(date.format('YYYY-MM-DD')) ?? [],
    [dateSettlementMap],
  )

  const selectedDateRows = useMemo(() => {
    if (!selectedDate) return []
    return getSettlementsForDate(selectedDate)
  }, [selectedDate, getSettlementsForDate])

  // --- Calendar: fullCellRender ---
  const dateFullCellRender = useCallback(
    (date: Dayjs) => {
      const isCurrent = date.isSame(currentMonth, 'month')
      const isToday = date.isSame(dayjs(), 'day')
      const isSelected = selectedDate?.isSame(date, 'day') ?? false
      const settlements = isCurrent ? getSettlementsForDate(date) : []

      return (
        <div
          className={[
            'settlement-cal__cell',
            !isCurrent && 'settlement-cal__cell--outside',
            isSelected && 'settlement-cal__cell--selected',
            isToday && 'settlement-cal__cell--today',
          ].filter(Boolean).join(' ')}
          onClick={() => {
            if (isCurrent) {
              setSelectedDate(isSelected ? null : date)
              setCalendarSelectedKeys([])
            }
          }}
        >
          <div className="settlement-cal__day-num">
            {date.date()}
            {isToday && <span className="settlement-cal__today-badge">오늘</span>}
          </div>
          {settlements.length > 0 && (
            <div className="settlement-cal__amounts">
              {settlements.map(s => {
                const tagStyle = STATUS_TAG_STYLE[s.status]
                return (
                  <span
                    key={s.id}
                    className="settlement-cal__amount-tag"
                    style={{ background: tagStyle.bg, color: tagStyle.color }}
                    onClick={(e) => {
                      e.stopPropagation()
                      handleOpenDetail(s)
                    }}
                  >
                    + {s.amount.toLocaleString()}원
                  </span>
                )
              })}
            </div>
          )}
        </div>
      )
    },
    [currentMonth, selectedDate, getSettlementsForDate, handleOpenDetail],
  )

  // --- List view columns ---
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
      width: 350,
    },
    {
      title: '강의 진행일',
      dataIndex: 'lectureDate',
      key: 'lectureDate',
      width: 190,
      align: 'center' as const,
    },
    {
      title: '강의 진행 시간',
      dataIndex: 'lectureDuration',
      key: 'lectureDuration',
      width: 120,
      align: 'center' as const,
    },
    {
      title: '정산 상태',
      dataIndex: 'status',
      key: 'status',
      width: 150,
      align: 'center' as const,
      onCell: () => ({ className: STATUS_DROPDOWN_CELL_CLASSNAME }),
      render: (_: unknown, record: SettlementRow) => (
        <div onClick={e => e.stopPropagation()} style={{ display: 'inline-block' }}>
          <StatusDropdownCell<SettlementRowStatus>
            status={record.status}
            statusOptions={SETTLEMENT_ROW_STATUS_KEYS}
            renderBadge={s => <SettlementStatusBadge status={s as SettlementStatusKey} />}
            isItemDisabled={(cur, opt) => cur === opt}
            onChange={s => handleStatusChange(record.id, s)}
            isOpen={openStatusDropdownId === record.id}
            onOpenChange={open => setOpenStatusDropdownId(open ? record.id : null)}
          />
        </div>
      ),
    },
    {
      title: '정산 금액',
      dataIndex: 'amount',
      key: 'amount',
      width: 140,
      align: 'center' as const,
      render: (amount: number) => `${amount.toLocaleString()}원`,
    },
  ]

  const rowSelection = {
    selectedRowKeys,
    onChange: (keys: React.Key[]) => setSelectedRowKeys(keys),
  }

  return (
    <div className="settlement-tab">
      {/* 상단 컨트롤 */}
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
          {viewMode === 'list' ? (
            <AppButton
              variant="cancel"
              size="middle"
              className="settlement-tab__btn-view-toggle"
              onClick={() => setViewMode('calendar')}
            >
              <CalendarOutlined style={{ marginRight: 4 }} />
              캘린더 뷰로 보기
            </AppButton>
          ) : (
            <AppButton
              variant="cancel"
              size="middle"
              className="settlement-tab__btn-view-toggle"
              onClick={() => setViewMode('list')}
            >
              <UnorderedListOutlined style={{ marginRight: 4 }} />
              리스트 뷰로 보기
            </AppButton>
          )}
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
        <div className="settlement-tab__summary-card">
          <span className="settlement-tab__summary-label">정산 완료금</span>
          <span className="settlement-tab__summary-value">
            {data.completedAmount.toLocaleString()}
            <span className="settlement-tab__summary-unit">건</span>
          </span>
        </div>
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

      {/* 리스트 뷰 */}
      {viewMode === 'list' && (
        <div className="settlement-tab__list-wrap">
          {filteredRows.length > 0 ? (
            <Table<SettlementRow>
              columns={columns}
              dataSource={filteredRows}
              rowKey="id"
              pagination={false}
              size="middle"
              className="settlement-tab__table cms-data-table"
              rowSelection={{
                type: 'checkbox' as const,
                ...rowSelection,
                columnWidth: TABLE_COLUMN_WIDTHS.checkbox,
                renderCell: (_value, _record, _index, originNode) => (
                  <div className="settlement-tab__checkbox-cell">{originNode}</div>
                ),
              }}
              onRow={record => ({
                onClick: e => {
                  const target = e.target as HTMLElement
                  if (
                    target.closest('.status-dropdown-cell__cell-status') ||
                    target.closest('.status-dropdown-cell__status-trigger')
                  ) {
                    return
                  }
                  handleOpenDetail(record)
                },
                style: { cursor: 'pointer' },
              })}
            />
          ) : (
            <Empty description="정산 내역이 없습니다." />
          )}
        </div>
      )}

      {/* 캘린더 뷰 */}
      {viewMode === 'calendar' && (
        <div className="settlement-cal">
          <div className="settlement-cal__calendar-wrap">
            <div className="settlement-cal__weekday-header">
              {CAL_WEEKDAYS.map(d => (
                <span key={d} className="settlement-cal__weekday">{d}</span>
              ))}
            </div>
            <Calendar
              value={currentMonth}
              fullCellRender={dateFullCellRender}
              headerRender={() => null}
            />
          </div>

          {/* 우측 상세 패널 */}
          <div className="settlement-cal__detail">
            {selectedDateRows.length > 0 ? (
              <div className="settlement-cal__detail-list">
                {selectedDateRows.map(row => {
                  const tagStyle = STATUS_TAG_STYLE[row.status]
                  return (
                    <label
                      key={row.id}
                      className="settlement-cal__detail-item"
                      style={{ backgroundColor: tagStyle.bg }}
                    >
                      <Checkbox
                        checked={calendarSelectedKeys.includes(row.id)}
                        onChange={e => {
                          setCalendarSelectedKeys(prev =>
                            e.target.checked
                              ? [...prev, row.id]
                              : prev.filter(k => k !== row.id),
                          )
                        }}
                      />
                      <div
                        className="settlement-cal__detail-body"
                        onClick={(e) => {
                          e.preventDefault()
                          handleOpenDetail(row)
                        }}
                      >
                        <div className="settlement-cal__detail-header">
                          <span
                            className="settlement-cal__detail-status"
                            style={{ color: tagStyle.color }}
                          >
                            {SETTLEMENT_ROW_STATUS_LABELS[row.status]}
                          </span>
                          <span className="settlement-cal__detail-divider" />
                          <span className="settlement-cal__detail-amount">
                            +{row.amount.toLocaleString()}원
                          </span>
                        </div>
                        <div className="settlement-cal__detail-program">
                          [{row.programName.length > 40
                            ? row.programName.slice(0, 40) + '...'
                            : row.programName}]
                        </div>
                      </div>
                    </label>
                  )
                })}
              </div>
            ) : (
              <div className="settlement-cal__detail-empty">
                {selectedDate != null
                  ? '해당 날짜의 정산 내역이 없습니다.'
                  : '날짜를 선택하세요.'}
              </div>
            )}
          </div>
        </div>
      )}

      <SettlementDetailModal
        open={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        detail={detailModalData}
        teacherName={teacherName}
        bankInfo={bankInfo}
        onReject={handleReject}
        onPaymentComplete={handlePaymentComplete}
      />
    </div>
  )
}
