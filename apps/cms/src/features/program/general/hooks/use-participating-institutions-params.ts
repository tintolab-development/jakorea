/**
 * 참여 기관 페이지(풀페이지 모달) 필터 쿼리 파라미터 연동
 * lnb=progress&tab=institutions 일 때 기관명·소재지(시/도·시/군/구)·교재배송·학년·담당강사명
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
  institutionSido: string
  institutionSigungu: string
  educationGrade: string
  textbookStatus: string
  teacherName: string
}

const DEFAULT_FILTERS: ParticipatingInstitutionsFilters = {
  schoolName: '',
  institutionSido: '',
  institutionSigungu: '',
  educationGrade: 'all',
  textbookStatus: 'all',
  teacherName: '',
}

const FILTER_KEYS: (keyof ParticipatingInstitutionsFilters)[] = [
  'schoolName',
  'institutionSido',
  'institutionSigungu',
  'educationGrade',
  'textbookStatus',
  'teacherName',
]

function readFiltersFromParams(searchParams: URLSearchParams): ParticipatingInstitutionsFilters {
  const institutionSido = searchParams.get('institutionSido') ?? ''
  const institutionSigungu = searchParams.get('institutionSigungu') ?? ''
  /** 구 URL `region` 단일 키 호환 */
  const legacyRegion = searchParams.get('region') ?? ''
  const legacySido =
    legacyRegion && legacyRegion !== 'all' && !institutionSido ? legacyRegion : ''

  return {
    schoolName: searchParams.get('schoolName') ?? DEFAULT_FILTERS.schoolName,
    institutionSido: institutionSido || legacySido,
    institutionSigungu: institutionSigungu || DEFAULT_FILTERS.institutionSigungu,
    educationGrade: searchParams.get('educationGrade') ?? DEFAULT_FILTERS.educationGrade,
    textbookStatus: searchParams.get('textbookStatus') ?? DEFAULT_FILTERS.textbookStatus,
    teacherName: searchParams.get('teacherName') ?? DEFAULT_FILTERS.teacherName,
  }
}

function mergeFilterParams(
  next: URLSearchParams,
  merged: ParticipatingInstitutionsFilters
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
  next.delete('region')
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
      const merged: ParticipatingInstitutionsFilters = {
        ...filters,
        ...updates,
      }
      mergeFilterParams(next, merged)
      setSearchParams(next, { replace: true })
    },
    [searchParams, setSearchParams, filters]
  )

  const setFilter = useCallback(
    (key: keyof ParticipatingInstitutionsFilters, value: string) => {
      setFilters({ [key]: value })
    },
    [setFilters]
  )

  /** 조회 버튼 클릭 시 전달한 값으로 URL 갱신 후 appliedFilters 반영 */
  const applyFilters = useCallback(
    (overrides?: Partial<ParticipatingInstitutionsFilters>) => {
      const next = new URLSearchParams(searchParams)
      const merged: ParticipatingInstitutionsFilters = {
        schoolName: overrides?.schoolName ?? filters.schoolName,
        institutionSido: overrides?.institutionSido ?? filters.institutionSido,
        institutionSigungu: overrides?.institutionSigungu ?? filters.institutionSigungu,
        educationGrade: overrides?.educationGrade ?? filters.educationGrade,
        textbookStatus: overrides?.textbookStatus ?? filters.textbookStatus,
        teacherName: overrides?.teacherName ?? filters.teacherName,
      }
      mergeFilterParams(next, merged)
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
