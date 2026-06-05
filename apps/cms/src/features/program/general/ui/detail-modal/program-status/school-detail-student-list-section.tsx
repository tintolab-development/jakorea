/**
 * 학교 상세 > 학생 명단 탭 공통 섹션
 * 필터(학생명·성별·학급) + 디바이더 + 참여 학생 목록 총 n건 + 버튼 4개 + 테이블
 * 모달·풀페이지 뷰에서 재사용
 */

import { useCallback, useEffect, useMemo, useState, type Key } from 'react'
import { useStudentListFilterParams } from '../../../hooks/use-student-list-filter-params'
import type { StudentListFilterParams } from '../../../hooks/use-student-list-filter-params'
import { CheckOutlined, DownloadOutlined } from '@ant-design/icons'
import { Table } from 'antd'
import { useForm, useFieldArray, Controller } from 'react-hook-form'
import { CmsButton, CmsInput, CmsRadio, CmsSelect, FilterTableLayout, useCmsAlert } from '@/shared/ui'
import type { ColumnsType } from 'antd/es/table'
import {
  FEATURE_COMING_SOON_ALERT_MESSAGE,
  STUDENT_CERTIFICATE_ISSUE_SELECT_ONE_ALERT_MESSAGE,
  STUDENT_CERTIFICATE_ISSUE_SELECT_ONLY_ONE_ALERT_MESSAGE,
  STUDENT_LIST_EDIT_MODE_BLOCKED_ALERT_MESSAGE,
  STUDENT_LIST_INFO_EDIT_COMING_SOON_ALERT_MESSAGE,
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
import { getSchoolDetailStudents } from '../../../lib/school-detail-mock'
import { buildStudentListFilterFields, STUDENT_GRADE_CLASS_OPTIONS } from '../../../lib/student-list-filter-fields'
import { lectureAttendanceStringFromSessions } from '../../../lib/lecture-attendance-from-sessions'
import {
  formatStudentBirthDateFromDigits,
  type AddStudentFormValues,
} from '../../../model/school-detail-add-student-schema'
import { LectureAttendanceModal } from '../../lecture-attendance-modal'
import { AddStudentModal } from '../../add-student-modal'
import { CertificateBulkIssueReasonModal } from '@/features/user/detail/ui/modal/certificate-bulk-issue-reason-modal'
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
    lectureAttendance: r.lectureAttendance,
  }))
}

export interface SchoolDetailStudentListSectionProps {
  schoolId: string
  studentCount: number
  /** 과제·설문 제출 내역 모달 설명에 사용하는 프로그램명 */
  programTitle?: string
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
  programTitle: _programTitle,
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
  const [attendanceSessionsByStudentId, setAttendanceSessionsByStudentId] = useState<
    Record<string, LectureAttendanceSession[]>
  >({})
  const [addStudentModalOpen, setAddStudentModalOpen] = useState(false)
  const [certificateIssueModalOpen, setCertificateIssueModalOpen] = useState(false)
  const [certificateIssueStudentId, setCertificateIssueStudentId] = useState<string | null>(null)
  const { showAlert } = useCmsAlert()

  const showComingSoonAlert = useCallback(
    () => showAlert({ title: '안내', content: FEATURE_COMING_SOON_ALERT_MESSAGE }),
    [showAlert]
  )

