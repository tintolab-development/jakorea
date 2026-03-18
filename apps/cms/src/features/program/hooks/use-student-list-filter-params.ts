/**
 * 학생 명단 탭 필터 쿼리 파라미터 연동
 * schoolId 등과 함께 studentName, studentGender, studentClass 유지
 */

import { useMemo, useCallback, useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'

export interface StudentListFilterParams {
  studentName: string
  studentGender: string
  studentClass: string
}

const DEFAULT_PARAMS: StudentListFilterParams = {
  studentName: '',
  studentGender: 'all',
  studentClass: 'all',
}

const PARAM_KEYS: (keyof StudentListFilterParams)[] = [
  'studentName',
  'studentGender',
  'studentClass',
]

function readFromParams(searchParams: URLSearchParams): StudentListFilterParams {
  return {
    studentName: searchParams.get('studentName') ?? DEFAULT_PARAMS.studentName,
    studentGender: searchParams.get('studentGender') ?? DEFAULT_PARAMS.studentGender,
    studentClass: searchParams.get('studentClass') ?? DEFAULT_PARAMS.studentClass,
  }
}

export function useStudentListFilterParams() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [appliedFilters, setAppliedFilters] = useState<StudentListFilterParams>(() =>
    readFromParams(searchParams)
  )

  const filters = useMemo(
    () => readFromParams(searchParams),
    [searchParams]
  )

  useEffect(() => {
    setAppliedFilters(readFromParams(searchParams))
  }, [searchParams])

  const setFilters = useCallback(
    (updates: Partial<StudentListFilterParams>) => {
      const next = new URLSearchParams(searchParams)
      PARAM_KEYS.forEach(name => {
        const value = updates[name] ?? filters[name]
        const defaultValue = DEFAULT_PARAMS[name]
        if (value === '' || value === defaultValue) {
          next.delete(name)
        } else {
          next.set(name, value)
        }
      })
      setSearchParams(next, { replace: true })
    },
    [searchParams, setSearchParams, filters]
  )

  const setFilter = useCallback(
    (key: keyof StudentListFilterParams, value: string) => {
      setFilters({ [key]: value })
    },
    [setFilters]
  )

  /** 조회 버튼 클릭 시 현재 필터 값으로 URL 갱신 후 appliedFilters 반영 */
  const applyFilters = useCallback(
    (overrides?: Partial<StudentListFilterParams>) => {
      const next = new URLSearchParams(searchParams)
      const merged: StudentListFilterParams = {
        studentName: overrides?.studentName ?? filters.studentName,
        studentGender: overrides?.studentGender ?? filters.studentGender,
        studentClass: overrides?.studentClass ?? filters.studentClass,
      }
      PARAM_KEYS.forEach(name => {
        const value = merged[name]
        const defaultValue = DEFAULT_PARAMS[name]
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
