/**
 * 참여 강사 페이지(풀페이지 모달) 필터 쿼리 파라미터 연동
 * lnb=progress&tab=instructors 일 때 강사명·거주지역·JA강의이력·JA평가등급·교육예정현황
 */

import { useMemo, useCallback, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

export interface ParticipatingInstructorsFilters {
  instructorName: string
  region: string
  jaLectureExperience: string
  jaEvaluationGrade: string
  educationAssignmentStatus: string
}

const DEFAULT_FILTERS: ParticipatingInstructorsFilters = {
  instructorName: '',
  region: 'all',
  jaLectureExperience: 'all',
  jaEvaluationGrade: 'all',
  educationAssignmentStatus: 'all',
}

function readFiltersFromParams(searchParams: URLSearchParams): ParticipatingInstructorsFilters {
  return {
    instructorName: searchParams.get('instructorName') ?? DEFAULT_FILTERS.instructorName,
    region: searchParams.get('region') ?? DEFAULT_FILTERS.region,
    jaLectureExperience:
      searchParams.get('jaLectureExperience') ?? DEFAULT_FILTERS.jaLectureExperience,
    jaEvaluationGrade:
      searchParams.get('jaEvaluationGrade') ?? DEFAULT_FILTERS.jaEvaluationGrade,
    educationAssignmentStatus:
      searchParams.get('educationAssignmentStatus') ?? DEFAULT_FILTERS.educationAssignmentStatus,
  }
}

export function useParticipatingInstructorsParams() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [appliedFilters, setAppliedFilters] = useState<ParticipatingInstructorsFilters>(() =>
    readFiltersFromParams(searchParams)
  )

  const filters = useMemo((): ParticipatingInstructorsFilters => {
    return readFiltersFromParams(searchParams)
  }, [searchParams])

  const FILTER_KEYS: (keyof ParticipatingInstructorsFilters)[] = [
    'instructorName',
    'region',
    'jaLectureExperience',
    'jaEvaluationGrade',
    'educationAssignmentStatus',
  ]

  const setFilters = useCallback(
    (updates: Partial<ParticipatingInstructorsFilters>) => {
      const next = new URLSearchParams(searchParams)
      FILTER_KEYS.forEach(name => {
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
    (key: keyof ParticipatingInstructorsFilters, value: string) => {
      setFilters({ [key]: value })
    },
    [setFilters]
  )

  /** 조회 버튼 클릭 시 전달한 값으로 URL 갱신 후 appliedFilters 반영 */
  const applyFilters = useCallback(
    (overrides?: Partial<ParticipatingInstructorsFilters>) => {
      const next = new URLSearchParams(searchParams)
      const merged: ParticipatingInstructorsFilters = {
        instructorName: overrides?.instructorName ?? filters.instructorName,
        region: overrides?.region ?? filters.region,
        jaLectureExperience:
          overrides?.jaLectureExperience ?? filters.jaLectureExperience,
        jaEvaluationGrade: overrides?.jaEvaluationGrade ?? filters.jaEvaluationGrade,
        educationAssignmentStatus:
          overrides?.educationAssignmentStatus ?? filters.educationAssignmentStatus,
      }
      FILTER_KEYS.forEach(name => {
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

  return {
    filters,
    appliedFilters,
    setFilters,
    setFilter,
    applyFilters,
  }
}
