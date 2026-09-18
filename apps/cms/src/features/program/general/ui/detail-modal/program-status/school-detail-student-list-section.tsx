/**
 * 학교 상세 > 학생 명단 탭 공통 섹션
 * 필터(학생명·성별·학급) + 디바이더 + 참여 학생 목록 총 n건 + 버튼 4개 + 테이블
 * 모달·풀페이지 뷰에서 재사용
 */

import { useCallback, useEffect, useMemo, useRef, useState, type Key } from 'react'
import { useStudentListFilterParams } from '../../../hooks/use-student-list-filter-params'
import type { StudentListFilterParams } from '../../../hooks/use-student-list-filter-params'
import { CheckOutlined, DownloadOutlined } from '@ant-design/icons'
import { Spin, Table } from 'antd'
import { useForm, useFieldArray, Controller } from 'react-hook-form'
import { CmsButton, CmsInput, CmsRadio, CmsSelect, FilterTableLayout, useCmsAlert, CMS_CERTIFICATE_ISSUE_BUTTON_WIDTH } from '@/shared/ui'
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
  STUDENT_PORTRAIT_CONSENT_SELECT_ONE_ALERT_MESSAGE,
} from '@/shared/constants/messages'
import { formatLectureAttendanceCellDisplay } from '@/shared/lib/format-lecture-attendance-display'
import type {
  LectureAttendanceSession,
  SchoolDetailStudentRow,
  StudentListFormValues,
  StudentListFormStudent,
  StudentGenderKey,
} from '../../../model/school-detail-types'
import { STUDENT_GENDER_LABELS } from '../../../model/school-detail-types'
import { getSchoolDetailStudents, getStudentLectureAttendanceSessions } from '../../../lib/school-detail'
import { useOrganizationStudentRosterRemote } from '../../../hooks/use-organization-student-roster-remote'
import {
  fetchStudentLectureAttendanceByParticipantRemote,
  saveStudentLectureAttendanceByParticipantRemote,
} from '../../../api/student-lecture-attendance-api'
import { useProgramProgressRemoteEnabledForSurface } from '@/features/program/1c-1s/lib/use-company-school-surface-remote'
import { notifyProgramApiUnavailable } from '@/features/program/shared/lib/program-api-unavailable'
import type { LectureAttendanceDetail } from '../../../model/school-detail-types'
import {
  buildStudentClassFilterOptionsFromRows,
  buildStudentGradeClassOptions,
  buildStudentListFilterFields,
  matchesStudentListFilters,
  mergeStudentClassSelectOptions,
} from '../../../lib/student-list-filter-fields'
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
import {
  buildPortraitConsentDownloadContext,
  type PortraitConsentDownloadContext,
} from '../../../lib/build-portrait-consent-download'
import { buildStudentCertificateDownloadContext } from '../../../lib/build-student-certificate-issuance'
import type { StudentCertificateDownloadContext } from '../../../lib/build-student-certificate-issuance'
import {
  isWithinStudentCertificateIssuancePeriod,
  resolveStudentCertificateKind,
} from '../../../lib/resolve-student-certificate-kind'
import { downloadLectureReportPdfFiles } from '../../../lib/download-lecture-reports-bulk-pdf'
import { hasStudentPortraitConsentSubmission } from '../../../lib/student-portrait-consent'
import { PortraitConsentBulkPdfExportHost } from './portrait-consent-bulk-pdf-export-host'
import { StudentCertificatePdfExportHost } from './student-certificate-pdf-export-host'
import './school-detail-modal.css'
import './school-detail-student-list-section.css'
import {
  STUDENT_LIST_TABLE_COL_MIN_WIDTHS,
  STUDENT_LIST_TABLE_SCROLL_X,
  studentListTableDataColumnSize,
} from './school-detail-student-list-table'

const STUDENT_GENDER_EDIT_OPTIONS = [
  { value: 'male', label: '남' },
  { value: 'female', label: '여' },
] as const

