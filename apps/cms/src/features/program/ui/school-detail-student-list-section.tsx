/**
 * 학교 상세 > 학생 명단 탭 공통 섹션
 * 필터(학생명·성별·학급) + 디바이더 + 참여 학생 목록 총 n건 + 버튼 4개 + 테이블
 * 모달·풀페이지 뷰에서 재사용
 */

import { useCallback, useEffect, useMemo, useState, type Key } from 'react'
import { useStudentListFilterParams } from '../hooks/use-student-list-filter-params'
import { Table, Input, Select, Row, Col } from 'antd'
import { useForm, useFieldArray, Controller } from 'react-hook-form'
import { AppButton, FilterSearchButton } from '@/shared/ui/app-button'
import type { ColumnsType } from 'antd/es/table'
import { MASKING_POLICY } from '@/shared/constants/download-policy'
import { STUDENT_LIST_INFO_EDIT_COMING_SOON_ALERT_MESSAGE } from '@/shared/constants/messages'
import { formatLectureAttendanceCellDisplay } from '@/shared/lib/format-lecture-attendance-display'
import type {
  LectureAttendanceSession,
  SchoolDetailStudentRow,
  StudentListFormValues,
  StudentListFormStudent,
  StudentGenderKey,
} from '../model/school-detail-types'
import { STUDENT_GENDER_LABELS } from '../model/school-detail-types'
import { getSchoolDetailStudents } from '../lib/school-detail-mock'
import { lectureAttendanceStringFromSessions } from '../lib/lecture-attendance-from-sessions'
import type { AddStudentFormValues } from '../model/school-detail-add-student-schema'
import { LectureAttendanceModal } from './lecture-attendance-modal'
import { AssignmentSubmissionModal } from './assignment-submission-modal'
import { AddStudentModal } from './add-student-modal'
import { usePersonalInfoReveal } from '@/features/user/detail/lib/use-personal-info-reveal'
import { PersonalInfoRevealButton } from '@/features/user/detail/ui/personal-info-reveal-button'
import './school-detail-modal.css'
import './detail-modal/program-status/program-progress-tab.css'
import './detail-modal/program-status/participating-institutions-section.css'
import './school-detail-student-list-section.css'
import {
  STUDENT_LIST_TABLE_COL_MIN_WIDTHS,
  studentListTableDataColumnSize,
} from './school-detail-student-list-table'

/** 수료증 발급 버튼용 아이콘 (22×22, JA/mint 01) */
function CertificateIssueIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={22}
      height={22}
      viewBox="0 0 22 22"
      fill="none"
      aria-hidden
    >
      <path
        d="M11 14.1272C10.8895 14.1272 10.7867 14.1096 10.6915 14.0743C10.5964 14.0391 10.5058 13.9786 10.42 13.8928L7.5696 11.0424C7.43333 10.906 7.36603 10.7464 7.36771 10.5637C7.36954 10.3809 7.43684 10.2185 7.5696 10.0762C7.71184 9.93415 7.87516 9.86074 8.05956 9.856C8.24412 9.85126 8.40751 9.92001 8.54975 10.0623L10.3125 11.825V4.8125C10.3125 4.6174 10.3783 4.45408 10.51 4.32254C10.6416 4.19085 10.8049 4.125 11 4.125C11.1951 4.125 11.3584 4.19085 11.49 4.32254C11.6217 4.45408 11.6875 4.6174 11.6875 4.8125V11.825L13.4502 10.0623C13.5867 9.92597 13.7485 9.85867 13.9359 9.86035C14.1233 9.86219 14.2882 9.93415 14.4304 10.0762C14.5632 10.2185 14.6319 10.3795 14.6366 10.5593C14.6414 10.7391 14.5726 10.9002 14.4304 11.0424L11.58 13.8928C11.4942 13.9786 11.4036 14.0391 11.3085 14.0743C11.2133 14.1096 11.1105 14.1272 11 14.1272ZM5.7821 17.875C5.31903 17.875 4.92708 17.7146 4.60625 17.3938C4.28542 17.0729 4.125 16.681 4.125 16.2179V14.4199C4.125 14.2248 4.19085 14.0614 4.32254 13.9299C4.45408 13.7982 4.6174 13.7324 4.8125 13.7324C5.0076 13.7324 5.17092 13.7982 5.30246 13.9299C5.43415 14.0614 5.5 14.2248 5.5 14.4199V16.2179C5.5 16.2885 5.52941 16.3531 5.58823 16.4118C5.6469 16.4706 5.71152 16.5 5.7821 16.5H16.2179C16.2885 16.5 16.3531 16.4706 16.4118 16.4118C16.4706 16.3531 16.5 16.2885 16.5 16.2179V14.4199C16.5 14.2248 16.5658 14.0614 16.6975 13.9299C16.8291 13.7982 16.9924 13.7324 17.1875 13.7324C17.3826 13.7324 17.5459 13.7982 17.6775 13.9299C17.8092 14.0614 17.875 14.2248 17.875 14.4199V16.2179C17.875 16.681 17.7146 17.0729 17.3938 17.3938C17.0729 17.7146 16.681 17.875 16.2179 17.875H5.7821Z"
        fill="var(--JA-mint-01, #01A1AF)"
      />
    </svg>
  )
}

