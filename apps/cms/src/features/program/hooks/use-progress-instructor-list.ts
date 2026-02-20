/**
 * 프로그램 진행현황 탭 - 참여 강사 목록 상태 관리 훅
 * instructorList state (localStorage 지속), 선택/추가/삭제/상세 모달, 정산현황 변경, 필터링
 */

import { useState, useMemo, useCallback, useEffect } from 'react'
import { message } from 'antd'
import {
  MOCK_PARTICIPATING_INSTRUCTORS,
  type ParticipatingInstructorRow,
  type SettlementStatusKey,
} from '@/data/mock/participating-instructors'
import {
  buildInstructorRowFromForm,
  type AddInstructorFormValues,
} from '../ui/add-instructor-modal'
import type { ProgressFilters } from './use-program-progress-params'

const INSTRUCTOR_LIST_STORAGE_KEY = 'cms-program-progress-instructors'

function loadInstructorListFromStorage(): ParticipatingInstructorRow[] | null {
  try {
    const raw = localStorage.getItem(INSTRUCTOR_LIST_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return null
    const valid = parsed.every(
      (r: unknown) =>
        r != null &&
        typeof r === 'object' &&
        typeof (r as ParticipatingInstructorRow).id === 'string' &&
        typeof (r as ParticipatingInstructorRow).instructorName === 'string'
    )
    return valid ? (parsed as ParticipatingInstructorRow[]) : null
  } catch {
    return null
  }
}

function saveInstructorListToStorage(list: ParticipatingInstructorRow[]) {
  try {
    localStorage.setItem(INSTRUCTOR_LIST_STORAGE_KEY, JSON.stringify(list))
  } catch {
    // ignore
  }
}

export interface UseProgressInstructorListOptions {
  appliedFilters: ProgressFilters
}

/** localStorage에서 로드한 행에 상세·이력서 등 확장 필드가 없을 수 있으므로 mock과 id 기준으로 병합 */
function mergeWithMock(list: ParticipatingInstructorRow[]): ParticipatingInstructorRow[] {
  const mockById = new Map(MOCK_PARTICIPATING_INSTRUCTORS.map(m => [m.id, m]))
  return list.map(row => {
    const extended = mockById.get(row.id)
    return extended ? { ...row, ...extended } : row
  })
}

export function useProgressInstructorList({ appliedFilters }: UseProgressInstructorListOptions) {
  const [instructorList, setInstructorList] = useState<ParticipatingInstructorRow[]>(() => {
    const stored = loadInstructorListFromStorage()
    const list = stored ?? [...MOCK_PARTICIPATING_INSTRUCTORS]
    return stored ? mergeWithMock(list) : list
  })
  const [selectedInstructorRowKeys, setSelectedInstructorRowKeys] = useState<React.Key[]>([])
  const [selectedInstructorForDetail, setSelectedInstructorForDetail] =
    useState<ParticipatingInstructorRow | null>(null)
  const [instructorDetailModalOpen, setInstructorDetailModalOpen] = useState(false)
  const [addInstructorModalOpen, setAddInstructorModalOpen] = useState(false)
  const [instructorDeleteGuideOpen, setInstructorDeleteGuideOpen] = useState(false)

  useEffect(() => {
    saveInstructorListToStorage(instructorList)
  }, [instructorList])

  const filteredInstructors = useMemo(() => {
    return instructorList.filter(row => {
      if (
        appliedFilters.educationGrade &&
        appliedFilters.educationGrade !== 'all' &&
        row.educationGrade !== appliedFilters.educationGrade
      )
        return false
      if (
        appliedFilters.lectureRound &&
        appliedFilters.lectureRound !== 'all' &&
        row.lectureRound !== appliedFilters.lectureRound
      )
        return false
      if (
        appliedFilters.settlementStatus &&
        appliedFilters.settlementStatus !== 'all' &&
        row.settlementStatus !== appliedFilters.settlementStatus
      )
        return false
      const keyword = (appliedFilters.teacherName || '').trim()
      if (keyword) {
        const lower = keyword.toLowerCase()
        if (
          !row.instructorName.toLowerCase().includes(lower) &&
          !row.teacherName.toLowerCase().includes(lower)
        )
          return false
      }
      return true
    })
  }, [instructorList, appliedFilters])

  const instructorNamesToDelete = useMemo(() => {
    const keysSet = new Set(selectedInstructorRowKeys.map(String))
    return instructorList.filter(row => keysSet.has(row.id)).map(row => row.instructorName)
  }, [selectedInstructorRowKeys, instructorList])

  const handleAddInstructor = useCallback(
    (values: AddInstructorFormValues) => {
      const nextNo =
        instructorList.length > 0 ? Math.max(...instructorList.map(r => r.no)) + 1 : 1
      const nextId = `instructor-new-${Date.now()}`
      const newRow = buildInstructorRowFromForm(values, nextNo, nextId)
      setInstructorList(prev => [newRow, ...prev])
      message.success('강사가 추가되었습니다.')
    },
    [instructorList]
  )

  const handleSettlementStatusChange = useCallback(
    (recordId: string, status: SettlementStatusKey) => {
      setInstructorList(prev =>
        prev.map(row => (row.id === recordId ? { ...row, settlementStatus: status } : row))
      )
      message.success('정산 현황이 변경되었습니다.')
    },
    []
  )

  const handleInstructorDeleteClick = useCallback(() => {
    if (selectedInstructorRowKeys.length === 0) {
      message.warning('삭제할 강사를 선택해 주세요.')
      return
    }
    setInstructorDeleteGuideOpen(true)
  }, [selectedInstructorRowKeys])

  const handleInstructorDeleteConfirm = useCallback(() => {
    const keysToDelete = new Set(selectedInstructorRowKeys.map(String))
    const count = keysToDelete.size
    setInstructorList(prev => prev.filter(row => !keysToDelete.has(row.id)))
    setSelectedInstructorRowKeys([])
    setInstructorDeleteGuideOpen(false)
    message.success(`${count}명의 강사가 삭제되었습니다.`)
  }, [selectedInstructorRowKeys])

  return {
    instructorList,
    setInstructorList,
    selectedInstructorRowKeys,
    setSelectedInstructorRowKeys,
    selectedInstructorForDetail,
    setSelectedInstructorForDetail,
    instructorDetailModalOpen,
    setInstructorDetailModalOpen,
    addInstructorModalOpen,
    setAddInstructorModalOpen,
    instructorDeleteGuideOpen,
    setInstructorDeleteGuideOpen,
    filteredInstructors,
    instructorNamesToDelete,
    handleAddInstructor,
    handleSettlementStatusChange,
    handleInstructorDeleteClick,
    handleInstructorDeleteConfirm,
  }
}
