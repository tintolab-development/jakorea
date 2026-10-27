/**
 * 학교 상세 > 학생 명단 탭 공통 섹션
 * 필터(학생명·성별·학급) + 디바이더 + 참여 학생 목록 총 n건 + 버튼 4개 + 테이블
 * 모달·풀페이지 뷰에서 재사용
 */

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type Key,
} from 'react'
import type { QueryKey } from '@tanstack/react-query'
import { useStudentListFilterParams } from '../../../hooks/use-student-list-filter-params'
import type { StudentListFilterParams } from '../../../hooks/use-student-list-filter-params'
import { Spin } from 'antd'
import { useForm, useFieldArray, Controller } from 'react-hook-form'
import {
  CmsInput,
  CmsPhoneInput,
  CmsRadio,
  CmsSelect,
  FilterTableLayout,
  FilterTableToolbarButton,
  useCmsAlert,
} from '@/shared/ui'
import { CmsDataTable } from '@/shared/ui/cms-data-table'
import { ConfirmModal } from '@/shared/ui/confirm-modal'
import {
  PROGRAM_EDIT_INFO_BUTTON_LABEL,
  PROGRAM_EDIT_INFO_BUTTON_PROPS,
} from '@/features/program/shared/lib/program-edit-info-button'
import { ProgramEditInfoActions } from '@/features/program/shared/ui/program-edit-info-actions'
import { CmsDateTextInput } from '@/shared/ui/date-text-input'
import type { ColumnsType } from 'antd/es/table'
import {
  STUDENT_CERTIFICATE_ISSUE_SELECT_ONE_ALERT_MESSAGE,
  STUDENT_CERTIFICATE_ISSUE_SELECT_ONLY_ONE_ALERT_MESSAGE,
  STUDENT_LIST_EDIT_MODE_BLOCKED_ALERT_MESSAGE,
  STUDENT_LIST_INFO_EDIT_COMING_SOON_ALERT_MESSAGE,
  STUDENT_PORTRAIT_CONSENT_DOWNLOAD_FAILED_ALERT_MESSAGE,
  STUDENT_PORTRAIT_CONSENT_NOT_SUBMITTED_ALERT_MESSAGE,
} from '@/shared/constants/messages'
import { formatLectureAttendanceCellDisplay } from '@/shared/lib/format-lecture-attendance-display'
import type {
  LectureAttendanceSession,
  SchoolDetailStudentRow,
  StudentListFormValues,
  StudentGenderKey,
} from '../../../model/school-detail-types'
import { formatStudentGenderLabel } from '../../../model/school-detail-types'
import {
  buildStudentEditVisibleRows,
  formValuesToRows,
  rowsToFormValues,
  type StudentEditTableRow,
} from '../../../lib/school-detail-student-list-form'
import {
  validateStudentRosterCommit,
  validateStudentRosterEditEntry,
} from '../../../lib/student-roster-commit-safety'
import {
  parseStudentRosterRevisionNo,
  resolveStudentRosterCommitErrorAlert,
  resolveStudentRosterManualCommitFailureAlert,
  type StudentRosterCommitSession,
} from '../../../lib/student-roster-revision'
import {
  getSchoolDetailStudents,
  getStudentLectureAttendanceSessions,
} from '../../../lib/school-detail'
import { useOrganizationStudentRosterRemote } from '../../../hooks/use-organization-student-roster-remote'
import { fetchOrganizationStudentRosterPrivacyDetail } from '../../../api/student-roster-api-client'
import { mapStudentRosterResponseToRows } from '../../../api/adapters/student-roster-adapters'
import { getGeneralProgramApiErrorMessage } from '../../../api/get-general-program-api-error'
import {
  fetchStudentLectureAttendanceByParticipantRemote,
  saveStudentLectureAttendanceByParticipantRemote,
} from '../../../api/student-lecture-attendance-api'
import {
  useIsTrainedTeachersProgramsSurface,
  useProgramProgressRemoteEnabledForSurface,
} from '@/features/program/1c-1s/lib/use-company-school-surface-remote'
import { shouldUseTrainedTeacherProgramsRemoteApi } from '@/features/program/trained-teachers/api/capabilities'
import { notifyProgramApiUnavailable } from '@/features/program/shared/lib/program-api-unavailable'
import type { LectureAttendanceDetail } from '../../../model/school-detail-types'
import {
  buildStudentAddGradeClassOptions,
  buildRegisteredGradeClassSelectOptions,
  buildStudentEditGradeClassOptions,
  formatStudentGradeClassColumnLabel,
} from '../../../lib/student-registered-grade-class-options'
import {
  buildStudentClassFilterOptionsFromRows,
  buildStudentListFilterFields,
  matchesStudentListFilters,
} from '../../../lib/student-list-filter-fields'
import type { GradeBlock } from '@/shared/api/generated/dashboard/schemas/gradeBlock'
import { lectureAttendanceStringFromSessions } from '../../../lib/lecture-attendance-from-sessions'
import {
  formatStudentBirthDateFromDigits,
  type AddStudentFormValues,
} from '../../../model/school-detail-add-student-schema'
import { LectureAttendanceModal } from '../../lecture-attendance-modal'
import { AddStudentModal } from '../../add-student-modal'
import { CertificateBulkIssueReasonModal } from '@/features/user/detail/ui/modal/certificate-bulk-issue-reason-modal'
import type { CertificateIssueReasonValue } from '@/features/user/detail/ui/modal/certificate-bulk-issue-reason-modal'
import { FormCertificatePdfExportOverlay } from '@/pages/templates/form-certificate-pdf-export-overlay'
import { handleError } from '@/shared/utils/error-handler'
import { buildStudentCertificateDownloadContext } from '../../../lib/build-student-certificate-issuance'
import type { StudentCertificateDownloadContext } from '../../../lib/build-student-certificate-issuance'
import {
  isWithinStudentCertificateIssuancePeriod,
  resolveStudentCertificateKind,
} from '../../../lib/resolve-student-certificate-kind'
import { resolveOrganizationPortraitConsentDownload } from '../../../lib/student-portrait-consent'
import { fetchOrganizationPortraitConsentRemote } from '../../../api/portrait-consent-api-client'
import { downloadAdminFile } from '@/shared/lib/admin-file-upload'
import { StudentCertificatePdfExportHost } from './student-certificate-pdf-export-host'
import './school-detail-modal.css'
import './school-detail-student-list-section.css'
import {
  STUDENT_LIST_TABLE_COL_MIN_WIDTHS,
  STUDENT_LIST_TABLE_SCROLL_X,
  studentListTableDataColumnSize,
  studentListTableWidthStyle,
} from './school-detail-student-list-table'

