/**
 * 일정 캘린더 컴포넌트
 * Phase 3.1: Ant Design Calendar 활용 (월간/주간 전환)
 * UI/UX 개선: 닷 요소와 일정을 row 방향으로 배치, 호버 영역 개선
 */

import { useState, useMemo, useCallback } from 'react'
import { Calendar, Badge, Radio, Space, Tag, Alert, Popover, Select } from 'antd'
import type { RadioChangeEvent } from 'antd'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import type { CalendarMode } from 'antd/es/calendar/generateCalendar'
import type { Schedule } from '@/types/domain'
import { programService } from '@/entities/program/api/program-service'
import { instructorService } from '@/entities/instructor/api/instructor-service'
import { useQueryParams } from '@/shared/hooks/use-query-params'
import { domainColorsHex } from '@/shared/constants/colors'
import './schedule-calendar.css'

const { Option } = Select

interface ScheduleCalendarProps {
  schedules: Schedule[]
  onDateSelect: (date: Dayjs, schedule?: Schedule) => void
  onPanelChange?: (date: Dayjs, mode: CalendarMode) => void
  conflicts?: Schedule[]
}

type CalendarQueryParams = Record<string, string | undefined>

export function ScheduleCalendar({
  schedules,
  onDateSelect,
  onPanelChange,
  conflicts = [],
}: ScheduleCalendarProps) {
  const { params, setParams } = useQueryParams<CalendarQueryParams>()
  const currentDate = useMemo(() => {
    const year = params.year ? parseInt(params.year) : dayjs().year()
    const month = params.month ? parseInt(params.month) : dayjs().month() + 1
    return dayjs()
      .year(year)
      .month(month - 1)
      .date(1)
  }, [params.year, params.month])

  // 쿼리 파라미터에서 모드 가져오기 (state 대신 직접 사용)
  const mode = useMemo(() => {
    return (
      params.mode === 'month' || params.mode === 'year' ? params.mode : 'month'
    ) as CalendarMode
  }, [params.mode])

  const [isHeaderChanging, setIsHeaderChanging] = useState(false)

  // mode 변경 함수 (쿼리 파라미터 업데이트)
  const handleModeChange = useCallback(
    (newMode: CalendarMode) => {
      setParams({
        year: params.year || String(dayjs().year()),
        month: params.month || String(dayjs().month() + 1),
        mode: newMode,
      })
    },
    [params.year, params.month, setParams]
  )

  const getListData = (value: Dayjs) => {
    const dateStr = value.format('YYYY-MM-DD')
    return schedules.filter(s => {
      const scheduleDate =
        typeof s.date === 'string' ? s.date : new Date(s.date).toISOString().split('T')[0]
      return scheduleDate === dateStr
    })
  }

  const dateCellRender = (value: Dayjs) => {
    const listData = getListData(value)

    if (listData.length === 0) {
      return null
    }

    return (
      <div className="schedule-cell" onClick={e => e.stopPropagation()}>
        <div className="schedule-list">
          {listData.map(schedule => {
            const isConflict = conflicts.some(c => c.id === schedule.id)
            const program = programService.getByIdSync(schedule.programId)
            const instructor = schedule.instructorId
              ? instructorService.getByIdSync(schedule.instructorId)
              : null

            const popoverContent = (
              <div className="schedule-popover">
                <div className="schedule-popover-title">
                  <strong>{schedule.title}</strong>
                  {isConflict && <Badge status="error" text="중복" style={{ marginLeft: 8 }} />}
                </div>
                <div className="schedule-popover-item">
                  <span className="schedule-popover-label">프로그램:</span>
                  <span>{program?.title || '-'}</span>
                </div>
                {instructor && (
                  <div className="schedule-popover-item">
                    <span className="schedule-popover-label">강사:</span>
                    <span>{instructor.name}</span>
                  </div>
                )}
                <div className="schedule-popover-item">
                  <span className="schedule-popover-label">시간:</span>
                  <span>
                    {schedule.startTime} - {schedule.endTime}
                  </span>
                </div>
                {schedule.location && (
                  <div className="schedule-popover-item">
                    <span className="schedule-popover-label">장소:</span>
                    <span>{schedule.location}</span>
                  </div>
                )}
                {schedule.onlineLink && (
                  <div className="schedule-popover-item">
                    <span className="schedule-popover-label">온라인:</span>
                    <a href={schedule.onlineLink} target="_blank" rel="noopener noreferrer">
                      링크 열기
                    </a>
                  </div>
                )}
              </div>
            )

            return (
              <Popover
                key={schedule.id}
                content={popoverContent}
                trigger="hover"
                placement="right"
                overlayClassName="schedule-popover-overlay"
              >
                <div
                  className={`schedule-item ${isConflict ? 'schedule-item-conflict' : ''}`}
                  onClick={e => {
                    e.stopPropagation()
                    e.preventDefault()
                    onDateSelect(value, schedule)
                  }}
                  onDoubleClick={e => {
                    e.stopPropagation()
                    e.preventDefault()
                    onDateSelect(value, schedule)
                  }}
                >
                  <div
                    className={`schedule-dot ${isConflict ? 'schedule-dot-conflict' : ''}`}
                    title={schedule.title}
                  />
                  <div className="schedule-item-time">{schedule.startTime}</div>
                  <div className="schedule-item-title">{schedule.title}</div>
                </div>
              </Popover>
            )
          })}
        </div>
      </div>
    )
  }

  const monthCellRender = (value: Dayjs) => {
    const monthStart = value.startOf('month')
    const monthEnd = value.endOf('month')
    const monthSchedules = schedules.filter(s => {
      const scheduleDate = typeof s.date === 'string' ? new Date(s.date) : new Date(s.date)
      return scheduleDate >= monthStart.toDate() && scheduleDate <= monthEnd.toDate()
    })
    const monthConflicts = monthSchedules.filter(s => conflicts.some(c => c.id === s.id))

    return monthSchedules.length > 0 ? (
      <div className="schedule-month-summary">
        <Tag color={domainColorsHex.schedule.primary}>{monthSchedules.length}개</Tag>
        {monthConflicts.length > 0 && (
          <Tag color={domainColorsHex.settlement.primary} style={{ marginLeft: 4 }}>
            중복 {monthConflicts.length}
          </Tag>
        )}
      </div>
    ) : null
  }

  return (
    <div>
      <Space style={{ marginBottom: 16, width: '100%' }} direction="vertical" size="middle">
        {conflicts.length > 0 && (
          <Alert
            message="일정 중복 감지"
            description={`${conflicts.length}개의 일정이 동일 강사의 동일 시간대와 겹칩니다.`}
            type="warning"
            showIcon
            closable
          />
        )}
      </Space>

      <div>
        <Calendar
          mode={mode}
          value={currentDate}
          cellRender={(value, info) => {
            if (info.type === 'month') {
              return monthCellRender(value)
            }
            return dateCellRender(value)
          }}
          onSelect={date => {
            // 헤더 변경 중이면 날짜 선택 무시
            if (isHeaderChanging) {
              setIsHeaderChanging(false)
              return
            }
            const listData = getListData(date)
            onDateSelect(date, listData[0])
          }}
          onPanelChange={(date, newMode) => {
            setParams({
              mode: newMode,
              year: String(date.year()),
              month: String(date.month() + 1),
            })
            onPanelChange?.(date, newMode)
          }}
          headerRender={({ value, onChange }) => {
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

            const handleHeaderClick = (e: React.MouseEvent) => {
              e.stopPropagation()
              e.preventDefault()
            }

            return (
              <div
                className="schedule-calendar-header"
                onClick={handleHeaderClick}
                onMouseDown={handleHeaderClick}
                onMouseUp={handleHeaderClick}
              >
                <Space size="middle">
                  <Select
                    value={year}
                    onChange={newYear => {
                      setIsHeaderChanging(true)
                      const newValue = value.year(newYear)
                      onChange(newValue)
                      setParams({
                        year: String(newYear),
                        month: String(month),
                        mode: mode,
                      })
                      // 다음 이벤트 루프에서 플래그 리셋
                      setTimeout(() => setIsHeaderChanging(false), 0)
                    }}
                    onClick={handleHeaderClick}
                    onMouseDown={handleHeaderClick}
                    onOpenChange={open => {
                      if (open) {
                        setIsHeaderChanging(true)
                      } else {
                        // 드롭다운이 닫힐 때 약간의 지연 후 플래그 리셋
                        setTimeout(() => setIsHeaderChanging(false), 100)
                      }
                    }}
                    getPopupContainer={triggerNode => triggerNode.parentElement || document.body}
                    style={{ width: 100 }}
                  >
                    {Array.from({ length: 10 }, (_, i) => year - 5 + i).map(y => (
                      <Option key={y} value={y}>
                        {y}
                      </Option>
                    ))}
                  </Select>
                  <Select
                    value={month}
                    onChange={newMonth => {
                      setIsHeaderChanging(true)
                      const newValue = value.month(newMonth - 1)
                      onChange(newValue)
                      setParams({
                        year: String(year),
                        month: String(newMonth),
                        mode: mode,
                      })
                      // 다음 이벤트 루프에서 플래그 리셋
                      setTimeout(() => setIsHeaderChanging(false), 0)
                    }}
                    onClick={handleHeaderClick}
                    onMouseDown={handleHeaderClick}
                    onOpenChange={open => {
                      if (open) {
                        setIsHeaderChanging(true)
                      } else {
                        // 드롭다운이 닫힐 때 약간의 지연 후 플래그 리셋
                        setTimeout(() => setIsHeaderChanging(false), 100)
                      }
                    }}
                    getPopupContainer={triggerNode => triggerNode.parentElement || document.body}
                    style={{ width: 100 }}
                  >
                    {monthNames.map((name, index) => (
                      <Option key={index + 1} value={index + 1}>
                        {name}
                      </Option>
                    ))}
                  </Select>
                  <div
                    onClick={e => {
                      e.stopPropagation()
                      // Radio.Group 내부 클릭은 허용
                    }}
                    onMouseDown={e => {
                      // Radio.Button 클릭은 허용
                      const target = e.target as HTMLElement
                      if (!target.closest('.ant-radio-button')) {
                        e.stopPropagation()
                      }
                    }}
                  >
                    <Radio.Group
                      value={mode}
                      onChange={(e: RadioChangeEvent) => {
                        e.stopPropagation()
                        setIsHeaderChanging(true)
                        const newMode = e.target.value as CalendarMode
                        handleModeChange(newMode)
                        setTimeout(() => setIsHeaderChanging(false), 100)
                      }}
                    >
                      <Radio.Button
                        value="month"
                        onClick={e => {
                          e.stopPropagation()
                        }}
                      >
                        월간
                      </Radio.Button>
                      <Radio.Button
                        value="year"
                        onClick={e => {
                          e.stopPropagation()
                        }}
                      >
                        연간
                      </Radio.Button>
                    </Radio.Group>
                  </div>
                </Space>
              </div>
            )
          }}
        />
      </div>
    </div>
  )
}
