/**
 * 참여 기관 페이지(풀페이지 모달) 필터 쿼리 파라미터 연동
 * lnb=progress&tab=institutions 일 때 기관명·지역·학년·교재배송현황·담당교사강사명
 */

import { useMemo, useCallback, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  PROGRESS_CALENDAR_RANGE_PARAM,
  parseCalendarRangeParam,
  applyCalendarRangeParam,
  type CalendarGranularity,
} from './progress-calendar-range'

export interface ParticipatingInstitutionsFilters {
  schoolName: string
  region: string
  educationGrade: string
  textbookStatus: string
  teacherName: string
}

const DEFAULT_FILTERS: ParticipatingInstitutionsFilters = {
  schoolName: '',
  region: 'all',
  educationGrade: 'all',
  textbookStatus: 'all',
  teacherName: '',
}

function readFiltersFromParams(searchParams: URLSearchParams): ParticipatingInstitutionsFilters {
  return {
    schoolName: searchParams.get('schoolName') ?? DEFAULT_FILTERS.schoolName,
    region: searchParams.get('region') ?? DEFAULT_FILTERS.region,
    educationGrade: searchParams.get('educationGrade') ?? DEFAULT_FILTERS.educationGrade,
    textbookStatus: searchParams.get('textbookStatus') ?? DEFAULT_FILTERS.textbookStatus,
    teacherName: searchParams.get('teacherName') ?? DEFAULT_FILTERS.teacherName,
  }
}

export function useParticipatingInstitutionsParams() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [appliedFilters, setAppliedFilters] = useState<ParticipatingInstitutionsFilters>(() =>
    readFiltersFromParams(searchParams)
  )

  const filters = useMemo((): ParticipatingInstitutionsFilters => {
    return readFiltersFromParams(searchParams)
  }, [searchParams])

  const setFilters = useCallback(
    (updates: Partial<ParticipatingInstitutionsFilters>) => {
      const next = new URLSearchParams(searchParams)
      const keys: (keyof ParticipatingInstitutionsFilters)[] = [
        'schoolName',
        'region',
        'educationGrade',
        'textbookStatus',
        'teacherName',
      ]
      keys.forEach(name => {
        const value = updates[name]
        if (value === undefined) return
        const defaultValue = DEFAULT_FILTERS[name]
        if (value === '' || value === defaultValue) {
          next.delete(name)
        } else {
          next.set(name, value)
        }
      })
      setSearchParams(next, { replace: true })
    },
    [searchParams, setSearchParams]
  )

  const setFilter = useCallback(
    (key: keyof ParticipatingInstitutionsFilters, value: string) => {
      setFilters({ [key]: value })
    },
    [setFilters]
  )

  /** 조회 버튼 클릭 시 전달한 값으로 URL 갱신 후 appliedFilters 반영 (기관명/담당 등 로컬 입력 동기화용) */
  const applyFilters = useCallback(
    (overrides?: Partial<ParticipatingInstitutionsFilters>) => {
      const next = new URLSearchParams(searchParams)
      const merged: ParticipatingInstitutionsFilters = {
        schoolName: overrides?.schoolName ?? filters.schoolName,
        region: overrides?.region ?? filters.region,
        educationGrade: overrides?.educationGrade ?? filters.educationGrade,
        textbookStatus: overrides?.textbookStatus ?? filters.textbookStatus,
        teacherName: overrides?.teacherName ?? filters.teacherName,
      }
      const keys: (keyof ParticipatingInstitutionsFilters)[] = [
        'schoolName',
        'region',
        'educationGrade',
        'textbookStatus',
        'teacherName',
      ]
      keys.forEach(name => {
        const value = merged[name]
        const defaultValue = DEFAULT_FILTERS[name]
        if (value === '' || value === defaultValue) {
          next.delete(name)
        } else {
          next.set(name, value)
        }
      })
      setSearchParams(next, { replace: true })
      setAppliedFilters(merged)
    },
    [searchParams, setSearchParams, filters]
  )

  const progressCalendarGranularity = useMemo(
    (): CalendarGranularity => parseCalendarRangeParam(searchParams, PROGRESS_CALENDAR_RANGE_PARAM),
    [searchParams]
  )

  const setProgressCalendarGranularity = useCallback(
    (granularity: CalendarGranularity) => {
      const next = new URLSearchParams(searchParams)
      applyCalendarRangeParam(next, PROGRESS_CALENDAR_RANGE_PARAM, granularity)
      setSearchParams(next, { replace: true })
    },
    [searchParams, setSearchParams]
  )

  return {
    filters,
    appliedFilters,
    setFilters,
    setFilter,
    applyFilters,
    progressCalendarGranularity,
    setProgressCalendarGranularity,
  }
}
