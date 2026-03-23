/**
 * 프로그램 진행현황 탭 - 참여 학교 목록 상태 관리 훅
 * schoolList state, 선택/삭제/상세 모달, 교재현황 변경, 필터링, 담당 강사진 표시
 */

import { useState, useMemo, useCallback } from 'react'
import { message } from 'antd'
import {
  MOCK_PARTICIPATING_SCHOOLS,
  type ParticipatingSchoolRow,
  type ParticipatingSchoolApprovalStatusKey,
  type TextbookStatusKey,
} from '@/data/mock/participating-schools'
import type { ParticipatingInstructorRow } from '@/data/mock/participating-instructors'
import { getInstructorRowsForSchool } from '../lib/school-detail-mock'
import type {
  SchoolDetailForModal,
  InstructorListFormInstructor,
} from '../model/school-detail-types'
import type { ProgressFilters } from './use-program-progress-params'

export interface UseProgressSchoolListOptions {
  appliedFilters: ProgressFilters
  instructorList: ParticipatingInstructorRow[]
}

export function useProgressSchoolList({
  appliedFilters,
  instructorList,
}: UseProgressSchoolListOptions) {
  const [schoolList, setSchoolList] = useState<ParticipatingSchoolRow[]>(() => [
    ...MOCK_PARTICIPATING_SCHOOLS,
  ])
  const [selectedSchoolRowKeys, setSelectedSchoolRowKeys] = useState<React.Key[]>([])
  const [selectedSchoolForDetail, setSelectedSchoolForDetail] =
    useState<ParticipatingSchoolRow | null>(null)
  const [schoolDetailModalOpen, setSchoolDetailModalOpen] = useState(false)
  const [schoolDeleteGuideOpen, setSchoolDeleteGuideOpen] = useState(false)
  const [savedBasicPatches, setSavedBasicPatches] = useState<
    Record<string, Partial<SchoolDetailForModal>>
  >({})
  const [savedInstructorPatches, setSavedInstructorPatches] = useState<
    Record<string, InstructorListFormInstructor[]>
  >({})

  const filteredSchools = useMemo(() => {
    return schoolList.filter(row => {
      const schoolNameKeyword = (appliedFilters.schoolName || '').trim()
      if (schoolNameKeyword) {
        const lower = schoolNameKeyword.toLowerCase()
        if (!row.schoolName.toLowerCase().includes(lower)) return false
      }
      if (
        appliedFilters.region &&
        appliedFilters.region !== 'all' &&
        !row.region.includes(appliedFilters.region)
      )
        return false
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
        appliedFilters.textbookStatus &&
        appliedFilters.textbookStatus !== 'all' &&
        row.textbookStatus !== appliedFilters.textbookStatus
      )
        return false
      const keyword = (appliedFilters.teacherName || '').trim()
      if (keyword) {
        const lower = keyword.toLowerCase()
        if (
          !row.teacherName.toLowerCase().includes(lower) &&
          !row.instructors.toLowerCase().includes(lower)
        )
          return false
      }
      return true
    })
  }, [schoolList, appliedFilters])

  const schoolNamesToDelete = useMemo(() => {
    const keysSet = new Set(selectedSchoolRowKeys.map(String))
    return schoolList.filter(row => keysSet.has(row.id)).map(row => row.schoolName)
  }, [selectedSchoolRowKeys, schoolList])

  const handleTextbookStatusChange = useCallback(
    (recordId: string, status: TextbookStatusKey) => {
      setSchoolList(prev =>
        prev.map(row => (row.id === recordId ? { ...row, textbookStatus: status } : row))
      )
    },
    []
  )

  const handleSchoolDeleteClick = useCallback(() => {
    if (selectedSchoolRowKeys.length === 0) {
      message.warning('삭제할 학교를 선택해 주세요.')
      return
    }
    setSchoolDeleteGuideOpen(true)
  }, [selectedSchoolRowKeys])

  const handleSchoolDeleteConfirm = useCallback(() => {
    const keysToDelete = new Set(selectedSchoolRowKeys.map(String))
    const count = keysToDelete.size
    setSchoolList(prev => prev.filter(row => !keysToDelete.has(row.id)))
    setSelectedSchoolRowKeys([])
    setSchoolDeleteGuideOpen(false)
    message.success(`${count}건의 학교가 삭제되었습니다.`)
  }, [selectedSchoolRowKeys])

  /** 선택 반려 확인 시: 선택된 참여 기관을 리스트에서 제거 */
  const handleBulkRejectConfirm = useCallback(() => {
    const keysSet = new Set(selectedSchoolRowKeys.map(String))
    const count = keysSet.size
    setSchoolList(prev => prev.filter(row => !keysSet.has(row.id)))
    setSelectedSchoolRowKeys([])
    message.success(`선택한 ${count}건의 참여 기관이 반려되어 목록에서 제거되었습니다.`)
  }, [selectedSchoolRowKeys])

  /** 선택 승인 확인 시: 선택된 참여 기관 approvalStatus → approved */
  const handleBulkApproveConfirm = useCallback(() => {
    const keysSet = new Set(selectedSchoolRowKeys.map(String))
    const count = keysSet.size
    setSchoolList(prev =>
      prev.map(row =>
        keysSet.has(row.id) ? { ...row, approvalStatus: 'approved' as ParticipatingSchoolApprovalStatusKey } : row
      )
    )
    setSelectedSchoolRowKeys([])
    message.success(`선택한 ${count}건의 참여 기관이 승인되었습니다.`)
  }, [selectedSchoolRowKeys])

  /** 학교 상세에서 승인 취소 확인 시: 해당 기관 approvalStatus → cancelled */
  const handleSchoolApprovalCancel = useCallback((schoolId: string) => {
    setSchoolList(prev =>
      prev.map(row =>
        row.id === schoolId
          ? { ...row, approvalStatus: 'cancelled' as ParticipatingSchoolApprovalStatusKey }
          : row
      )
    )
    message.success('프로그램 승인 현황이 [승인 취소]로 변경되었습니다.')
  }, [])

  /** 학교별 담당 강사진 표시 문자열 (저장 패치 우선, 없으면 참여 강사 목록에서 schoolName 기준) */
  const getInstructorDisplayForSchool = useCallback(
    (schoolId: string, schoolName: string): string => {
      const saved = savedInstructorPatches[schoolId]
      const names =
        saved !== undefined
          ? saved.map(i => i.instructorName)
          : instructorList
              .filter(r => r.schoolName === schoolName)
              .map(r => r.instructorName)
      if (names.length === 0) return '-'
      if (names.length <= 2) return names.join(', ')
      return `${names[0]} 외 ${names.length - 1}명`
    },
    [instructorList, savedInstructorPatches]
  )

  return {
    schoolList,
    setSchoolList,
    selectedSchoolRowKeys,
    setSelectedSchoolRowKeys,
    selectedSchoolForDetail,
    setSelectedSchoolForDetail,
    schoolDetailModalOpen,
    setSchoolDetailModalOpen,
    schoolDeleteGuideOpen,
    setSchoolDeleteGuideOpen,
    savedBasicPatches,
    setSavedBasicPatches,
    savedInstructorPatches,
    setSavedInstructorPatches,
    filteredSchools,
    schoolNamesToDelete,
    handleTextbookStatusChange,
    handleSchoolDeleteClick,
    handleSchoolDeleteConfirm,
    handleBulkRejectConfirm,
    handleBulkApproveConfirm,
    handleSchoolApprovalCancel,
    getInstructorDisplayForSchool,
    getInstructorRowsForSchool,
  }
}
