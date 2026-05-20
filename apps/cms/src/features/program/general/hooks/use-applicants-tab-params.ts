/**
 * 프로그램 상세 - 신청자 목록 탭·필터 쿼리 파라미터 연동
 * - subTab: 신청 학교(schools) | 신청 강사(instructors)
 * - 신청 학교 필터: schoolName, region, educationGrade, teacherName, approvalStatus
 * - 조회 버튼 클릭 시에만 appliedFilters 반영 (탭 내부 state)
 */

import { useMemo, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'

const SUB_TAB_KEY = 'subTab'
const SUB_TAB_SCHOOLS = 'schools'
const SUB_TAB_INSTRUCTORS = 'instructors'
const VALID_SUB_TABS = [SUB_TAB_SCHOOLS, SUB_TAB_INSTRUCTORS] as const
export type ApplicantsSubTabKey = (typeof VALID_SUB_TABS)[number]

const FILTER_KEYS_SCHOOLS = [
  'schoolName',
  'region',
  'educationGrade',
  'teacherName',
  'approvalStatus',
] as const

const FILTER_KEYS_INSTRUCTORS = ['schoolName', 'instructorName', 'approvalStatus'] as const

export interface ApplicantsFilters {
  schoolName: string
  region: string
  educationGrade: string
  teacherName: string
  approvalStatus: string
  /** 신청 강사 탭 필터 */
  instructorName: string
}

const DEFAULT_FILTERS: ApplicantsFilters = {
  schoolName: 'all',
  region: 'all',
  educationGrade: 'all',
  teacherName: 'all',
  approvalStatus: 'all',
  instructorName: 'all',
}

function parseSubTab(value: string | null): ApplicantsSubTabKey {
  if (value === SUB_TAB_SCHOOLS || value === SUB_TAB_INSTRUCTORS) return value
  return SUB_TAB_SCHOOLS
}

export function useApplicantsTabParams() {
  const [searchParams, setSearchParams] = useSearchParams()

  const subTab = useMemo((): ApplicantsSubTabKey => {
    return parseSubTab(searchParams.get(SUB_TAB_KEY))
  }, [searchParams])

  const filters = useMemo((): ApplicantsFilters => {
    return {
      schoolName: searchParams.get('schoolName') ?? DEFAULT_FILTERS.schoolName,
      region: searchParams.get('region') ?? DEFAULT_FILTERS.region,
      educationGrade: searchParams.get('educationGrade') ?? DEFAULT_FILTERS.educationGrade,
      teacherName: searchParams.get('teacherName') ?? DEFAULT_FILTERS.teacherName,
      approvalStatus: searchParams.get('approvalStatus') ?? DEFAULT_FILTERS.approvalStatus,
      instructorName: searchParams.get('instructorName') ?? DEFAULT_FILTERS.instructorName,
    }
  }, [searchParams])

  const setSubTab = useCallback(
    (key: ApplicantsSubTabKey) => {
      const next = new URLSearchParams(searchParams)
      if (key === SUB_TAB_SCHOOLS) {
        next.delete(SUB_TAB_KEY)
      } else {
        next.set(SUB_TAB_KEY, key)
      }
      setSearchParams(next, { replace: true })
    },
    [searchParams, setSearchParams]
  )

  const setFilters = useCallback(
    (updates: Partial<ApplicantsFilters>) => {
      const next = new URLSearchParams(searchParams)
      const keys =
        searchParams.get(SUB_TAB_KEY) === SUB_TAB_INSTRUCTORS
          ? FILTER_KEYS_INSTRUCTORS
          : FILTER_KEYS_SCHOOLS
      keys.forEach(name => {
        const value = updates[name as keyof ApplicantsFilters]
        if (value === undefined) return
        const defaultValue = DEFAULT_FILTERS[name as keyof ApplicantsFilters]
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
    (key: keyof ApplicantsFilters, value: string) => {
      setFilters({ [key]: value })
    },
    [setFilters]
  )

  return {
    subTab,
    filters,
    setSubTab,
    setFilters,
    setFilter,
  }
}