import { ButtonCheckIcon, ButtonDownloadIcon } from '@/shared/ui/icons/ButtonIcons'

const STUDENT_ROSTER_EDIT_UNMASK_REASON = '정보 수정'

const STUDENT_ROSTER_EDIT_UNMASK_CONFIRM_CONTENT =
  "정보 수정 시 개인정보 마스킹이 해제되며,\n개인정보 열람 사유는 '정보 수정'으로 로그 이력에 기록됩니다.\n해당 학생명단의 개인정보 열람 및 정보를 수정하시겠습니까?"

const STUDENT_ROSTER_EDIT_UNMASK_MODAL_Z_INDEX = 1100

const STUDENT_GENDER_EDIT_OPTIONS = [
  { value: 'male', label: '남' },
  { value: 'female', label: '여' },
] as const

function StudentListEditCell({ children }: { children: React.ReactNode }) {
  return <div className="school-detail-student-list-section__edit-cell">{children}</div>
}

export interface SchoolDetailStudentListSectionProps {
  schoolId: string
  studentCount: number
  /** @deprecated 학급 Select는 `registeredGradeBlocks` 기준. 목록 상단 요약용으로만 유지 */
  classCount?: number
  /** 기관 신청 상세 `gradeBlocks` — 등록 학급 SSOT */
  registeredGradeBlocks?: GradeBlock[] | null
  schoolName?: string
  educationGrade?: string
  /**
   * 기관 신청 ID — 있으면 `GET/PUT …/student-roster` remote 연동.
   * 없으면 빈 목록 + API unavailable 안내.
   */
  organizationApplicationId?: string | number | null
  /** 고유번호 발급 키 — 없으면 다운로드 API가 400 */
  programId?: string | number
  /** 과제·설문 제출 내역 모달 설명에 사용하는 프로그램명 */
  programTitle?: string
  programStartDate?: Date | string | null
  programEndDate?: Date | string | null
  /** 프로그램 참여 신청일 — 발급 가능 기한(3년) 산정 */
  participationAppliedAt?: Date | string | null
  /** 학생 만족도조사 운영 여부 (공통 정보 > 설문 진행 항목) */
  hasStudentSatisfactionSurvey?: boolean
  /** 풀페이지 등에서 상단에 이미 정보 수정/개인정보 상세보기 있을 때 버튼만 숨기거나 콜백으로 위임 */
  readOnly?: boolean
  /**
   * true면 `readOnly`가 아닐 때도 「정보 수정」 클릭 시 명단 편집 모드 대신 준비 중 AlertModal만 표시
   * (참여 기관 풀페이지 학생 명단 탭 등)
   */
  studentListInfoEditComingSoonAlert?: boolean
  /** 명단 저장 후 함께 무효화할 유형별 기관 신청 상세 키 — 미지정 시 일반 기관 상세만 */
  rosterDependentQueryKeys?: readonly QueryKey[]
  onIssueCertificates?: () => void
  onEditInfo?: () => void
  onAddStudent?: () => void
  onViewDetail?: () => void
  onSaveEdit?: (students: SchoolDetailStudentRow[]) => void
}

