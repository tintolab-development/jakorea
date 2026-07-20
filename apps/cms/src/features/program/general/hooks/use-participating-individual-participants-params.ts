/**
 * 참여자(개인) 페이지(풀페이지 모달) 필터·뷰 쿼리 파라미터 연동
 */

import { useMemo, useCallback, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  PROGRESS_CALENDAR_RANGE_PARAM,
  parseCalendarRangeParam,
  applyCalendarRangeParam,
  type CalendarGranularity,
} from './progress-calendar-range'
import {
  DEFAULT_PARTICIPATING_INDIVIDUAL_PARTICIPANTS_FILTERS,
  type ParticipatingIndividualParticipantsFilters,
} from '../lib/participating-individual-participants-filter'

export const PARTICIPATING_PARTICIPANTS_VIEW_PARAM = 'participantView'

export type ParticipatingIndividualParticipantsViewMode = 'list' | 'calendar'

function parseViewMode(
  searchParams: URLSearchParams
): ParticipatingIndividualParticipantsViewMode {
  const v = searchParams.get(PARTICIPATING_PARTICIPANTS_VIEW_PARAM)
  return v === 'calendar' ? 'calendar' : 'list'
}

function readFiltersFromParams(
  searchParams: URLSearchParams
): ParticipatingIndividualParticipantsFilters {
  return {
    participantName:
      searchParams.get('participantName') ??
      DEFAULT_PARTICIPATING_INDIVIDUAL_PARTICIPANTS_FILTERS.participantName,
    educationGrade:
      searchParams.get('educationGrade') ??
      DEFAULT_PARTICIPATING_INDIVIDUAL_PARTICIPANTS_FILTERS.educationGrade,
    homeSido:
      searchParams.get('homeSido') ?? DEFAULT_PARTICIPATING_INDIVIDUAL_PARTICIPANTS_FILTERS.homeSido,
    homeSigungu:
      searchParams.get('homeSigungu') ??
      DEFAULT_PARTICIPATING_INDIVIDUAL_PARTICIPANTS_FILTERS.homeSigungu,
  }
}

const FILTER_KEYS: (keyof ParticipatingIndividualParticipantsFilters)[] = [
  'participantName',
  'educationGrade',
  'homeSido',
  'homeSigungu',
]

export function useParticipatingIndividualParticipantsParams() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [appliedFilters, setAppliedFilters] = useState<ParticipatingIndividualParticipantsFilters>(
    () => readFiltersFromParams(searchParams)
  )

  const filters = useMemo(
    (): ParticipatingIndividualParticipantsFilters => readFiltersFromParams(searchParams),
    [searchParams]
  )

  const setFilters = useCallback(
    (updates: Partial<ParticipatingIndividualParticipantsFilters>) => {
      const next = new URLSearchParams(searchParams)
      FILTER_KEYS.forEach(name => {
        const value = updates[name]
        if (value === undefined) return
        if (value === '' || value === DEFAULT_PARTICIPATING_INDIVIDUAL_PARTICIPANTS_FILTERS[name]) {
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
    (nextFilters: ParticipatingIndividualParticipantsFilters) => {
      setFilters(nextFilters)
      setAppliedFilters(nextFilters)
    },
    [setFilters]
  )

  const viewMode = useMemo(() => parseViewMode(searchParams), [searchParams])

  const setViewMode = useCallback(
    (mode: ParticipatingIndividualParticipantsViewMode) => {
      const next = new URLSearchParams(searchParams)
      if (mode === 'list') {
        next.delete(PARTICIPATING_PARTICIPANTS_VIEW_PARAM)
      } else {
        next.set(PARTICIPATING_PARTICIPANTS_VIEW_PARAM, mode)
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