  const showStudentListEditModeBlockedAlert = useCallback(
    () => showAlert({ title: '안내', content: STUDENT_LIST_EDIT_MODE_BLOCKED_ALERT_MESSAGE }),
    [showAlert]
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

    setCertificateIssueStudentId(String(selectedStudentKeys[0]))
    setCertificateIssueModalOpen(true)
  }, [
    isStudentListEditMode,
    selectedStudentKeys,
    showAlert,
    showStudentListEditModeBlockedAlert,
  ])

  const handleCertificateIssueModalCancel = useCallback(() => {
    setCertificateIssueModalOpen(false)
    setCertificateIssueStudentId(null)
  }, [])

  const studentList = useMemo(
    () => getSchoolDetailStudents(schoolId, studentCount),
    [schoolId, studentCount]
  )
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
  const filteredStudentList = useMemo(() => {
    return mergedStudentList.filter(row => {
      const matchName =
        !appliedFilters.studentName.trim() || row.name.includes(appliedFilters.studentName.trim())
      const matchGender =
        appliedFilters.studentGender === 'all' || row.gender === appliedFilters.studentGender
      const matchClass =
        appliedFilters.studentClass === 'all' || row.gradeClass === appliedFilters.studentClass
      return matchName && matchGender && matchClass
    })
  }, [
    mergedStudentList,
    appliedFilters.studentName,
    appliedFilters.studentGender,
    appliedFilters.studentClass,
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

  const studentListFilterFields = useMemo(() => buildStudentListFilterFields(), [])

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

  const handleStudentListSave = useCallback(() => {
    const values = getValues()
    const rows = formValuesToRows(values.students ?? [])
    onSaveEdit?.(rows)
    setIsStudentListEditMode(false)
  }, [getValues, onSaveEdit])

  const handleAddStudent = useCallback(
    (values: AddStudentFormValues) => {
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
      }
      setAddedStudents(prev => [...prev, newRow])
      setAddStudentModalOpen(false)
    },
    [mergedStudentList.length]
  )

  useEffect(() => {
    if (isStudentListEditMode) {
      reset(rowsToFormValues(filteredStudentList))
    }
  }, [isStudentListEditMode, filteredStudentList, reset])

  const openLectureAttendance = useCallback((record: SchoolDetailStudentRow) => {
    setLectureAttendanceStudent(record)
    setLectureAttendanceModalOpen(true)
  }, [])

  const handleSaveLectureAttendance = useCallback(
    (sessions: LectureAttendanceSession[]) => {
      const id = lectureAttendanceStudent?.id
      if (!id) return
      setAttendanceSessionsByStudentId(prev => ({ ...prev, [id]: sessions }))
    },
    [lectureAttendanceStudent?.id]
  )

  const handleEditInfoClick = useCallback(() => {
    if (studentListInfoEditComingSoonAlert) {
      showAlert({ title: '안내', content: STUDENT_LIST_INFO_EDIT_COMING_SOON_ALERT_MESSAGE })
      return
    }
    if (isStudentListEditMode) {
      if (isDirty) {
        handleStudentListSave()
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
        onClick={() => {
          if (isStudentListEditMode) {
            showStudentListEditModeBlockedAlert()
            return
          }
          showComingSoonAlert()
        }}
      >
        초상권 동의 확인
      </CmsButton>
      <CmsButton
        variant="secondary"
        size="large"
        width={215}
        icon={<DownloadOutlined />}
        className="school-detail-student-list-section__btn-outline"
        onClick={handleCertificateIssueClick}
      >
        수료증/참여인증서 발급
      </CmsButton>
      {!readOnly ? (
        <>
          <CmsButton
            variant="secondary"
            size="large"
            width={140}
            className={[
              'school-detail-student-list-section__btn-edit-info',
              isStudentListEditMode && 'school-detail-student-list-section__btn-edit-info--active',
            ]
              .filter(Boolean)
              .join(' ')}
            onClick={handleEditInfoClick}
          >
            정보 수정
          </CmsButton>
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
              variant="secondary"
              size="large"
              width={140}
              className="school-detail-student-list-section__btn-edit-info"
              onClick={onEditInfo}
            >
              정보 수정
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
        title: '강의 출석 내역',
        dataIndex: 'lectureAttendance',
        key: 'lectureAttendance',
        align: 'center',
        ...studentListTableDataColumnSize(7),
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
                <CmsInput
                  {...field}
                  inputSize="medium"
                  width="100%"
                  placeholder="YYYY. MM. DD."
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
                  options={STUDENT_GRADE_CLASS_OPTIONS}
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
        title: '강의 출석 내역',
        dataIndex: 'lectureAttendance',
        key: 'lectureAttendance',
        align: 'center',
        ...studentListTableDataColumnSize(7),
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
    [control, showStudentListEditModeBlockedAlert]
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
      >
        <div className="school-detail-student-list-section__table-wrap">
          {isStudentListEditMode ? (
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
        }}
        student={lectureAttendanceStudent}
        schoolId={schoolId}
        zIndex={1200}
        savedSessions={
          lectureAttendanceStudent?.id
            ? attendanceSessionsByStudentId[lectureAttendanceStudent.id]
            : undefined
        }
        onSaveAttendance={handleSaveLectureAttendance}
      />
      <AddStudentModal
        open={addStudentModalOpen}
        onCancel={() => setAddStudentModalOpen(false)}
        onAdd={handleAddStudent}
      />
      <CertificateBulkIssueReasonModal
        open={certificateIssueModalOpen}
        onCancel={handleCertificateIssueModalCancel}
        applicationIds={certificateIssueStudentId ? [certificateIssueStudentId] : []}
      />
    </div>
  )
}
