/**
 * 참여 봉사자 페이지(풀페이지 모달) 필터·뷰 쿼리 파라미터 연동
 */

import { useMemo, useCallback, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  PROGRESS_CALENDAR_RANGE_PARAM,
  parseCalendarRangeParam,
  applyCalendarRangeParam,
  type CalendarGranularity,
} from './progress-calendar-range'
import type { ParticipatingVolunteersFilters } from '../lib/participating-volunteers-filter'
import { DEFAULT_PARTICIPATING_VOLUNTEERS_FILTERS } from '../lib/participating-volunteers-filter'

export const PARTICIPATING_VOLUNTEERS_VIEW_PARAM = 'volunteerView'

export type ParticipatingVolunteersViewMode = 'list' | 'calendar'

function parseViewMode(searchParams: URLSearchParams): ParticipatingVolunteersViewMode {
  const v = searchParams.get(PARTICIPATING_VOLUNTEERS_VIEW_PARAM)
  return v === 'calendar' ? 'calendar' : 'list'
}

function readFiltersFromParams(searchParams: URLSearchParams): ParticipatingVolunteersFilters {
  return {
    volunteerName: searchParams.get('volunteerName') ?? DEFAULT_PARTICIPATING_VOLUNTEERS_FILTERS.volunteerName,
    id1365: searchParams.get('id1365') ?? DEFAULT_PARTICIPATING_VOLUNTEERS_FILTERS.id1365,
  }
}

export function useParticipatingVolunteersParams() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [appliedFilters, setAppliedFilters] = useState<ParticipatingVolunteersFilters>(() =>
    readFiltersFromParams(searchParams)
  )

  const filters = useMemo((): ParticipatingVolunteersFilters => {
    return readFiltersFromParams(searchParams)
  }, [searchParams])

  const FILTER_KEYS: (keyof ParticipatingVolunteersFilters)[] = ['volunteerName', 'id1365']

  const setFilters = useCallback(
    (updates: Partial<ParticipatingVolunteersFilters>) => {
      const next = new URLSearchParams(searchParams)
      FILTER_KEYS.forEach(name => {
        const value = updates[name]
        if (value === undefined) return
        if (value === '' || value === DEFAULT_PARTICIPATING_VOLUNTEERS_FILTERS[name]) {
          next.delete(name)
        } else {
          next.set(name, value)
        }
      })
      setSearchParams(next, { replace: true })
    },
    [searchParams, setSearchParams]
  )

  const applyFilters = useCallback(
    (nextFilters: ParticipatingVolunteersFilters) => {
      setFilters(nextFilters)
      setAppliedFilters(nextFilters)
    },
    [setFilters]
  )

  const viewMode = useMemo(() => parseViewMode(searchParams), [searchParams])

  const setViewMode = useCallback(
    (mode: ParticipatingVolunteersViewMode) => {
      const next = new URLSearchParams(searchParams)
      if (mode === 'list') {
        next.delete(PARTICIPATING_VOLUNTEERS_VIEW_PARAM)
      } else {
        next.set(PARTICIPATING_VOLUNTEERS_VIEW_PARAM, mode)
      }
      setSearchParams(next, { replace: true })
    },
    [searchParams, setSearchParams]
  )

  const progressCalendarGranularity = useMemo(
    (): CalendarGranularity =>
      parseCalendarRangeParam(searchParams, PROGRESS_CALENDAR_RANGE_PARAM),
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
    applyFilters,
    viewMode,
    setViewMode,
    progressCalendarGranularity,
    setProgressCalendarGranularity,
  }
}