export function SchoolDetailStudentListSection({
  schoolId,
  studentCount,
  classCount: _classCount,
  registeredGradeBlocks = null,
  schoolName = '',
  educationGrade = '',
  organizationApplicationId = null,
  programId,
  programTitle = 'JA Korea 경제교육 프로그램',
  programStartDate = null,
  programEndDate = null,
  participationAppliedAt = null,
  hasStudentSatisfactionSurvey = true,
  readOnly = false,
  studentListInfoEditComingSoonAlert = false,
  rosterDependentQueryKeys,
  onIssueCertificates: _onIssueCertificates,
  onEditInfo,
  onAddStudent,
  onViewDetail: _onViewDetail,
  onSaveEdit,
}: SchoolDetailStudentListSectionProps) {
  const { filters, appliedFilters, applyFilters } = useStudentListFilterParams()
  const [pendingFilters, setPendingFilters] = useState<StudentListFilterParams>(() => ({
    ...filters,
  }))
  const [selectedStudentKeys, setSelectedStudentKeys] = useState<Key[]>([])

  useEffect(() => {
    setPendingFilters({ ...filters })
  }, [filters])
  const [isStudentListEditMode, setIsStudentListEditMode] = useState(false)
  const [addedStudents, setAddedStudents] = useState<SchoolDetailStudentRow[]>([])
  const [lectureAttendanceModalOpen, setLectureAttendanceModalOpen] = useState(false)
  const [lectureAttendanceStudent, setLectureAttendanceStudent] =
    useState<SchoolDetailStudentRow | null>(null)
  const [lectureAttendanceRemoteDetail, setLectureAttendanceRemoteDetail] = useState<
    LectureAttendanceDetail | null | undefined
  >(undefined)
  const [lectureAttendanceRemoteLoading, setLectureAttendanceRemoteLoading] = useState(false)
  const [lectureAttendanceSaving, setLectureAttendanceSaving] = useState(false)
  const [attendanceSessionsByStudentId, setAttendanceSessionsByStudentId] = useState<
    Record<string, LectureAttendanceSession[]>
  >({})
  const [addStudentModalOpen, setAddStudentModalOpen] = useState(false)
  const [editUnmaskConfirmOpen, setEditUnmaskConfirmOpen] = useState(false)
  const [editUnmaskConfirmLoading, setEditUnmaskConfirmLoading] = useState(false)
  const [unmaskedRosterRows, setUnmaskedRosterRows] = useState<SchoolDetailStudentRow[] | null>(
    null
  )
  const [certificateIssueModalOpen, setCertificateIssueModalOpen] = useState(false)
  const [certificateExportContext, setCertificateExportContext] =
    useState<StudentCertificateDownloadContext | null>(null)
  const [certificateExportActive, setCertificateExportActive] = useState(false)
  const [portraitConsentDownloading, setPortraitConsentDownloading] = useState(false)
  /** 정보 수정 세션 — GET 재조회로 revision이 바뀌어도 PUT 기준은 고정 */
  const rosterEditSessionRef = useRef<StudentRosterCommitSession | null>(null)
  /** 학생 추가 모달 세션 */
  const rosterAddSessionRef = useRef<StudentRosterCommitSession | null>(null)
  const { showAlert } = useCmsAlert()

  const isTrainedTeachersSurface = useIsTrainedTeachersProgramsSurface()
  const rosterRemote = useOrganizationStudentRosterRemote({
    organizationApplicationId,
    educationGrade,
    dependentQueryKeys: rosterDependentQueryKeys,
    trainedTeachersSurface: isTrainedTeachersSurface,
  })
  const generalProgressRemoteEnabled = useProgramProgressRemoteEnabledForSurface(
    programId != null ? String(programId) : undefined
  )
  const progressRemoteEnabled =
    generalProgressRemoteEnabled ||
    (isTrainedTeachersSurface && programId != null && shouldUseTrainedTeacherProgramsRemoteApi())

  const showStudentListEditModeBlockedAlert = useCallback(
    () => showAlert({ title: '안내', content: STUDENT_LIST_EDIT_MODE_BLOCKED_ALERT_MESSAGE }),
    [showAlert]
  )

  const studentList = useMemo(() => {
    if (rosterRemote.remoteEnabled) return unmaskedRosterRows ?? rosterRemote.students
    return getSchoolDetailStudents(schoolId, studentCount)
  }, [
    rosterRemote.remoteEnabled,
    rosterRemote.students,
    schoolId,
    studentCount,
    unmaskedRosterRows,
  ])

  useEffect(() => {
    if (!rosterRemote.remoteEnabled) return
    setAddedStudents([])
  }, [rosterRemote.remoteEnabled, rosterRemote.students])

  const organizationApplicationKey =
    organizationApplicationId != null ? String(organizationApplicationId) : ''

  const mergedStudentList = useMemo(() => {
    const patchRow = (row: SchoolDetailStudentRow): SchoolDetailStudentRow => {
      const saved = attendanceSessionsByStudentId[row.id]
      if (!saved?.length) return row
      return {
        ...row,
        lectureAttendance: lectureAttendanceStringFromSessions(saved),
      }
    }
    return [...studentList.map(patchRow), ...addedStudents.map(patchRow)]
  }, [studentList, addedStudents, attendanceSessionsByStudentId])
  const filteredStudentList = useMemo(
    () => mergedStudentList.filter(row => matchesStudentListFilters(row, appliedFilters)),
    [mergedStudentList, appliedFilters]
  )

  const handleCertificateIssueClick = useCallback(() => {
    if (isStudentListEditMode) {
      showStudentListEditModeBlockedAlert()
      return
    }

    const selectedCount = selectedStudentKeys.length
    if (selectedCount === 0) {
      showAlert({ title: '안내', content: STUDENT_CERTIFICATE_ISSUE_SELECT_ONE_ALERT_MESSAGE })
      return
    }
    if (selectedCount > 1) {
      showAlert({ title: '안내', content: STUDENT_CERTIFICATE_ISSUE_SELECT_ONLY_ONE_ALERT_MESSAGE })
      return
    }
    if (certificateExportActive) return
    if (!isWithinStudentCertificateIssuancePeriod(participationAppliedAt)) {
      return
    }

    setCertificateIssueModalOpen(true)
  }, [
    certificateExportActive,
    isStudentListEditMode,
    participationAppliedAt,
    selectedStudentKeys,
    showAlert,
    showStudentListEditModeBlockedAlert,
  ])

  const handleCertificateIssueModalCancel = useCallback(() => {
    setCertificateIssueModalOpen(false)
  }, [])

  const handleCertificateIssueConfirm = useCallback(
    (_reason: CertificateIssueReasonValue, reasonLabel: string) => {
      const selectedId = String(selectedStudentKeys[0])
      const student = mergedStudentList.find(row => row.id === selectedId)
      if (student == null) return

      const sessions = getStudentLectureAttendanceSessions(
        student,
        schoolId,
        attendanceSessionsByStudentId[student.id]
      )
      const certificateKind = resolveStudentCertificateKind({
        sessions,
        satisfactionSurveyRequired: hasStudentSatisfactionSurvey,
        satisfactionSurveyCompleted: student.satisfactionSurveyCompleted === true,
      })

      setCertificateExportContext(
        buildStudentCertificateDownloadContext({
          student,
          certificateKind,
          schoolName,
          educationGrade,
          programTitle,
          programStartDate,
          programEndDate,
          issuanceReasonLabel: reasonLabel,
          ...(programId != null ? { programId } : {}),
        })
      )
      setCertificateExportActive(true)
    },
    [
      attendanceSessionsByStudentId,
      educationGrade,
      hasStudentSatisfactionSurvey,
      mergedStudentList,
      programEndDate,
      programId,
      programStartDate,
      programTitle,
      schoolId,
      schoolName,
      selectedStudentKeys,
    ]
  )

  const handleCertificateExportComplete = useCallback((success: boolean) => {
    setCertificateExportContext(null)
    setCertificateExportActive(false)
    if (!success) {
      handleError(new Error('student certificate pdf export failed'), {
        context: 'schoolDetailStudentListSection.certificateDownload',
      })
    }
  }, [])

  const handlePortraitConsentConfirmClick = useCallback(() => {
    if (isStudentListEditMode) {
      showStudentListEditModeBlockedAlert()
      return
    }
    if (portraitConsentDownloading) return
    if (!organizationApplicationKey) {
      notifyProgramApiUnavailable('student-list-portrait-consent', '초상권 동의서 확인')
      return
    }

    void (async () => {
      setPortraitConsentDownloading(true)
      try {
        const consent = await fetchOrganizationPortraitConsentRemote(organizationApplicationKey)
        const download = resolveOrganizationPortraitConsentDownload(consent)
        if (download == null) {
          showAlert({
            title: '안내',
            content: STUDENT_PORTRAIT_CONSENT_NOT_SUBMITTED_ALERT_MESSAGE,
          })
          return
        }
        await downloadAdminFile(download)
      } catch (error) {
        handleError(error, {
          context: 'schoolDetailStudentListSection.portraitConsentFileDownload',
        })
        showAlert({
          title: '안내',
          content: STUDENT_PORTRAIT_CONSENT_DOWNLOAD_FAILED_ALERT_MESSAGE,
        })
      } finally {
        setPortraitConsentDownloading(false)
      }
    })()
  }, [
    isStudentListEditMode,
    organizationApplicationKey,
    portraitConsentDownloading,
    showAlert,
    showStudentListEditModeBlockedAlert,
  ])

  const handleFilterChange = useCallback(
    (key: string, value: unknown) => {
      if (isStudentListEditMode) {
        showStudentListEditModeBlockedAlert()
        return
      }
      if (key === 'studentName') {
        setPendingFilters(prev => ({ ...prev, studentName: String(value ?? '') }))
        return
      }
      if (key === 'studentGender') {
        const next = value == null || value === '' || value === 'all' ? 'all' : String(value)
        setPendingFilters(prev => ({ ...prev, studentGender: next }))
        return
      }
      if (key === 'studentClass') {
        const next = value == null || value === '' || value === 'all' ? 'all' : String(value)
        setPendingFilters(prev => ({ ...prev, studentClass: next }))
      }
    },
    [isStudentListEditMode, showStudentListEditModeBlockedAlert]
  )

  const handleFilterSearch = useCallback(() => {
    if (isStudentListEditMode) {
      showStudentListEditModeBlockedAlert()
      return
    }
    applyFilters(pendingFilters)
  }, [applyFilters, pendingFilters, isStudentListEditMode, showStudentListEditModeBlockedAlert])

  const filterTableValues = useMemo(
    () => ({
      studentName: pendingFilters.studentName,
      studentGender: pendingFilters.studentGender === 'all' ? '' : pendingFilters.studentGender,
      studentClass: pendingFilters.studentClass === 'all' ? '' : pendingFilters.studentClass,
    }),
    [pendingFilters]
  )

  const rosterGradeClassFallbackOptions = useMemo(
    () => buildStudentClassFilterOptionsFromRows(mergedStudentList),
    [mergedStudentList]
  )

  const registeredGradeClassOptions = useMemo(
    () => buildRegisteredGradeClassSelectOptions(registeredGradeBlocks, educationGrade),
    [registeredGradeBlocks, educationGrade]
  )

  /** 상단 검색 필터 — 명단에 실제 존재하는 학급만 */
  const studentListFilterGradeClassOptions = rosterGradeClassFallbackOptions

  const addStudentGradeClassOptions = useMemo(
    () =>
      buildStudentAddGradeClassOptions({
        registeredOptions: registeredGradeClassOptions,
        rosterFallbackOptions: rosterGradeClassFallbackOptions,
      }),
    [registeredGradeClassOptions, rosterGradeClassFallbackOptions]
  )

  const studentListFilterFields = useMemo(
    () => buildStudentListFilterFields(studentListFilterGradeClassOptions),
    [studentListFilterGradeClassOptions]
  )

  const studentListForm = useForm<StudentListFormValues>({
    defaultValues: { students: [] },
  })
  const { control, reset, watch, getValues, formState } = studentListForm
  const { isDirty } = formState
  useFieldArray({ control, name: 'students' })

  useEffect(() => {
    setIsStudentListEditMode(false)
    reset({ students: [] })
    setAddedStudents([])
    setSelectedStudentKeys([])
    rosterEditSessionRef.current = null
    rosterAddSessionRef.current = null
    setUnmaskedRosterRows(null)
    setEditUnmaskConfirmOpen(false)
  }, [organizationApplicationKey, schoolId, reset])

  const rosterCommitGuardContext = useMemo(
    () => ({
      remoteEnabled: rosterRemote.remoteEnabled,
      isLoading: rosterRemote.isLoading,
      isError: rosterRemote.isError,
      totalCount: rosterRemote.totalCount,
      baselineRows: mergedStudentList,
    }),
    [
      mergedStudentList,
      rosterRemote.isError,
      rosterRemote.isLoading,
      rosterRemote.remoteEnabled,
      rosterRemote.totalCount,
    ]
  )

  const enterStudentListEditMode = useCallback(
    (snapshot?: { rows: SchoolDetailStudentRow[]; revisionNo?: number | null }) => {
      const rows = snapshot?.rows ?? mergedStudentList
      const revisionNo =
        snapshot?.revisionNo !== undefined ? snapshot.revisionNo : rosterRemote.revisionNo
      const entryCheck = validateStudentRosterEditEntry({
        remoteEnabled: rosterRemote.remoteEnabled,
        isLoading: rosterRemote.isLoading,
        isError: rosterRemote.isError,
        baselineRows: rows,
        totalCount: rosterRemote.totalCount,
        revisionNo,
      })
      if (!entryCheck.ok) {
        showAlert({ title: '안내', content: entryCheck.message })
        return
      }
      if (rosterRemote.remoteEnabled && organizationApplicationKey) {
        rosterEditSessionRef.current = {
          organizationApplicationId: organizationApplicationKey,
          expectedRevisionNo: revisionNo!,
        }
      } else {
        rosterEditSessionRef.current = null
      }
      reset(rowsToFormValues(rows))
      setIsStudentListEditMode(true)
    },
    [
      mergedStudentList,
      organizationApplicationKey,
      reset,
      rosterRemote.isError,
      rosterRemote.isLoading,
      rosterRemote.remoteEnabled,
      rosterRemote.revisionNo,
      rosterRemote.totalCount,
      showAlert,
    ]
  )

  const handleStudentListCancel = useCallback(() => {
    reset(rowsToFormValues(mergedStudentList))
    setIsStudentListEditMode(false)
    rosterEditSessionRef.current = null
  }, [mergedStudentList, reset])

  const handleStudentListSave = useCallback(async () => {
    if (rosterRemote.isCommitting) return

    const values = getValues()
    const rows = formValuesToRows(values.students ?? [])

    const editSession = rosterEditSessionRef.current
    const commitCheck = validateStudentRosterCommit({
      ...rosterCommitGuardContext,
      commitRows: rows,
      expectedRevisionNo: rosterRemote.remoteEnabled ? editSession?.expectedRevisionNo : undefined,
    })
    if (!commitCheck.ok) {
      showAlert({ title: '저장할 수 없음', content: commitCheck.message })
      return
    }

    if (rosterRemote.remoteEnabled) {
      if (!editSession || editSession.organizationApplicationId !== organizationApplicationKey) {
        showAlert({
          title: '저장할 수 없음',
          content: '학생 명단 편집 세션이 만료되었습니다. 정보 수정을 다시 시작해 주세요.',
        })
        return
      }
      try {
        await rosterRemote.commitRows({
          rows,
          expectedRevisionNo: editSession.expectedRevisionNo,
        })
        rosterEditSessionRef.current = null
        setUnmaskedRosterRows(null)
        setSelectedStudentKeys([])
        setIsStudentListEditMode(false)
        onSaveEdit?.(rows)
      } catch (error) {
        const conflictAlert = resolveStudentRosterCommitErrorAlert(error)
        if (conflictAlert) {
          void rosterRemote.refetch()
          showAlert(conflictAlert)
          return
        }
        showAlert(resolveStudentRosterManualCommitFailureAlert(error))
      }
      return
    }
    onSaveEdit?.(rows)
    setIsStudentListEditMode(false)
  }, [
    getValues,
    onSaveEdit,
    organizationApplicationKey,
    rosterCommitGuardContext,
    rosterRemote,
    showAlert,
  ])

  const handleOpenAddStudentModal = useCallback(() => {
    if (isStudentListEditMode) {
      showStudentListEditModeBlockedAlert()
      return
    }
    const entryCheck = validateStudentRosterEditEntry({
      remoteEnabled: rosterRemote.remoteEnabled,
      isLoading: rosterRemote.isLoading,
      isError: rosterRemote.isError,
      baselineRows: studentList,
      totalCount: rosterRemote.totalCount,
      revisionNo: rosterRemote.revisionNo,
    })
    if (!entryCheck.ok) {
      showAlert({ title: '안내', content: entryCheck.message })
      return
    }
    if (rosterRemote.remoteEnabled && organizationApplicationKey) {
      rosterAddSessionRef.current = {
        organizationApplicationId: organizationApplicationKey,
        expectedRevisionNo: rosterRemote.revisionNo!,
        baselineRows: [...studentList],
      }
    } else {
      rosterAddSessionRef.current = null
    }
    setAddStudentModalOpen(true)
  }, [
    isStudentListEditMode,
    organizationApplicationKey,
    rosterRemote.isError,
    rosterRemote.isLoading,
    rosterRemote.remoteEnabled,
    rosterRemote.revisionNo,
    rosterRemote.totalCount,
    showAlert,
    showStudentListEditModeBlockedAlert,
    studentList,
  ])

  const handleAddStudent = useCallback(
    async (values: AddStudentFormValues) => {
      const nextNo = mergedStudentList.length + 1
      const newRow: SchoolDetailStudentRow = {
        id: `draft-student-${crypto.randomUUID()}`,
        no: nextNo,
        name: values.name,
        gender: values.gender,
        birthDate: formatStudentBirthDateFromDigits(values.birthDate),
        gradeClass: values.gradeClass,
        contact: values.contact?.trim() || undefined,
        email: values.email?.trim() || undefined,
        notes: values.notes?.trim() || undefined,
      }

      if (rosterRemote.remoteEnabled) {
        const addSession = rosterAddSessionRef.current
        const baselineRows = addSession?.baselineRows ?? studentList
        try {
          const nextRows = [...baselineRows, newRow].map((row, index) => ({
            ...row,
            no: index + 1,
          }))
          const addCheck = validateStudentRosterCommit({
            remoteEnabled: true,
            isLoading: rosterRemote.isLoading,
            isError: rosterRemote.isError,
            totalCount: rosterRemote.totalCount,
            baselineRows,
            commitRows: nextRows,
            expectedRevisionNo: addSession?.expectedRevisionNo,
            disallowExistingRowDrop: true,
          })
          if (!addCheck.ok) {
            showAlert({ title: '등록할 수 없음', content: addCheck.message })
            return
          }
          if (!addSession || addSession.organizationApplicationId !== organizationApplicationKey) {
            showAlert({
              title: '등록할 수 없음',
              content: '학생 추가 세션이 만료되었습니다. 모달을 닫고 다시 시도해 주세요.',
            })
            return
          }
          await rosterRemote.commitRows({
            rows: nextRows,
            expectedRevisionNo: addSession.expectedRevisionNo,
          })
          rosterAddSessionRef.current = null
          setSelectedStudentKeys([])
          setAddStudentModalOpen(false)
          onAddStudent?.()
        } catch (error) {
          const conflictAlert = resolveStudentRosterCommitErrorAlert(error)
          if (conflictAlert) {
            void rosterRemote.refetch()
            showAlert(conflictAlert)
            return
          }
          showAlert({
            ...resolveStudentRosterManualCommitFailureAlert(error),
            title: '등록 실패',
          })
        }
        return
      }

      setAddedStudents(prev => [...prev, newRow])
      setAddStudentModalOpen(false)
      onAddStudent?.()
    },
    [
      mergedStudentList.length,
      onAddStudent,
      organizationApplicationKey,
      rosterRemote,
      showAlert,
      studentList,
    ]
  )

  const watchedFormStudents = watch('students') ?? []

  const editModeVisibleRows = useMemo(() => {
    if (!isStudentListEditMode) return []
    return buildStudentEditVisibleRows({
      formStudents: watchedFormStudents,
      rosterRows: mergedStudentList,
      appliedFilters,
    })
  }, [appliedFilters, isStudentListEditMode, mergedStudentList, watchedFormStudents])

  const openLectureAttendance = useCallback(
    async (record: SchoolDetailStudentRow) => {
      setLectureAttendanceStudent(record)
      setLectureAttendanceModalOpen(true)
      setLectureAttendanceRemoteDetail(null)
      setLectureAttendanceRemoteLoading(false)

      const programIdValue = programId != null ? String(programId) : ''
      const participantId = record.participantId

      if (!progressRemoteEnabled || !programIdValue || participantId == null) {
        notifyProgramApiUnavailable(
          'general-student-lecture-attendance',
          '참여 기관 · 학생 강의 출석 내역'
        )
        return
      }

      setLectureAttendanceRemoteLoading(true)
      try {
        const detail = await fetchStudentLectureAttendanceByParticipantRemote({
          programId: programIdValue,
          participantId,
          studentName: record.name,
          organizationApplicationId: organizationApplicationKey,
        })
        setLectureAttendanceRemoteDetail(detail)
        setAttendanceSessionsByStudentId(prev => ({
          ...prev,
          [record.id]: detail.sessions.map(session => ({ ...session })),
        }))
      } catch (error) {
        console.debug('student lecture attendance fetch failed', error)
        setLectureAttendanceRemoteDetail(null)
        showAlert({
          title: '조회 실패',
          content: '강의 출석 내역을 불러오지 못했습니다. 다시 시도해 주세요.',
        })
      } finally {
        setLectureAttendanceRemoteLoading(false)
      }
    },
    [organizationApplicationKey, programId, progressRemoteEnabled, showAlert]
  )

  const handleSaveLectureAttendance = useCallback(
    async (sessions: LectureAttendanceSession[]) => {
      const student = lectureAttendanceStudent
      if (!student) return

      const programIdValue = programId != null ? String(programId) : ''
      const participantId = student.participantId

      if (!progressRemoteEnabled || !programIdValue || participantId == null) {
        notifyProgramApiUnavailable(
          'general-student-lecture-attendance-save',
          '참여 기관 · 학생 출석 정정'
        )
        return
      }

      setLectureAttendanceSaving(true)
      try {
        await saveStudentLectureAttendanceByParticipantRemote({
          programId: programIdValue,
          participantId,
          sessions,
        })
        const refreshed = await fetchStudentLectureAttendanceByParticipantRemote({
          programId: programIdValue,
          participantId,
          studentName: student.name,
          organizationApplicationId: organizationApplicationKey,
        })
        setLectureAttendanceRemoteDetail(refreshed)
        setAttendanceSessionsByStudentId(prev => ({
          ...prev,
          [student.id]: refreshed.sessions.map(session => ({ ...session })),
        }))
        showAlert({
          title: '출석 정정 완료',
          content: '출석 정보가 저장되었습니다.',
        })
      } catch (error) {
        console.debug('student lecture attendance save failed', error)
        showAlert({
          title: '저장 실패',
          content: '출석 정정 저장에 실패했습니다. 다시 시도해 주세요.',
        })
      } finally {
        setLectureAttendanceSaving(false)
      }
    },
    [lectureAttendanceStudent, organizationApplicationKey, programId, progressRemoteEnabled, showAlert]
  )

  const handleEditInfoClick = useCallback(() => {
    if (studentListInfoEditComingSoonAlert) {
      showAlert({ title: '안내', content: STUDENT_LIST_INFO_EDIT_COMING_SOON_ALERT_MESSAGE })
      return
    }
    if (isStudentListEditMode) {
      if (isDirty) {
        void handleStudentListSave()
      } else {
        handleStudentListCancel()
      }
    } else if (rosterRemote.remoteEnabled && unmaskedRosterRows == null) {
      const entryCheck = validateStudentRosterEditEntry({
        remoteEnabled: true,
        isLoading: rosterRemote.isLoading,
        isError: rosterRemote.isError,
        baselineRows: studentList,
        totalCount: rosterRemote.totalCount,
        revisionNo: rosterRemote.revisionNo,
      })
      if (!entryCheck.ok) {
        showAlert({ title: '안내', content: entryCheck.message })
        return
      }
      setEditUnmaskConfirmOpen(true)
    } else {
      enterStudentListEditMode()
    }
  }, [
    studentListInfoEditComingSoonAlert,
    isStudentListEditMode,
    isDirty,
    handleStudentListSave,
    handleStudentListCancel,
    enterStudentListEditMode,
    rosterRemote.isError,
    rosterRemote.isLoading,
    rosterRemote.remoteEnabled,
    rosterRemote.revisionNo,
    rosterRemote.totalCount,
    showAlert,
    studentList,
    unmaskedRosterRows,
  ])

  const closeEditUnmaskConfirm = useCallback(() => {
    if (editUnmaskConfirmLoading) return
    setEditUnmaskConfirmOpen(false)
  }, [editUnmaskConfirmLoading])

  const confirmEditUnmaskAndStartEdit = useCallback(() => {
    if (editUnmaskConfirmLoading || !organizationApplicationKey) return
    setEditUnmaskConfirmLoading(true)
    void fetchOrganizationStudentRosterPrivacyDetail(
      organizationApplicationKey,
      STUDENT_ROSTER_EDIT_UNMASK_REASON
    )
      .then(response => {
        const rows = mapStudentRosterResponseToRows(response)
        const revisionNo =
          parseStudentRosterRevisionNo(response.revisionNo) ?? rosterRemote.revisionNo
        const entryCheck = validateStudentRosterEditEntry({
          remoteEnabled: true,
          isLoading: false,
          isError: false,
          baselineRows: rows,
          totalCount: response.totalCount ?? rosterRemote.totalCount,
          revisionNo,
        })
        if (!entryCheck.ok) {
          showAlert({ title: '안내', content: entryCheck.message })
          return
        }
        setUnmaskedRosterRows(rows)
        setEditUnmaskConfirmOpen(false)
        enterStudentListEditMode({ rows, revisionNo })
      })
      .catch(error => {
        showAlert({
          title: '열람 실패',
          content: getGeneralProgramApiErrorMessage(error, '개인정보 원문 조회에 실패했습니다.'),
        })
      })
      .finally(() => {
        setEditUnmaskConfirmLoading(false)
      })
  }, [
    editUnmaskConfirmLoading,
    enterStudentListEditMode,
    organizationApplicationKey,
    rosterRemote.revisionNo,
    rosterRemote.totalCount,
    showAlert,
  ])

  const displayCount = isStudentListEditMode
    ? editModeVisibleRows.length
    : filteredStudentList.length

  const studentListToolbarActions = (
    <div className="school-detail-student-list-section__toolbar-actions program-application-list-toolbar">
      <FilterTableToolbarButton
        variant="secondary"
        icon={<ButtonCheckIcon />}
        disabled={portraitConsentDownloading}
        onClick={handlePortraitConsentConfirmClick}
      >
        초상권 동의 확인
      </FilterTableToolbarButton>
      <FilterTableToolbarButton
        variant="secondary"
        icon={<ButtonDownloadIcon />}
        disabled={certificateExportActive}
        onClick={handleCertificateIssueClick}
      >
        수료증/참여인증서 발급
      </FilterTableToolbarButton>
      {!readOnly ? (
        <>
          <ProgramEditInfoActions
            useToolbarButton
            isEditing={isStudentListEditMode}
            idleVariant="secondary"
            saving={rosterRemote.isCommitting}
            onEdit={handleEditInfoClick}
            onCancel={handleStudentListCancel}
            onSave={() => {
              void handleStudentListSave()
            }}
          />
          <FilterTableToolbarButton variant="primary" onClick={handleOpenAddStudentModal}>
            학생 추가
          </FilterTableToolbarButton>
        </>
      ) : (
        <>
          {onEditInfo && (
            <FilterTableToolbarButton
              variant={PROGRAM_EDIT_INFO_BUTTON_PROPS.variant}
              onClick={onEditInfo}
            >
              {PROGRAM_EDIT_INFO_BUTTON_LABEL}
            </FilterTableToolbarButton>
          )}
          {onAddStudent && (
            <FilterTableToolbarButton variant="primary" onClick={onAddStudent}>
              학생 추가
            </FilterTableToolbarButton>
          )}
        </>
      )}
    </div>
  )

  const studentTableRowSelection = useMemo(
    () => ({
      selectedRowKeys: selectedStudentKeys,
      onChange: (keys: Key[]) => {
        if (isStudentListEditMode) {
          showStudentListEditModeBlockedAlert()
          return
        }
        setSelectedStudentKeys(keys)
      },
      columnWidth: STUDENT_LIST_TABLE_COL_MIN_WIDTHS[0],
    }),
    [selectedStudentKeys, isStudentListEditMode, showStudentListEditModeBlockedAlert]
  )

  const studentColumnsView: ColumnsType<SchoolDetailStudentRow> = useMemo(
    () => [
      {
        title: 'No.',
        dataIndex: 'no',
        key: 'no',
        align: 'center',
        ...studentListTableDataColumnSize(0),
      },
      {
        title: '학생명',
        dataIndex: 'name',
        key: 'name',
        align: 'center',
        ...studentListTableDataColumnSize(1),
      },
      {
        title: '성별',
        dataIndex: 'gender',
        key: 'gender',
        align: 'center',
        ...studentListTableDataColumnSize(2),
        render: (_value: StudentGenderKey | undefined, record: SchoolDetailStudentRow) =>
          formatStudentGenderLabel(record.gender, record.genderMask),
      },
      {
        title: '생년월일',
        dataIndex: 'birthDate',
        key: 'birthDate',
        align: 'center',
        ...studentListTableDataColumnSize(3),
        render: (v: string | undefined) => v ?? '-',
      },
      {
        title: '학급',
        dataIndex: 'gradeClass',
        key: 'gradeClass',
        align: 'center',
        ...studentListTableDataColumnSize(4),
        render: (value: string | undefined) => formatStudentGradeClassColumnLabel(value),
      },
      {
        title: '연락처',
        dataIndex: 'contact',
        key: 'contact',
        align: 'center',
        ...studentListTableDataColumnSize(5),
        render: (v: string | undefined) => v ?? '-',
      },
      {
        title: '이메일',
        dataIndex: 'email',
        key: 'email',
        align: 'center',
        ellipsis: true,
        ...studentListTableDataColumnSize(6),
        render: (v: string | undefined) => v ?? '-',
      },
      {
        title: '비고',
        dataIndex: 'notes',
        key: 'notes',
        align: 'center',
        ellipsis: true,
        ...studentListTableDataColumnSize(7),
        render: (v: string | undefined) => v?.trim() || '-',
      },
      {
        title: '강의 출석 내역',
        dataIndex: 'lectureAttendance',
        key: 'lectureAttendance',
        align: 'center',
        ...studentListTableDataColumnSize(8),
        onCell: () => ({ className: 'school-detail-modal__td-lecture-attendance' }),
        render: (v: string | undefined, record: SchoolDetailStudentRow) => (
          <button
            type="button"
            className="school-detail-modal__link-button"
            onClick={() => openLectureAttendance(record)}
          >
            {formatLectureAttendanceCellDisplay(v)}
          </button>
        ),
      },
    ],
    [openLectureAttendance]
  )

  const studentColumnsEdit: ColumnsType<StudentEditTableRow> = useMemo(
    () => [
      {
        title: 'No.',
        dataIndex: 'no',
        key: 'no',
        align: 'center',
        ...studentListTableDataColumnSize(0),
      },
      {
        title: '학생명',
        key: 'name',
        align: 'center',
        ...studentListTableDataColumnSize(1),
        render: (_: unknown, record: StudentEditTableRow) => (
          <Controller
            control={control}
            name={`students.${record.formIndex}.name`}
            render={({ field }) => (
              <StudentListEditCell>
                <CmsInput {...field} inputSize="small" width="100%" />
              </StudentListEditCell>
            )}
          />
        ),
      },
      {
        title: '성별',
        key: 'gender',
        align: 'center',
        ...studentListTableDataColumnSize(2),
        render: (_: unknown, record: StudentEditTableRow) => (
          <Controller
            control={control}
            name={`students.${record.formIndex}.gender`}
            render={({ field }) => (
              <StudentListEditCell>
                <CmsRadio.Group
                  {...field}
                  size="medium"
                  options={[...STUDENT_GENDER_EDIT_OPTIONS]}
                  className="school-detail-student-list-section__gender-radios"
                />
              </StudentListEditCell>
            )}
          />
        ),
      },
      {
        title: '생년월일',
        key: 'birthDate',
        align: 'center',
        ...studentListTableDataColumnSize(3),
        render: (_: unknown, record: StudentEditTableRow) => (
          <Controller
            control={control}
            name={`students.${record.formIndex}.birthDate`}
            render={({ field }) => (
              <StudentListEditCell>
                <CmsDateTextInput
                  value={field.value ?? ''}
                  onValueChange={value => {
                    const digits = value.replace(/\D/g, '')
                    field.onChange(
                      digits.length === 8 ? formatStudentBirthDateFromDigits(digits) : value
                    )
                  }}
                  onBlur={field.onBlur}
                  name={field.name}
                  ref={field.ref}
                  inputSize="small"
                  width="100%"
                  placeholder="YYYY. MM. DD."
                  maxLength={10}
                />
              </StudentListEditCell>
            )}
          />
        ),
      },
      {
        title: '학급',
        key: 'gradeClass',
        align: 'center',
        ...studentListTableDataColumnSize(4),
        render: (_: unknown, record: StudentEditTableRow) => (
          <Controller
            control={control}
            name={`students.${record.formIndex}.gradeClass`}
            render={({ field }) => (
              <StudentListEditCell>
                <CmsSelect
                  {...field}
                  inputSize="small"
                  width="100%"
                  withAllOption={false}
                  options={buildStudentEditGradeClassOptions({
                    registeredOptions: registeredGradeClassOptions,
                    studentGradeClass: field.value ?? '',
                    educationGrade,
                    rosterFallbackOptions: rosterGradeClassFallbackOptions,
                  })}
                  getPopupContainer={() => document.body}
                />
              </StudentListEditCell>
            )}
          />
        ),
      },
      {
        title: '연락처',
        key: 'contact',
        align: 'center',
        ...studentListTableDataColumnSize(5),
        render: (_: unknown, record: StudentEditTableRow) => (
          <Controller
            control={control}
            name={`students.${record.formIndex}.contact`}
            render={({ field }) => (
              <StudentListEditCell>
                <CmsPhoneInput
                  {...field}
                  value={field.value ?? ''}
                  inputSize="small"
                  width="100%"
                  placeholder="010-1234-5678"
                />
              </StudentListEditCell>
            )}
          />
        ),
      },
      {
        title: '이메일',
        key: 'email',
        align: 'center',
        ...studentListTableDataColumnSize(6),
        render: (_: unknown, record: StudentEditTableRow) => (
          <Controller
            control={control}
            name={`students.${record.formIndex}.email`}
            render={({ field }) => (
              <StudentListEditCell>
                <CmsInput {...field} inputSize="small" width="100%" />
              </StudentListEditCell>
            )}
          />
        ),
      },
      {
        title: '비고',
        key: 'notes',
        align: 'center',
        ...studentListTableDataColumnSize(7),
        render: (_: unknown, record: StudentEditTableRow) => (
          <Controller
            control={control}
            name={`students.${record.formIndex}.notes`}
            render={({ field }) => (
              <StudentListEditCell>
                <CmsInput {...field} inputSize="small" width="100%" />
              </StudentListEditCell>
            )}
          />
        ),
      },
      {
        title: '강의 출석 내역',
        dataIndex: 'lectureAttendance',
        key: 'lectureAttendance',
        align: 'center',
        ...studentListTableDataColumnSize(8),
        onCell: () => ({ className: 'school-detail-modal__td-lecture-attendance' }),
        render: (v: string | undefined) => (
          <button
            type="button"
            className="school-detail-modal__link-button"
            onClick={showStudentListEditModeBlockedAlert}
          >
            {formatLectureAttendanceCellDisplay(v)}
          </button>
        ),
      },
    ],
    [
      control,
      educationGrade,
      registeredGradeClassOptions,
      rosterGradeClassFallbackOptions,
      showStudentListEditModeBlockedAlert,
    ]
  )

  return (
    <div
      className={[
        'school-detail-student-list-section',
        isStudentListEditMode && 'school-detail-student-list-section--edit-mode',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <FilterTableLayout
        className="school-detail-student-list-section__filter-layout"
        bordered={false}
        fields={studentListFilterFields}
        filters={filterTableValues}
        onFilterChange={handleFilterChange}
        onSearch={handleFilterSearch}
        title="참여 학생 목록"
        description={`총 ${displayCount}건`}
        actions={studentListToolbarActions}
        excelExport={{
          columns: studentColumnsView,
          data: filteredStudentList,
        }}
      >
        <div
          className="school-detail-student-list-section__table-wrap"
          style={studentListTableWidthStyle() as CSSProperties}
        >
          {rosterRemote.isLoading && filteredStudentList.length === 0 ? (
            <div className="detail-fullpage-modal__loading" role="status">
              <Spin size="large" />
            </div>
          ) : isStudentListEditMode ? (
            <CmsDataTable
              rowKey="id"
              size="middle"
              pagination={false}
              rowSelection={studentTableRowSelection}
              scroll={{ x: STUDENT_LIST_TABLE_SCROLL_X }}
              tableLayout="fixed"
              columns={studentColumnsEdit}
              dataSource={editModeVisibleRows}
              className="school-detail-modal__student-table school-detail-modal__student-table--edit cms-data-table cms-data-table--skip-auto-no-col"
            />
          ) : (
            <CmsDataTable<SchoolDetailStudentRow>
              rowKey="id"
              size="middle"
              pagination={false}
              rowSelection={studentTableRowSelection}
              scroll={{ x: STUDENT_LIST_TABLE_SCROLL_X }}
              tableLayout="fixed"
              columns={studentColumnsView}
              dataSource={filteredStudentList}
              className="school-detail-modal__student-table cms-data-table cms-data-table--skip-auto-no-col"
            />
          )}
        </div>
      </FilterTableLayout>

      <LectureAttendanceModal
        open={lectureAttendanceModalOpen}
        onCancel={() => {
          setLectureAttendanceModalOpen(false)
          setLectureAttendanceStudent(null)
          setLectureAttendanceRemoteDetail(undefined)
          setLectureAttendanceRemoteLoading(false)
        }}
        student={lectureAttendanceStudent}
        schoolId={schoolId}
        zIndex={1200}
        remoteDetail={lectureAttendanceRemoteDetail}
        remoteDetailLoading={lectureAttendanceRemoteLoading || lectureAttendanceSaving}
        savedSessions={
          lectureAttendanceStudent?.id
            ? attendanceSessionsByStudentId[lectureAttendanceStudent.id]
            : undefined
        }
        onSaveAttendance={sessions => {
          void handleSaveLectureAttendance(sessions)
        }}
      />
      <AddStudentModal
        open={addStudentModalOpen}
        onCancel={() => setAddStudentModalOpen(false)}
        onAdd={handleAddStudent}
        gradeClassOptions={addStudentGradeClassOptions}
      />
      <ConfirmModal
        open={editUnmaskConfirmOpen}
        title="정보 수정 안내"
        content={STUDENT_ROSTER_EDIT_UNMASK_CONFIRM_CONTENT}
        confirmText="정보 수정"
        cancelText="취소"
        onConfirm={confirmEditUnmaskAndStartEdit}
        onCancel={closeEditUnmaskConfirm}
        confirmLoading={editUnmaskConfirmLoading}
        zIndex={STUDENT_ROSTER_EDIT_UNMASK_MODAL_Z_INDEX}
      />
      <CertificateBulkIssueReasonModal
        open={certificateIssueModalOpen}
        onCancel={handleCertificateIssueModalCancel}
        applicationIds={selectedStudentKeys.length === 1 ? [String(selectedStudentKeys[0])] : []}
        onIssue={handleCertificateIssueConfirm}
      />
      <FormCertificatePdfExportOverlay visible={certificateExportActive} />
      {certificateExportContext != null ? (
        <StudentCertificatePdfExportHost
          key={`${certificateExportContext.student.id}-${certificateExportContext.certificateKind}-${certificateExportContext.issuanceReasonLabel}`}
          context={certificateExportContext}
          onComplete={handleCertificateExportComplete}
        />
      ) : null}
    </div>
  )
}
