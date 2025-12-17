/**
 * 일정 캘린더 페이지
 * Phase 3.1: 캘린더 뷰, 일정 표시, 필터링
 */

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useScheduleStore } from '../../store/scheduleStore'
import { useProgramStore } from '../../store/programStore'
import { useInstructorStore } from '../../store/instructorStore'
import { CalendarView, type CalendarViewMode } from '../../components/calendar'
import { MdSelect, MdSelectOption } from '../../components/m3'
import { CustomButton } from '../../components/ui'
import { useQueryParams } from '../../hooks/useQueryParams'
import type { Schedule } from '../../types/domain'
import '../../components/m3/MdSelect.css'
import './SchedulesCalendar.css'

export default function SchedulesCalendar() {
  const navigate = useNavigate()
  const { schedules, isLoading, error, fetchSchedules, filters, setFilters } = useScheduleStore()
  const programStore = useProgramStore()
  const instructorStore = useInstructorStore()
  const { programs, fetchPrograms: fetchProgramsForFilter } = programStore
  const { instructors, fetchInstructors: fetchInstructorsForFilter } = instructorStore
  const { params, updateParams } = useQueryParams()

  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<CalendarViewMode>('month')

  // URL 쿼리 파라미터에서 초기값으로 스토어 동기화
  useEffect(() => {
    const urlProgramId = params.programId || undefined
    const urlInstructorId = params.instructorId || undefined

    if (filters.programId !== urlProgramId) setFilters({ programId: urlProgramId })
    if (filters.instructorId !== urlInstructorId) setFilters({ instructorId: urlInstructorId })
  }, [params, filters.programId, filters.instructorId, setFilters])

  // 스토어 상태 변경 시 URL 업데이트
  useEffect(() => {
    updateParams(
      {
        ...(filters.programId && { programId: filters.programId }),
        ...(filters.instructorId && { instructorId: filters.instructorId }),
      } as Record<string, string | undefined>,
      true
    )
  }, [filters.programId, filters.instructorId, updateParams])

  // 프로그램 목록 로드
  useEffect(() => {
    if (programs.length === 0) {
      fetchProgramsForFilter({ page: 1, pageSize: 100 })
    }
  }, [programs.length, fetchProgramsForFilter])

  // 강사 목록 로드
  useEffect(() => {
    if (instructors.length === 0) {
      fetchInstructorsForFilter({ page: 1, pageSize: 100 })
    }
  }, [instructors.length, fetchInstructorsForFilter])

  // 일정 데이터 로드
  useEffect(() => {
    fetchSchedules({
      programId: filters.programId,
      instructorId: filters.instructorId,
      startDate:
        viewMode === 'month'
          ? new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
              .toISOString()
              .split('T')[0]
          : (() => {
              const weekStart = new Date(currentDate)
              weekStart.setDate(currentDate.getDate() - currentDate.getDay())
              return weekStart.toISOString().split('T')[0]
            })(),
      endDate:
        viewMode === 'month'
          ? new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
              .toISOString()
              .split('T')[0]
          : (() => {
              const weekEnd = new Date(currentDate)
              weekEnd.setDate(currentDate.getDate() + (6 - currentDate.getDay()))
              return weekEnd.toISOString().split('T')[0]
            })(),
    })
  }, [currentDate, viewMode, filters.programId, filters.instructorId, fetchSchedules])

  // 일정 클릭 핸들러
  const handleScheduleClick = (schedule: Schedule) => {
    navigate(`/schedules/${schedule.id}`)
  }

  // 날짜 클릭 핸들러 (일정 추가로 이동)
  const handleDateClick = (date: Date) => {
    // 향후 일정 추가 페이지로 이동할 수 있도록 확장 가능
    const dateStr = date.toISOString().split('T')[0]
    navigate(`/schedules/new?date=${dateStr}`)
  }

  if (error) {
    return <div className="error-message">{error}</div>
  }

  return (
    <div className="schedules-calendar-page">
      <div className="page-header">
        <h1>일정 관리</h1>
        <CustomButton variant="primary" onClick={() => navigate('/schedules/new')}>
          일정 등록
        </CustomButton>
      </div>

      {/* 필터 영역 */}
      <div className="filters">
        <div className="filter-group">
          <MdSelect
            label="프로그램"
            value={filters.programId || ''}
            onChange={value => setFilters({ programId: value || undefined })}
          >
            <MdSelectOption value="">
              <div slot="headline">전체</div>
            </MdSelectOption>
            {programStore.programs.map(program => (
              <MdSelectOption key={program.id} value={program.id}>
                <div slot="headline">{program.title}</div>
              </MdSelectOption>
            ))}
          </MdSelect>
        </div>
        <div className="filter-group">
            <MdSelect
              label="강사"
              value={filters.instructorId || ''}
              onChange={value => {
                setFilters({ instructorId: value || undefined })
              }}
            >
            <MdSelectOption value="">
              <div slot="headline">전체</div>
            </MdSelectOption>
            {instructors.map(instructor => (
              <MdSelectOption key={instructor.id} value={instructor.id}>
                <div slot="headline">{instructor.name}</div>
              </MdSelectOption>
            ))}
          </MdSelect>
        </div>
      </div>

      {/* 캘린더 뷰 */}
      {isLoading ? (
        <div className="loading">로딩 중...</div>
      ) : (
        <CalendarView
          schedules={schedules}
          currentDate={currentDate}
          onDateChange={setCurrentDate}
          onViewModeChange={setViewMode}
          onScheduleClick={handleScheduleClick}
          onDateClick={handleDateClick}
          viewMode={viewMode}
        />
      )}
    </div>
  )
}
