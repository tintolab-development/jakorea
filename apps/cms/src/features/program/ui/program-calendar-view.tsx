/**
 * 프로그램 캘린더 뷰 컴포넌트
 * 3단: 좌측(미니 캘린더 + 검색 + 유형 필터) | 중앙(메인 캘린더) | 우측(선택일 일정 리스트)
 */

import { useState, useMemo, useRef, useEffect } from 'react'
import { Spin, Checkbox } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter'
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore'
import type { Program } from '@/types/domain'
import { ProgramMiniCalendar } from './program-mini-calendar'
import { ProgramScheduleList } from './program-schedule-list'
import { businessAreaOptions } from './constants/program-list-constants'
import { ProgramCalendar } from '@/shared/ui'
import './program-calendar-view.css'
import { AppInput } from '@/shared/ui/app-input'

const businessAreaColorClasses: Record<string, string> = {
  경제금융: 'program-calendar-left__filter-item--cyan',
  기업가정신: 'program-calendar-left__filter-item--red',
  진로취업: 'program-calendar-left__filter-item--purple',
  디지털리터러시: 'program-calendar-left__filter-item--green',
}

dayjs.extend(isSameOrAfter)
dayjs.extend(isSameOrBefore)

interface ProgramCalendarViewProps {
  programs: Program[]
  loading?: boolean
  onProgramClick: (program: Program) => void
}

export function ProgramCalendarView({
  programs,
  loading,
  onProgramClick,
}: ProgramCalendarViewProps) {
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs())
  const [currentMonth, setCurrentMonth] = useState<Dayjs>(dayjs().startOf('month'))
  const [calendarMode, setCalendarMode] = useState<'month' | 'week'>('month')
  const [calendarSearchKeyword, setCalendarSearchKeyword] = useState('')
  /** 초기 진입 시 사업분야 필터 전체 선택; 선택된 항목에 해당하는 프로그램만 캘린더·일정 목록에 표시 */
  const [calendarBusinessAreaKeys, setCalendarBusinessAreaKeys] = useState<string[]>(() =>
    businessAreaOptions.map(o => o.value)
  )
  const [sidebarHeight, setSidebarHeight] = useState<number | null>(null)
  const mainCalendarRef = useRef<HTMLDivElement>(null)

  const filteredByCalendar = useMemo(() => {
    let list = programs
    const keyword = calendarSearchKeyword.trim().toLowerCase()
    if (keyword) {
      list = list.filter(p => (p.title ?? '').toLowerCase().includes(keyword))
    }
    if (calendarBusinessAreaKeys.length === 0) {
      list = []
    } else {
      list = list.filter(
        p => p.businessArea != null && calendarBusinessAreaKeys.includes(p.businessArea)
      )
    }
    return list
  }, [programs, calendarSearchKeyword, calendarBusinessAreaKeys])

  useEffect(() => {
    const el = mainCalendarRef.current
    if (!el) return

    const updateHeight = () => {
      setSidebarHeight(el.offsetHeight)
    }
    updateHeight()

    let ro: ResizeObserver | undefined
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(updateHeight)
      ro.observe(el)
    }
    window.addEventListener('resize', updateHeight)
    return () => {
      ro?.disconnect()
      window.removeEventListener('resize', updateHeight)
    }
  }, [calendarMode])

  const programDates = useMemo(() => {
    const dates = new Set<string>()
    filteredByCalendar.forEach(program => {
      const start = dayjs(program.startDate)
      const end = dayjs(program.endDate)
      let current = start

      while (current.isSameOrBefore(end, 'day')) {
        dates.add(current.format('YYYY-MM-DD'))
        current = current.add(1, 'day')
      }

      if (program.applicationStartDate && program.applicationEndDate) {
        const appStart = dayjs(program.applicationStartDate)
        const appEnd = dayjs(program.applicationEndDate)
        let appCurrent = appStart

        while (appCurrent.isSameOrBefore(appEnd, 'day')) {
          dates.add(appCurrent.format('YYYY-MM-DD'))
          appCurrent = appCurrent.add(1, 'day')
        }
      }
    })
    return dates
  }, [filteredByCalendar])

  const handleDateSelect = (date: Dayjs) => {
    setSelectedDate(date)
    if (!date.isSame(currentMonth, 'month')) {
      setCurrentMonth(date.startOf('month'))
    }
  }

  const handleMonthChange = (month: Dayjs) => {
    setCurrentMonth(month)
  }

  const handleBusinessAreaChange = (value: string, checked: boolean) => {
    setCalendarBusinessAreaKeys(prev =>
      checked ? [...prev, value] : prev.filter(k => k !== value)
    )
  }

  if (loading) {
    return (
      <div className="program-calendar-view program-calendar-view--loading">
        <Spin size="large" />
      </div>
    )
  }

  return (
    <div className="program-calendar-view">
      <div className="program-calendar-left">
        <ProgramMiniCalendar
          currentMonth={currentMonth}
          selectedDate={selectedDate}
          onMonthChange={handleMonthChange}
          programDates={programDates}
        />
        <div className="program-calendar-left__search-widget">
          <div className="program-calendar-left__search">
            <AppInput
              placeholder="프로그램명을 입력하세요"
              prefix={<SearchOutlined style={{ color: 'var(--color-text-secondary)' }} />}
              value={calendarSearchKeyword}
              onChange={e => setCalendarSearchKeyword(e.target.value)}
              allowClear
            />
          </div>
          <div className="program-calendar-left__filters">
            {businessAreaOptions.map(opt => (
              <div key={opt.value} className="program-calendar-left__filters-wrapper">
                <Checkbox
                  className={`program-calendar-left__filter-item ${businessAreaColorClasses[opt.value] ?? ''}`}
                  checked={calendarBusinessAreaKeys.includes(opt.value)}
                  onChange={e => handleBusinessAreaChange(opt.value, e.target.checked)}
                >
                  {opt.label}
                </Checkbox>
              </div>
            ))}
          </div>
        </div>
      </div>

      <ProgramCalendar
        ref={mainCalendarRef}
        programs={filteredByCalendar}
        selectedDate={selectedDate}
        currentMonth={currentMonth}
        mode={calendarMode}
        onSelectDate={handleDateSelect}
        onMonthChange={handleMonthChange}
        onModeChange={setCalendarMode}
        onProgramClick={onProgramClick}
      />

      <div
        className="program-calendar-right"
        style={sidebarHeight ? { height: sidebarHeight } : undefined}
      >
        <ProgramScheduleList
          selectedDate={selectedDate}
          programs={filteredByCalendar}
          onProgramClick={onProgramClick}
        />
      </div>
    </div>
  )
}
