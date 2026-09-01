/**
 * 프로그램 진행현황 탭·필터 쿼리 파라미터 연동
 * - subTab: 참여 학교 정보(schools) | 강사 정보(instructors)
 * - 참여 학교 탭 필터: region, educationGrade, lectureRound, textbookStatus, teacherName
 * - 강사 정보 탭 필터: educationGrade, lectureRound, settlementStatus, teacherName
 */

import { useMemo, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'

const SUB_TAB_KEY = 'subTab'
const SUB_TAB_SCHOOLS = 'schools'
const SUB_TAB_INSTRUCTORS = 'instructors'
const VALID_SUB_TABS = [SUB_TAB_SCHOOLS, SUB_TAB_INSTRUCTORS] as const
export type ProgressSubTabKey = (typeof VALID_SUB_TABS)[number]

const FILTER_KEYS_SCHOOLS = [
  'schoolName',
  'region',
  'institutionSido',
  'institutionSigungu',
  'educationGrade',
  'lectureRound',
  'textbookStatus',
  'teacherName',
] as const

const FILTER_KEYS_INSTRUCTORS = [
  'educationGrade',
  'lectureRound',
  'settlementStatus',
  'teacherName',
] as const

export interface ProgressFilters {
  schoolName: string
  region: string
  institutionSido: string
  institutionSigungu: string
  educationGrade: string
  lectureRound: string
  textbookStatus: string
  settlementStatus: string
  teacherName: string
}

const DEFAULT_FILTERS: ProgressFilters = {
  schoolName: '',
  region: 'all',
  institutionSido: '',
  institutionSigungu: '',
  educationGrade: 'all',
  lectureRound: 'all',
  textbookStatus: 'all',
  settlementStatus: 'all',
  teacherName: '',
}

function parseSubTab(value: string | null): ProgressSubTabKey {
  if (value === SUB_TAB_SCHOOLS || value === SUB_TAB_INSTRUCTORS) return value
  return SUB_TAB_SCHOOLS
}

export function useProgramProgressParams() {
  const [searchParams, setSearchParams] = useSearchParams()

  const subTab = useMemo((): ProgressSubTabKey => {
    return parseSubTab(searchParams.get(SUB_TAB_KEY))
  }, [searchParams])

  const filters = useMemo((): ProgressFilters => {
    return {
      schoolName: searchParams.get('schoolName') ?? DEFAULT_FILTERS.schoolName,
      region: searchParams.get('region') ?? DEFAULT_FILTERS.region,
      institutionSido: searchParams.get('institutionSido') ?? DEFAULT_FILTERS.institutionSido,
      institutionSigungu:
        searchParams.get('institutionSigungu') ?? DEFAULT_FILTERS.institutionSigungu,
      educationGrade: searchParams.get('educationGrade') ?? DEFAULT_FILTERS.educationGrade,
      lectureRound: searchParams.get('lectureRound') ?? DEFAULT_FILTERS.lectureRound,
      textbookStatus: searchParams.get('textbookStatus') ?? DEFAULT_FILTERS.textbookStatus,
      settlementStatus: searchParams.get('settlementStatus') ?? DEFAULT_FILTERS.settlementStatus,
      teacherName: searchParams.get('teacherName') ?? DEFAULT_FILTERS.teacherName,
    }
  }, [searchParams])

  const setSubTab = useCallback(
    (key: ProgressSubTabKey) => {
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
    (updates: Partial<ProgressFilters>) => {
      const next = new URLSearchParams(searchParams)
      const keys = subTab === SUB_TAB_INSTRUCTORS ? FILTER_KEYS_INSTRUCTORS : FILTER_KEYS_SCHOOLS
      keys.forEach(name => {
        const value = updates[name as keyof ProgressFilters]
        if (value === undefined) return
        const defaultValue = DEFAULT_FILTERS[name as keyof ProgressFilters]
        if (value === '' || value === defaultValue) {
          next.delete(name)
        } else {
          next.set(name, value)
        }
      })
      setSearchParams(next, { replace: true })
    },
    [searchParams, setSearchParams, subTab]
  )

  const setFilter = useCallback(
    (key: keyof ProgressFilters, value: string) => {
      setFilters({ [key]: value })
    },
    [setFilters]
  )

  const resetFilters = useCallback(() => {
    const next = new URLSearchParams(searchParams)
    const keys = subTab === SUB_TAB_INSTRUCTORS ? FILTER_KEYS_INSTRUCTORS : FILTER_KEYS_SCHOOLS
    keys.forEach(name => next.delete(name))
    setSearchParams(next, { replace: true })
  }, [searchParams, setSearchParams, subTab])

  return {
    subTab,
    filters,
    setSubTab,
    setFilters,
    setFilter,
    resetFilters,
  }
}