function StudentListEditCell({ children }: { children: React.ReactNode }) {
  return <div className="school-detail-student-list-section__edit-cell">{children}</div>
}

function rowsToFormValues(rows: SchoolDetailStudentRow[]): StudentListFormValues {
  return {
    students: rows.map(r => ({
      id: r.id,
      no: r.no,
      name: r.name,
      gender: r.gender,
      birthDate: r.birthDate ?? '',
      gradeClass: r.gradeClass,
      contact: r.contact ?? '',
      email: r.email ?? '',
      notes: r.notes ?? '',
      lectureAttendance: r.lectureAttendance,
    })),
  }
}

function formValuesToRows(students: StudentListFormStudent[]): SchoolDetailStudentRow[] {
  return students.map(r => ({
    id: r.id,
    no: r.no,
    name: r.name,
    gender: r.gender,
    birthDate: r.birthDate?.trim() || undefined,
    gradeClass: r.gradeClass,
    contact: r.contact?.trim() || undefined,
    email: r.email?.trim() || undefined,
    notes: r.notes?.trim() || undefined,
    lectureAttendance: r.lectureAttendance,
  }))
}

export interface SchoolDetailStudentListSectionProps {
  schoolId: string
  studentCount: number
  /** 신청 학급 수 — 학급 Select·필터 옵션 상한 (1반 … N반) */
  classCount?: number
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
  onIssueCertificates?: () => void
  onEditInfo?: () => void
  onAddStudent?: () => void
  onViewDetail?: () => void
  onSaveEdit?: (students: SchoolDetailStudentRow[]) => void
}

