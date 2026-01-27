/**
 * 프로그램 일정 리스트 컴포넌트
 * 선택된 날짜의 프로그램 일정을 리스트로 표시
 */

import { useMemo } from 'react'
import { Tag, Empty } from 'antd'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import type { Program } from '@/types/domain'
import './program-calendar-view.css'

interface ProgramScheduleListProps {
  selectedDate: Dayjs
  programs: Program[]
  onProgramClick: (program: Program) => void
}

type EventStatus =
  | 'recruiting_start'
  | 'recruiting_end'
  | 'education_scheduled'
  | 'education_ongoing'

const statusConfig: Record<
  EventStatus,
  { label: string; color: string; tagColor: string }
> = {
  recruiting_start: {
    label: '모집 시작',
    color: '#52c41a',
    tagColor: 'success',
  },
  recruiting_end: {
    label: '모집 마감',
    color: '#ff4d4f',
    tagColor: 'error',
  },
  education_scheduled: {
    label: '교육 예정',
    color: '#1890ff',
    tagColor: 'processing',
  },
  education_ongoing: {
    label: '교육 진행',
    color: '#01a1af',
    tagColor: 'cyan',
  },
}

function getEventStatus(program: Program, date: Dayjs): EventStatus {
  const now = dayjs()

  // 1. 모집 기간 체크
  if (program.applicationStartDate && program.applicationEndDate) {
    const appStart = dayjs(program.applicationStartDate)
    const appEnd = dayjs(program.applicationEndDate)

    if (date.isSame(appStart, 'day')) {
      return 'recruiting_start'
    }
    if (date.isSame(appEnd, 'day')) {
      return 'recruiting_end'
    }
  }

  // 2. 교육 기간 체크
  const startDate = dayjs(program.startDate)

  if (startDate.isAfter(now, 'day')) {
    return 'education_scheduled'
  }

  return 'education_ongoing'
}

function getEventTime(program: Program, date: Dayjs): string {
  // 신청 시작일인 경우
  if (
    program.applicationStartDate &&
    date.isSame(dayjs(program.applicationStartDate), 'day')
  ) {
    return '00:00'
  }

  // 신청 마감일인 경우
  if (
    program.applicationEndDate &&
    date.isSame(dayjs(program.applicationEndDate), 'day')
  ) {
    return '24:00'
  }

  // 교육 시작일인 경우
  if (date.isSame(dayjs(program.startDate), 'day')) {
    return '15:00' // 기본값
  }

  return '00:00'
}

export function ProgramScheduleList({
  selectedDate,
  programs,
  onProgramClick,
}: ProgramScheduleListProps) {
  // 선택된 날짜에 해당하는 프로그램 필터링
  const dayPrograms = useMemo(() => {
    return programs.filter(program => {
      const start = dayjs(program.startDate)
      const end = dayjs(program.endDate)
      const isInEducationPeriod =
        selectedDate.isSameOrAfter(start, 'day') &&
        selectedDate.isSameOrBefore(end, 'day')

      // 모집 기간 체크
      let isInApplicationPeriod = false
      if (program.applicationStartDate && program.applicationEndDate) {
        const appStart = dayjs(program.applicationStartDate)
        const appEnd = dayjs(program.applicationEndDate)
        isInApplicationPeriod =
          selectedDate.isSameOrAfter(appStart, 'day') &&
          selectedDate.isSameOrBefore(appEnd, 'day')
      }

      return isInEducationPeriod || isInApplicationPeriod
    })
  }, [programs, selectedDate])

  return (
    <div className="program-schedule-list">
      <div className="program-schedule-list-header">
        {selectedDate.format('M월 D일')} 일정
      </div>
      <div className="program-schedule-list-content">
        {dayPrograms.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="해당 날짜에 일정이 없습니다"
          />
        ) : (
          dayPrograms.map(program => {
            const status = getEventStatus(program, selectedDate)
            const time = getEventTime(program, selectedDate)
            const config = statusConfig[status]

            return (
              <div
                key={program.id}
                className="program-schedule-item"
                onClick={() => onProgramClick(program)}
              >
                <Tag color={config.tagColor} className="program-schedule-item-status">
                  {config.label}
                </Tag>
                <span className="program-schedule-item-time">{time}</span>
                <span className="program-schedule-item-title">{program.title}</span>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