const GENDER_FILTER_OPTIONS = [
  { value: 'all', label: '전체' },
  { value: 'male', label: '남' },
  { value: 'female', label: '여' },
]

function rowsToFormValues(rows: SchoolDetailStudentRow[]): StudentListFormValues {
  return {
    students: rows.map(r => ({
      id: r.id,
      no: r.no,
      name: r.name,
      gender: r.gender,
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
   * true면 `readOnly`가 아닐 때도 「정보 수정」 클릭 시 명단 편집 모드 대신 준비 중 alert만 표시
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
  programTitle,
  readOnly = false,
  studentListInfoEditComingSoonAlert = false,
  onIssueCertificates: _onIssueCertificates,
  onEditInfo,
  onAddStudent,
  onViewDetail: _onViewDetail,
  onSaveEdit,
}: SchoolDetailStudentListSectionProps) {
  const { filters, appliedFilters, setFilter, applyFilters } = useStudentListFilterParams()
  const [localStudentName, setLocalStudentName] = useState(() => filters.studentName)
  const [selectedStudentKeys, setSelectedStudentKeys] = useState<Key[]>([])

  useEffect(() => {
    setLocalStudentName(filters.studentName)
  }, [filters.studentName])
  const [isStudentListEditMode, setIsStudentListEditMode] = useState(false)
  const [addedStudents, setAddedStudents] = useState<SchoolDetailStudentRow[]>([])
  const [lectureAttendanceModalOpen, setLectureAttendanceModalOpen] = useState(false)
  const [lectureAttendanceStudent, setLectureAttendanceStudent] =
    useState<SchoolDetailStudentRow | null>(null)
  const [attendanceSessionsByStudentId, setAttendanceSessionsByStudentId] = useState<
    Record<string, LectureAttendanceSession[]>
  >({})
  const [assignmentSubmissionModalOpen, setAssignmentSubmissionModalOpen] = useState(false)
  const [assignmentSubmissionStudent, setAssignmentSubmissionStudent] =
    useState<SchoolDetailStudentRow | null>(null)
  const [addStudentModalOpen, setAddStudentModalOpen] = useState(false)
  const [personalInfoRevealed, setPersonalInfoRevealed] = useState(false)
  const [personalInfoRevealConfirmOpen, setPersonalInfoRevealConfirmOpen] = useState(false)

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
  }, [mergedStudentList, appliedFilters.studentName, appliedFilters.studentGender, appliedFilters.studentClass])

  const resolveStudentListPersonalInfoAccessItem = useCallback(() => {
    const accessItem = filteredStudentList.find(row => selectedStudentKeys.includes(row.id))?.name
    return accessItem ?? '학생 명단'
  }, [filteredStudentList, selectedStudentKeys])

  const {
    personalInfoRevealed,
    onPrivacyControlClick: handleStudentListPrivacyClick,
    confirmModal: personalInfoRevealModal,
  } = usePersonalInfoReveal({
    resolveAccessItem: resolveStudentListPersonalInfoAccessItem,
    resetDeps: [schoolId],
    controlMode: 'toggleRemask',
  })

  const handleStudentSearch = useCallback(() => {
    applyFilters({ studentName: localStudentName })
  }, [localStudentName, applyFilters])

  const studentClassOptions = useMemo(() => {
    const classes = Array.from(new Set(mergedStudentList.map(r => r.gradeClass))).sort()
    return [{ value: 'all', label: '전체' }, ...classes.map(c => ({ value: c, label: c }))]
  }, [mergedStudentList])

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

  useEffect(() => {
    setPersonalInfoRevealed(false)
    setPersonalInfoRevealConfirmOpen(false)
  }, [schoolId])

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

  const openAssignmentSubmission = useCallback((record: SchoolDetailStudentRow) => {
    setAssignmentSubmissionStudent(record)
    setAssignmentSubmissionModalOpen(true)
  }, [])

  const displayCount = isStudentListEditMode
    ? (watch('students')?.length ?? 0)
    : filteredStudentList.length

  const studentTableRowSelection = useMemo(
    () => ({
      selectedRowKeys: selectedStudentKeys,
      onChange: (keys: Key[]) => setSelectedStudentKeys(keys),
      columnWidth: STUDENT_LIST_TABLE_COL_MIN_WIDTHS[0],
    }),
    [selectedStudentKeys]
  )

  const studentColumnsView: ColumnsType<SchoolDetailStudentRow> = useMemo(
    () => [
      { title: 'No.', dataIndex: 'no', key: 'no', align: 'center', ...studentListTableDataColumnSize(0) },
      { title: '학생명', dataIndex: 'name', key: 'name', align: 'center', ...studentListTableDataColumnSize(1) },
      {
        title: '성별',
        dataIndex: 'gender',
        key: 'gender',
        align: 'center',
        ...studentListTableDataColumnSize(2),
        render: (v: StudentGenderKey | undefined) =>
          v ? (STUDENT_GENDER_LABELS[v] ?? '-') : '-',
      },
      {
        title: '학급',
        dataIndex: 'gradeClass',
        key: 'gradeClass',
        align: 'center',
        ...studentListTableDataColumnSize(3),
      },
      {
        title: '연락처',
        dataIndex: 'contact',
        key: 'contact',
        align: 'center',
        ...studentListTableDataColumnSize(4),
        render: (v: string | undefined) =>
          v ? (personalInfoRevealed ? v : MASKING_POLICY.phone(v)) : '-',
      },
      {
        title: '이메일',
        dataIndex: 'email',
        key: 'email',
        align: 'center',
        ellipsis: true,
        ...studentListTableDataColumnSize(5),
        render: (v: string | undefined) =>
          v ? (personalInfoRevealed ? v : MASKING_POLICY.email(v)) : '-',
      },
      {
        title: '강의 출석 내역',
        dataIndex: 'lectureAttendance',
        key: 'lectureAttendance',
        align: 'center',
        ...studentListTableDataColumnSize(6),
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
      {
        title: '과제 제출 내역',
        key: 'assignment',
        align: 'center',
        ...studentListTableDataColumnSize(7),
        render: (_: unknown, record: SchoolDetailStudentRow) => (
          <AppButton
            variant="viewDetails"
            size="large"
            onClick={() => openAssignmentSubmission(record)}
          >
            내역 보기
          </AppButton>
        ),
      },
    ],
    [openLectureAttendance, openAssignmentSubmission, personalInfoRevealed]
  )

  const studentColumnsEdit: ColumnsType<StudentListFormStudent> = useMemo(
    () => [
      { title: 'No.', dataIndex: 'no', key: 'no', align: 'center', ...studentListTableDataColumnSize(0) },
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
              <Input {...field} size="small" className="school-detail-modal__cell-input" />
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
              <Select
                {...field}
                size="small"
                className="school-detail-modal__filter-select"
                options={[
                  { value: 'male', label: '남' },
                  { value: 'female', label: '여' },
                ]}
                classNames={{ root: 'school-detail-modal__student-table-gender-select' }}
              />
            )}
          />
        ),
      },
      {
        title: '학급',
        key: 'gradeClass',
        align: 'center',
        ...studentListTableDataColumnSize(3),
        render: (_: unknown, __: unknown, index: number) => (
          <Controller
            control={control}
            name={`students.${index}.gradeClass`}
            render={({ field }) => (
              <Input {...field} size="small" className="school-detail-modal__cell-input" />
            )}
          />
        ),
      },
      {
        title: '연락처',
        key: 'contact',
        align: 'center',
        ...studentListTableDataColumnSize(4),
        render: (_: unknown, __: unknown, index: number) => (
          <Controller
            control={control}
            name={`students.${index}.contact`}
            render={({ field }) => (
              <Input {...field} size="small" className="school-detail-modal__cell-input" />
            )}
          />
        ),
      },
      {
        title: '이메일',
        key: 'email',
        align: 'center',
        ...studentListTableDataColumnSize(5),
        render: (_: unknown, __: unknown, index: number) => (
          <Controller
            control={control}
            name={`students.${index}.email`}
            render={({ field }) => (
              <Input {...field} size="small" className="school-detail-modal__cell-input" />
            )}
          />
        ),
      },
      {
        title: '강의 출석 내역',
        dataIndex: 'lectureAttendance',
        key: 'lectureAttendance',
        align: 'center',
        ...studentListTableDataColumnSize(6),
        onCell: () => ({ className: 'school-detail-modal__td-lecture-attendance' }),
        render: (v: string | undefined) => (
          <button
            type="button"
            className="school-detail-modal__link-button school-detail-modal__link-button--disabled"
            onClick={() => {}}
            disabled
          >
            {formatLectureAttendanceCellDisplay(v)}
          </button>
        ),
      },
      {
        title: '과제 제출 내역',
        key: 'assignment',
        align: 'center',
        ...studentListTableDataColumnSize(7),
        render: () => (
          <AppButton variant="viewDetails" size="large" disabled>
            내역 보기
          </AppButton>
        ),
      },
    ],
    [control]
  )

  return (
    <div className="school-detail-student-list-section">
      <div className="school-detail-student-list-section__filters participating-institutions-section__filters program-progress-tab__filters">
        <Row gutter={[12, 12]} align="bottom" wrap className="program-progress-tab__filter-row">
          <Col className="program-progress-tab__filter-col school-detail-student-list-section__filter-col school-detail-student-list-section__filter-col--name">
            <div className="program-progress-tab__filter-field participating-institutions-section__filter-field--label-top">
              <span className="program-progress-tab__filter-label">학생명</span>
              <Input
                placeholder="학생명을 입력하세요"
                value={localStudentName}
                onChange={e => setLocalStudentName(e.target.value)}
                allowClear
                className="participating-institutions-section__filter-input school-detail-student-list-section__filter-input"
              />
            </div>
          </Col>
          <Col className="program-progress-tab__filter-col school-detail-student-list-section__filter-col school-detail-student-list-section__filter-col--gender">
            <div className="program-progress-tab__filter-field participating-institutions-section__filter-field--label-top">
              <span className="program-progress-tab__filter-label">성별</span>
              <Select
                placeholder="전체"
                value={filters.studentGender === 'all' ? undefined : filters.studentGender}
                onChange={v => setFilter('studentGender', v ?? 'all')}
                allowClear
                options={GENDER_FILTER_OPTIONS}
                getPopupContainer={() => document.body}
                rootClassName="school-detail-student-list-section__filter-select"
              />
            </div>
          </Col>
          <Col className="program-progress-tab__filter-col school-detail-student-list-section__filter-col school-detail-student-list-section__filter-col--class">
            <div className="program-progress-tab__filter-field participating-institutions-section__filter-field--label-top">
              <span className="program-progress-tab__filter-label">학급</span>
              <Select
                placeholder="전체"
                value={filters.studentClass === 'all' ? undefined : filters.studentClass}
                onChange={v => setFilter('studentClass', v ?? 'all')}
                allowClear
                options={studentClassOptions}
                getPopupContainer={() => document.body}
                rootClassName="school-detail-student-list-section__filter-select"
              />
            </div>
          </Col>
          <Col className="program-progress-tab__filter-col--btn school-detail-student-list-section__filter-col--btn">
            <FilterSearchButton onClick={handleStudentSearch} />
          </Col>
        </Row>
      </div>

      <div className="participating-institutions-section__divider" />

      <div className="school-detail-modal__students">
        <div className="school-detail-modal__student-table-header">
          <div className="school-detail-modal__student-table-heading">
            <span className="school-detail-modal__student-table-title">참여 학생 목록</span>
            <span className="school-detail-modal__table-description">총 {displayCount}건</span>
          </div>
          <div className="school-detail-modal__student-table-actions">
            {isStudentListEditMode ? (
              <>
                <AppButton variant="cancel" size="filter" onClick={handleStudentListCancel}>
                  취소
                </AppButton>
                <AppButton
                  variant="primary"
                  size="filter"
                  modalTeal
                  disabled={!isDirty}
                  onClick={handleStudentListSave}
                >
                  저장
                </AppButton>
              </>
            ) : (
              <>
                <AppButton
                  variant="cancel"
                  size="filter"
                  icon={<CertificateIssueIcon />}
                  className="school-detail-student-list-section__btn-certificate"
                  onClick={() => window.alert('준비 중입니다.')}
                >
                  수료증 발급
                </AppButton>
                {!readOnly ? (
                  <AppButton
                    variant="cancel"
                    size="filter"
                    className="school-detail-student-list-section__btn-edit-info"
                    onClick={
                      studentListInfoEditComingSoonAlert
                        ? () => window.alert(STUDENT_LIST_INFO_EDIT_COMING_SOON_ALERT_MESSAGE)
                        : enterStudentListEditMode
                    }
                  >
                    정보 수정
                  </AppButton>
                ) : (
                  onEditInfo && (
                    <AppButton
                      variant="cancel"
                      size="filter"
                      className="school-detail-student-list-section__btn-edit-info"
                      onClick={onEditInfo}
                    >
                      정보 수정
                    </AppButton>
                  )
                )}
                {!readOnly ? (
                  <AppButton
                    variant="primary"
                    size="filter"
                    modalTeal
                    onClick={() => setAddStudentModalOpen(true)}
                  >
                    학생 추가
                  </AppButton>
                ) : (
                  onAddStudent && (
                    <AppButton variant="primary" size="filter" modalTeal onClick={onAddStudent}>
                      학생 추가
                    </AppButton>
                  )
                )}
                <PersonalInfoRevealButton
                  ui="app"
                  labelMode="toggle"
                  revealed={personalInfoRevealed}
                  variant="primary"
                  size="filter-wide"
                  modalTeal
                  onClick={handleStudentListPrivacyClick}
                />
              </>
            )}
          </div>
        </div>
        {isStudentListEditMode ? (
          <Table
            rowKey="id"
            size="middle"
            pagination={false}
            rowSelection={studentTableRowSelection}
            scroll={{ x: 'max-content' }}
            columns={studentColumnsEdit}
            dataSource={watch('students') ?? []}
            className="school-detail-modal__student-table"
          />
        ) : (
          <Table<SchoolDetailStudentRow>
            rowKey="id"
            size="middle"
            pagination={false}
            rowSelection={studentTableRowSelection}
            scroll={{ x: 'max-content' }}
            columns={studentColumnsView}
            dataSource={filteredStudentList}
            className="school-detail-modal__student-table"
          />
        )}
      </div>

      <LectureAttendanceModal
        open={lectureAttendanceModalOpen}
        onCancel={() => {
          setLectureAttendanceModalOpen(false)
          setLectureAttendanceStudent(null)
        }}
        student={lectureAttendanceStudent}
        schoolId={schoolId}
        savedSessions={
          lectureAttendanceStudent?.id
            ? attendanceSessionsByStudentId[lectureAttendanceStudent.id]
            : undefined
        }
        onSaveAttendance={handleSaveLectureAttendance}
      />
      <AssignmentSubmissionModal
        open={assignmentSubmissionModalOpen}
        onCancel={() => {
          setAssignmentSubmissionModalOpen(false)
          setAssignmentSubmissionStudent(null)
        }}
        programTitle={programTitle}
        student={assignmentSubmissionStudent}
        schoolId={schoolId}
      />
      <AddStudentModal
        open={addStudentModalOpen}
        onCancel={() => setAddStudentModalOpen(false)}
        onAdd={handleAddStudent}
      />
      {personalInfoRevealModal}
    </div>
  )
}