export function SchoolDetailStudentListSection({
  schoolId,
  studentCount,
  classCount,
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
  const [certificateIssueModalOpen, setCertificateIssueModalOpen] = useState(false)
  const [certificateExportContext, setCertificateExportContext] =
    useState<StudentCertificateDownloadContext | null>(null)
  const [certificateExportActive, setCertificateExportActive] = useState(false)
  const [portraitConsentExportQueue, setPortraitConsentExportQueue] = useState<
    PortraitConsentDownloadContext[]
  >([])
  const [portraitConsentExportActive, setPortraitConsentExportActive] = useState(false)
  const portraitConsentExportResultsRef = useRef<Array<{ fileName: string; blob: Blob }>>([])
  const portraitConsentExportStartedRef = useRef(false)
  const { showAlert } = useCmsAlert()

  const rosterRemote = useOrganizationStudentRosterRemote({
    organizationApplicationId,
    educationGrade,
  })
  const progressRemoteEnabled = useProgramProgressRemoteEnabledForSurface(
    programId != null ? String(programId) : undefined
  )

  const showStudentListEditModeBlockedAlert = useCallback(
    () => showAlert({ title: '안내', content: STUDENT_LIST_EDIT_MODE_BLOCKED_ALERT_MESSAGE }),
    [showAlert]
  )

  const studentList = useMemo(() => {
    if (rosterRemote.remoteEnabled) return rosterRemote.students
    return getSchoolDetailStudents(schoolId, studentCount)
  }, [rosterRemote.remoteEnabled, rosterRemote.students, schoolId, studentCount])

  useEffect(() => {
    if (!rosterRemote.remoteEnabled) return
    setAddedStudents([])
  }, [rosterRemote.remoteEnabled, rosterRemote.students])

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

  const handlePortraitConsentExportItemComplete = useCallback(
    (result: { fileName: string; blob: Blob } | null) => {
      if (result != null) {
        portraitConsentExportResultsRef.current.push(result)
      }
      setPortraitConsentExportQueue(prev => prev.slice(1))
    },
    []
  )

  const handlePortraitConsentConfirmClick = useCallback(() => {
    if (isStudentListEditMode) {
      showStudentListEditModeBlockedAlert()
      return
    }
    if (selectedStudentKeys.length === 0) {
      showAlert({ title: '안내', content: STUDENT_PORTRAIT_CONSENT_SELECT_ONE_ALERT_MESSAGE })
      return
    }

    const selectedIdSet = new Set(selectedStudentKeys.map(String))
    const selectedRows = mergedStudentList.filter(row => selectedIdSet.has(row.id))
    const downloadableRows = selectedRows.filter(hasStudentPortraitConsentSubmission)

    if (downloadableRows.length === 0) {
      showAlert({ title: '안내', content: STUDENT_PORTRAIT_CONSENT_NOT_SUBMITTED_ALERT_MESSAGE })
      return
    }

    if (portraitConsentExportActive) return

    portraitConsentExportResultsRef.current = []
    portraitConsentExportStartedRef.current = true
    setPortraitConsentExportQueue(
      downloadableRows.map(row =>
        buildPortraitConsentDownloadContext(row, schoolName, educationGrade)
      )
    )
    setPortraitConsentExportActive(true)
  }, [
    educationGrade,
    isStudentListEditMode,
    mergedStudentList,
    portraitConsentExportActive,
    schoolName,
    selectedStudentKeys,
    showAlert,
    showStudentListEditModeBlockedAlert,
  ])

  useEffect(() => {
    if (
      !portraitConsentExportActive ||
      !portraitConsentExportStartedRef.current ||
      portraitConsentExportQueue.length > 0
    ) {
      return
    }

    portraitConsentExportStartedRef.current = false
    const files = portraitConsentExportResultsRef.current

    void (async () => {
      try {
        if (files.length === 0) {
          showAlert({ title: '안내', content: STUDENT_PORTRAIT_CONSENT_DOWNLOAD_FAILED_ALERT_MESSAGE })
          return
        }
        await downloadLectureReportPdfFiles(files)
      } catch (error) {
        handleError(error, { context: 'schoolDetailStudentListSection.portraitConsentDownload' })
        showAlert({ title: '안내', content: STUDENT_PORTRAIT_CONSENT_DOWNLOAD_FAILED_ALERT_MESSAGE })
      } finally {
        portraitConsentExportResultsRef.current = []
        setPortraitConsentExportActive(false)
      }
    })()
  }, [portraitConsentExportActive, portraitConsentExportQueue.length, showAlert])

  const currentPortraitConsentExportContext = portraitConsentExportQueue[0] ?? null

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

  /** 필터·학생 추가·명단 수정 Select 공통 학급 옵션 */
  const gradeClassOptions = useMemo(
    () =>
      mergeStudentClassSelectOptions(
        buildStudentGradeClassOptions(classCount, educationGrade),
        buildStudentClassFilterOptionsFromRows(mergedStudentList)
      ),
    [classCount, educationGrade, mergedStudentList]
  )

  const studentListFilterFields = useMemo(
    () => buildStudentListFilterFields(gradeClassOptions),
    [gradeClassOptions]
  )

  const studentListForm = useForm<StudentListFormValues>({
    defaultValues: { students: [] },
  })
  const { control, reset, watch, getValues, formState } = studentListForm
  const { isDirty } = formState
  useFieldArray({ control, name: 'students' })

  const enterStudentListEditMode = useCallback(() => {
    reset(rowsToFormValues(filteredStudentList))
    setIsStudentListEditMode(true)
  }, [filteredStudentList, reset])

  const handleStudentListCancel = useCallback(() => {
    reset(rowsToFormValues(filteredStudentList))
    setIsStudentListEditMode(false)
  }, [filteredStudentList, reset])

  const handleStudentListSave = useCallback(async () => {
    const values = getValues()
    const rows = formValuesToRows(values.students ?? [])
    if (rosterRemote.remoteEnabled) {
      try {
        await rosterRemote.commitRows(rows)
        setIsStudentListEditMode(false)
        onSaveEdit?.(rows)
      } catch {
        showAlert({
          title: '저장 실패',
          content:
            '학생 명단 저장에 실패했습니다. 수동 편집용 sourceFileObjectId 계약이 서버에 반영됐는지 확인해 주세요.',
        })
      }
      return
    }
    onSaveEdit?.(rows)
    setIsStudentListEditMode(false)
  }, [getValues, onSaveEdit, rosterRemote, showAlert])

  const handleAddStudent = useCallback(
    async (values: AddStudentFormValues) => {
      const nextNo = mergedStudentList.length + 1
      const newRow: SchoolDetailStudentRow = {
        id: crypto.randomUUID(),
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
        try {
          const nextRows = [...studentList, newRow].map((row, index) => ({
            ...row,
            no: index + 1,
          }))
          await rosterRemote.commitRows(nextRows)
          setAddStudentModalOpen(false)
          onAddStudent?.()
        } catch {
          showAlert({
            title: '등록 실패',
            content:
              '학생 등록에 실패했습니다. 명단 전체 교체(PUT) 계약과 sourceFileObjectId 요구사항을 확인해 주세요.',
          })
        }
        return
      }

      setAddedStudents(prev => [...prev, newRow])
      setAddStudentModalOpen(false)
      onAddStudent?.()
    },
    [mergedStudentList.length, onAddStudent, rosterRemote, showAlert, studentList]
  )

  useEffect(() => {
    if (isStudentListEditMode) {
      reset(rowsToFormValues(filteredStudentList))
    }
  }, [isStudentListEditMode, filteredStudentList, reset])

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
    [programId, progressRemoteEnabled, showAlert]
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
    [lectureAttendanceStudent, programId, progressRemoteEnabled, showAlert]
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
    showAlert,
  ])

  const displayCount = isStudentListEditMode
    ? (watch('students')?.length ?? 0)
    : filteredStudentList.length

  const studentListToolbarActions = (
    <div className="school-detail-student-list-section__toolbar-actions">
      <CmsButton
        variant="secondary"
        size="large"
        width={180}
        icon={<CheckOutlined />}
        className="school-detail-student-list-section__btn-outline"
        disabled={portraitConsentExportActive}
        onClick={handlePortraitConsentConfirmClick}
      >
        초상권 동의 확인
      </CmsButton>
      <CmsButton
        variant="secondary"
        size="large"
        width={CMS_CERTIFICATE_ISSUE_BUTTON_WIDTH}
        icon={<DownloadOutlined />}
        className="school-detail-student-list-section__btn-outline"
        disabled={certificateExportActive}
        onClick={handleCertificateIssueClick}
      >
        수료증/참여인증서 발급
      </CmsButton>
      {!readOnly ? (
        <>
          <ProgramEditInfoActions
            isEditing={isStudentListEditMode}
            idleVariant="secondary"
            saving={rosterRemote.isCommitting}
            onEdit={handleEditInfoClick}
            onCancel={handleStudentListCancel}
            onSave={() => {
              void handleStudentListSave()
            }}
          />
          <CmsButton
            variant="primary"
            size="large"
            width={140}
            onClick={() => {
              if (isStudentListEditMode) {
                showStudentListEditModeBlockedAlert()
                return
              }
              setAddStudentModalOpen(true)
            }}
          >
            학생 추가
          </CmsButton>
        </>
      ) : (
        <>
          {onEditInfo && (
            <CmsButton
              {...PROGRAM_EDIT_INFO_BUTTON_PROPS}
              onClick={onEditInfo}
            >
              {PROGRAM_EDIT_INFO_BUTTON_LABEL}
            </CmsButton>
          )}
          {onAddStudent && (
            <CmsButton variant="primary" size="large" width={140} onClick={onAddStudent}>
              학생 추가
            </CmsButton>
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
        render: (v: StudentGenderKey | undefined) => (v ? (STUDENT_GENDER_LABELS[v] ?? '-') : '-'),
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

  const studentColumnsEdit: ColumnsType<StudentListFormStudent> = useMemo(
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
        render: (_: unknown, __: unknown, index: number) => (
          <Controller
            control={control}
            name={`students.${index}.name`}
            render={({ field }) => (
              <StudentListEditCell>
                <CmsInput {...field} inputSize="medium" width="100%" />
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
        render: (_: unknown, __: unknown, index: number) => (
          <Controller
            control={control}
            name={`students.${index}.gender`}
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
        render: (_: unknown, __: unknown, index: number) => (
          <Controller
            control={control}
            name={`students.${index}.birthDate`}
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
                  inputSize="medium"
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
        render: (_: unknown, __: unknown, index: number) => (
          <Controller
            control={control}
            name={`students.${index}.gradeClass`}
            render={({ field }) => (
              <StudentListEditCell>
                <CmsSelect
                  {...field}
                  inputSize="medium"
                  width="100%"
                  withAllOption={false}
                  options={gradeClassOptions}
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
        render: (_: unknown, __: unknown, index: number) => (
          <Controller
            control={control}
            name={`students.${index}.contact`}
            render={({ field }) => (
              <StudentListEditCell>
                <CmsInput {...field} inputSize="medium" width="100%" />
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
        render: (_: unknown, __: unknown, index: number) => (
          <Controller
            control={control}
            name={`students.${index}.email`}
            render={({ field }) => (
              <StudentListEditCell>
                <CmsInput {...field} inputSize="medium" width="100%" />
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
        render: (_: unknown, __: unknown, index: number) => (
          <Controller
            control={control}
            name={`students.${index}.notes`}
            render={({ field }) => (
              <StudentListEditCell>
                <CmsInput {...field} inputSize="medium" width="100%" />
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
    [control, gradeClassOptions, showStudentListEditModeBlockedAlert]
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
        filterResponsiveWrap={false}
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
        <div className="school-detail-student-list-section__table-wrap">
          {rosterRemote.isLoading && filteredStudentList.length === 0 ? (
            <div className="flex min-h-[240px] w-full items-center justify-center" role="status">
              <Spin size="large" />
            </div>
          ) : isStudentListEditMode ? (
            <Table
              rowKey="id"
              size="middle"
              pagination={false}
              rowSelection={studentTableRowSelection}
              scroll={{ x: STUDENT_LIST_TABLE_SCROLL_X }}
              tableLayout="fixed"
              columns={studentColumnsEdit}
              dataSource={watch('students') ?? []}
              className="school-detail-modal__student-table school-detail-modal__student-table--edit cms-data-table"
            />
          ) : (
            <Table<SchoolDetailStudentRow>
              rowKey="id"
              size="middle"
              pagination={false}
              rowSelection={studentTableRowSelection}
              scroll={{ x: STUDENT_LIST_TABLE_SCROLL_X }}
              tableLayout="fixed"
              columns={studentColumnsView}
              dataSource={filteredStudentList}
              className="school-detail-modal__student-table cms-data-table"
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
        gradeClassOptions={gradeClassOptions}
      />
      <CertificateBulkIssueReasonModal
        open={certificateIssueModalOpen}
        onCancel={handleCertificateIssueModalCancel}
        applicationIds={
          selectedStudentKeys.length === 1 ? [String(selectedStudentKeys[0])] : []
        }
        onIssue={handleCertificateIssueConfirm}
      />
      <FormCertificatePdfExportOverlay
        visible={portraitConsentExportActive || certificateExportActive}
      />
      {certificateExportContext != null ? (
        <StudentCertificatePdfExportHost
          key={`${certificateExportContext.student.id}-${certificateExportContext.certificateKind}-${certificateExportContext.issuanceReasonLabel}`}
          context={certificateExportContext}
          onComplete={handleCertificateExportComplete}
        />
      ) : null}
      {currentPortraitConsentExportContext != null ? (
        <PortraitConsentBulkPdfExportHost
          key={currentPortraitConsentExportContext.student.id}
          context={currentPortraitConsentExportContext}
          onComplete={handlePortraitConsentExportItemComplete}
        />
      ) : null}
    </div>
  )
}
