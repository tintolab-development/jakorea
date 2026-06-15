/**
 * 참여 강사 페이지(풀페이지 모달) 필터·뷰 쿼리 파라미터 연동
 * lnb=progress&tab=instructors 일 때 참여 강사명·자택 주소지(시/도·시/군/구)·JA 강의 경력·JA 평가 등급·정산 현황
 * instructorView=list|calendar — 리스트/캘린더 뷰 (생략 시 list)
 */

import { useMemo, useCallback, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  PROGRESS_CALENDAR_RANGE_PARAM,
  parseCalendarRangeParam,
  applyCalendarRangeParam,
  type CalendarGranularity,
} from './progress-calendar-range'

export const PARTICIPATING_INSTRUCTORS_VIEW_PARAM = 'instructorView'

export type ParticipatingInstructorsViewMode = 'list' | 'calendar'

function parseViewMode(searchParams: URLSearchParams): ParticipatingInstructorsViewMode {
  const v = searchParams.get(PARTICIPATING_INSTRUCTORS_VIEW_PARAM)
  return v === 'calendar' ? 'calendar' : 'list'
}

export interface ParticipatingInstructorsFilters {
  instructorName: string
  homeSido: string
  homeSigungu: string
  experienceYears: string
  evaluationGrade: string
  settlementStatus: string
}

const DEFAULT_FILTERS: ParticipatingInstructorsFilters = {
  instructorName: '',
  homeSido: '',
  homeSigungu: '',
  experienceYears: 'all',
  evaluationGrade: 'all',
  settlementStatus: 'all',
}

const FILTER_KEYS: (keyof ParticipatingInstructorsFilters)[] = [
  'instructorName',
  'homeSido',
  'homeSigungu',
  'experienceYears',
  'evaluationGrade',
  'settlementStatus',
]

const LEGACY_FILTER_KEYS = ['region', 'jaLectureExperience', 'educationAssignmentStatus'] as const

function readFiltersFromParams(searchParams: URLSearchParams): ParticipatingInstructorsFilters {
  return {
    instructorName: searchParams.get('instructorName') ?? DEFAULT_FILTERS.instructorName,
    homeSido: searchParams.get('homeSido') ?? DEFAULT_FILTERS.homeSido,
    homeSigungu: searchParams.get('homeSigungu') ?? DEFAULT_FILTERS.homeSigungu,
    experienceYears: searchParams.get('experienceYears') ?? DEFAULT_FILTERS.experienceYears,
    evaluationGrade: searchParams.get('evaluationGrade') ?? DEFAULT_FILTERS.evaluationGrade,
    settlementStatus: searchParams.get('settlementStatus') ?? DEFAULT_FILTERS.settlementStatus,
  }
}

function mergeFilterParams(
  next: URLSearchParams,
  merged: ParticipatingInstructorsFilters
): void {
  FILTER_KEYS.forEach(name => {
    const value = merged[name]
    const defaultValue = DEFAULT_FILTERS[name]
    if (value === '' || value === defaultValue) {
      next.delete(name)
    } else {
      next.set(name, value)
    }
  })
  LEGACY_FILTER_KEYS.forEach(key => next.delete(key))
}

export function useParticipatingInstructorsParams() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [appliedFilters, setAppliedFilters] = useState<ParticipatingInstructorsFilters>(() =>
    readFiltersFromParams(searchParams)
  )

  const filters = useMemo((): ParticipatingInstructorsFilters => {
    return readFiltersFromParams(searchParams)
  }, [searchParams])

  const setFilters = useCallback(
    (updates: Partial<ParticipatingInstructorsFilters>) => {
      const next = new URLSearchParams(searchParams)
      const merged: ParticipatingInstructorsFilters = {
        ...filters,
        ...updates,
      }
      mergeFilterParams(next, merged)
      setSearchParams(next, { replace: true })
    },
    [searchParams, setSearchParams, filters]
  )

  const setFilter = useCallback(
    (key: keyof ParticipatingInstructorsFilters, value: string) => {
      setFilters({ [key]: value })
    },
    [setFilters]
  )

  const viewMode = useMemo(
    (): ParticipatingInstructorsViewMode => parseViewMode(searchParams),
    [searchParams]
  )

  const setViewMode = useCallback(
    (mode: ParticipatingInstructorsViewMode) => {
      const next = new URLSearchParams(searchParams)
      if (mode === 'list') {
        next.delete(PARTICIPATING_INSTRUCTORS_VIEW_PARAM)
      } else {
        next.set(PARTICIPATING_INSTRUCTORS_VIEW_PARAM, 'calendar')
      }
      setSearchParams(next, { replace: true })
    },
    [searchParams, setSearchParams]
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

  /** 조회 버튼 클릭 시 전달한 값으로 URL 갱신 후 appliedFilters 반영 */
  const applyFilters = useCallback(
    (overrides?: Partial<ParticipatingInstructorsFilters>) => {
      const next = new URLSearchParams(searchParams)
      const merged: ParticipatingInstructorsFilters = {
        instructorName: overrides?.instructorName ?? filters.instructorName,
        homeSido: overrides?.homeSido ?? filters.homeSido,
        homeSigungu: overrides?.homeSigungu ?? filters.homeSigungu,
        experienceYears: overrides?.experienceYears ?? filters.experienceYears,
        evaluationGrade: overrides?.evaluationGrade ?? filters.evaluationGrade,
        settlementStatus: overrides?.settlementStatus ?? filters.settlementStatus,
      }
      mergeFilterParams(next, merged)
      setSearchParams(next, { replace: true })
      setAppliedFilters(merged)
    },
    [searchParams, setSearchParams, filters]
  )

  return {
    filters,
    appliedFilters,
    setFilters,
    setFilter,
    applyFilters,
    viewMode,
    setViewMode,
    progressCalendarGranularity,
    setProgressCalendarGranularity,
  }
}
