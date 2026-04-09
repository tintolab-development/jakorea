/**
 * 프로그램 캘린더 뷰 컴포넌트
 * 3단: 좌측(미니 캘린더 + 검색 + 프로그램명 필터) | 중앙(메인 캘린더) | 우측(선택일 일정 리스트)
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
import { CmsInput, ProgramCalendar } from '@/shared/ui'
import './program-calendar-view.css'

const programFilterColorClasses = [
  'program-calendar-left__filter-item--cyan',
  'program-calendar-left__filter-item--red',
  'program-calendar-left__filter-item--purple',
  'program-calendar-left__filter-item--green',
] as const

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
  /** null이면 프로그램명 필터 전체 선택; 배열이면 해당 id만 캘린더·일정 목록에 표시 */
  const [calendarProgramSelection, setCalendarProgramSelection] = useState<string[] | null>(null)
  const [sidebarHeight, setSidebarHeight] = useState<number | null>(null)
  const mainCalendarRef = useRef<HTMLDivElement>(null)

  const programFilterOptions = useMemo(() => {
    const keyword = calendarSearchKeyword.trim().toLowerCase()
    let list = programs
    if (keyword) {
      list = list.filter(p => (p.title ?? '').toLowerCase().includes(keyword))
    }
    return [...list]
      .sort((a, b) => (a.title ?? '').localeCompare(b.title ?? '', 'ko'))
      .map(p => ({ id: p.id, title: p.title?.trim() || '이름 없음' }))
  }, [programs, calendarSearchKeyword])

  const allProgramIds = useMemo(() => programs.map(p => p.id), [programs])
  const effectiveProgramSelection = calendarProgramSelection ?? allProgramIds

  const filteredByCalendar = useMemo(() => {
    let list = programs
    const keyword = calendarSearchKeyword.trim().toLowerCase()
    if (keyword) {
      list = list.filter(p => (p.title ?? '').toLowerCase().includes(keyword))
    }
    if (calendarProgramSelection !== null) {
      if (calendarProgramSelection.length === 0) {
        list = []
      } else {
        const allowed = new Set(calendarProgramSelection)
        list = list.filter(p => allowed.has(p.id))
      }
    }
    return list
  }, [programs, calendarSearchKeyword, calendarProgramSelection])

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

  const handleProgramFilterChange = (programId: string, checked: boolean) => {
    const allIds = programs.map(p => p.id)
    setCalendarProgramSelection(prev => {
      const base = prev ?? allIds
      const next = checked
        ? [...new Set([...base, programId])]
        : base.filter(id => id !== programId)
      const allSelected =
        next.length === allIds.length && allIds.every(id => next.includes(id))
      return allSelected ? null : next
    })
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
          onSelectDate={handleDateSelect}
          programDates={programDates}
        />
        <div className="program-calendar-left__search-widget">
          <div className="program-calendar-left__search">
            <CmsInput
              placeholder="프로그램명을 입력하세요"
              icon={<SearchOutlined style={{ color: 'var(--color-text-secondary)' }} />}
              value={calendarSearchKeyword}
              onChange={e => setCalendarSearchKeyword(e.target.value)}
              allowClear
            />
          </div>
          <div className="program-calendar-left__filters">
            {programFilterOptions.map((opt, index) => (
              <div key={opt.id} className="program-calendar-left__filters-wrapper">
                <Checkbox
                  className={`program-calendar-left__filter-item ${
                    programFilterColorClasses[index % programFilterColorClasses.length]
                  }`}
                  checked={effectiveProgramSelection.includes(opt.id)}
                  onChange={e => handleProgramFilterChange(opt.id, e.target.checked)}
                >
                  {opt.title}
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
