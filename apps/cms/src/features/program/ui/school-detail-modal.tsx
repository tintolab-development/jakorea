/**
 * 학교 상세 정보 모달
 * 프로그램 진행현황 > 참여 학교 정보 탭에서 행 클릭 시 노출 (large 모달, 탭: 기본 정보 | 학생 명단)
 * 명세: docs/design/school-detail-modal-spec.md
 * 학생 명단 탭 수정 모드: docs/design/school-detail-modal-student-list-edit-spec.md
 */

import { useEffect, useLayoutEffect, useMemo, useState } from 'react'
import { App, Tabs, Descriptions, Table, Input, Radio } from 'antd'
import { useForm, useFieldArray, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AppButton } from '@/shared/ui/app-button'
import type { ColumnsType } from 'antd/es/table'
import { TealHeaderModal } from '@/shared/ui/teal-header-modal'
import type {
  SchoolDetailForModal,
  SchoolDetailInstructorRow,
  InstructorListFormValues,
  InstructorListFormInstructor,
} from '../model/school-detail-types'
import type { InstructorRoleKey } from '../model/school-detail-types'
import { INSTRUCTOR_ROLE_LABELS } from '../model/school-detail-types'
import {
  schoolDetailBasicFormSchema,
  detailToBasicFormValues,
  basicFormValuesToDetailPatch,
  EMPTY_BASIC_FORM_VALUES,
  type SchoolDetailBasicFormValues,
} from '../model/school-detail-basic-form-schema'
import type { SettlementStatusKey } from '@/data/mock/participating-instructors'
import { TextbookStatusBadge } from '@/shared/components/textbook-status-badge'
import { SettlementStatusBadge } from '@/shared/components/settlement-status-badge'
import { ScheduleChangeHistoryBadge } from '@/shared/components/schedule-change-history-badge'
import { MOCK_PARTICIPATING_INSTRUCTORS } from '@/data/mock/participating-instructors'
import {
  TEXTBOOK_STATUS_LABELS,
  type ParticipatingSchoolRow,
  type TextbookStatusKey,
} from '@/data/mock/participating-schools'
import { MOCK_INSTRUCTOR_ASSIGN_SESSION_OPTIONS } from '../lib/instructor-assign-session-options'
import {
  SchoolDetailAddInstructorAssignModal,
  type AddInstructorAssignOption,
} from './school-detail-add-instructor-assign-modal'
import { SchoolDetailStudentListSection } from './school-detail-student-list-section'
import {
  DeleteGuideModal,
  buildSchoolCancelApprovalMessageLines,
} from './manager-delete-guide-modal'
import './instructor-assignment-role-tag.css'
import './school-detail-modal.css'

const { TextArea } = Input
const TAB_BASIC = 'basic'
const TAB_STUDENTS = 'students'
const TAB_POSTS = 'posts'

function instructorsToFormValues(rows: SchoolDetailInstructorRow[]): InstructorListFormValues {
  return {
    instructors: rows.map(r => ({
      id: r.id,
      role: r.role,
      instructorName: r.instructorName,
      contact: r.contact,
      email: r.email,
    })),
  }
}

export type SchoolDetailModalVariant = 'progress' | 'applicant'

export interface SchoolDetailModalProps {
  open: boolean
  onCancel: () => void
  /** 학교 상세 데이터 (행 클릭 시 getSchoolDetailByRow(row) / getApplicantSchoolDetail(row) 로 전달) */
  detail: SchoolDetailForModal | null
  /** 모달 제목 (기본: "학교 상세 정보", 신청자 목록: "수강 신청 학교 상세 정보") */
  title?: string
  /** progress: 진행현황 참여학교 | applicant: 신청자목록 신청학교 (기본 정보 탭에서만 반려/승인 버튼, 일정 변경 이력 배지, 강사진/교재 섹션 숨김) */
  variant?: SchoolDetailModalVariant
  /** 기본 정보 저장 시 호출 (mock/API 연동 시 부모에서 detail 갱신용) */
  onSaveBasicInfo?: (patch: Partial<SchoolDetailForModal> & { id: string }) => void
  /** 강사진 정보 저장 시 호출 (mock/API 연동 시 부모에서 detail 갱신용) */
  onSaveInstructorInfo?: (schoolId: string, instructors: InstructorListFormInstructor[]) => void
  /** 진행현황: 참여 학교 목록 행 — 승인 취소 노출·회차 완료 비활성 판단 (onCancelApproval과 함께 전달) */
  participatingRow?: ParticipatingSchoolRow | null
  /** 승인 취소 확인 후 호출 (프로그램 승인 현황 → 승인 취소) */
  onCancelApproval?: (schoolId: string) => void
}

export function SchoolDetailModal({
  open,
  onCancel,
  detail,
  title: titleProp,
  variant = 'progress',
  onSaveBasicInfo,
  onSaveInstructorInfo,
  participatingRow,
  onCancelApproval,
}: SchoolDetailModalProps) {
  const { modal } = App.useApp()
  const title =
    titleProp ?? (variant === 'applicant' ? '수강 신청 학교 상세 정보' : '학교 상세 정보')
  const isApplicant = variant === 'applicant'
  /** 기획: 수업 진행 이후(회차 중 진행 완료)에는 승인 취소 비활성화 */
  const isCancelApprovalDisabledAfterClassStarted = (participatingRow?.sessions ?? []).some(
    s => s.status === 'completed'
  )
  /** 진행현황·기본 정보 탭: 승인 취소 버튼 항상 노출, 조건부 비활성화 */
  const cancelApprovalDisabledReason = (() => {
    if (!onCancelApproval) return '현재 승인 취소를 처리할 수 없습니다.'
    if (!participatingRow || participatingRow.approvalStatus !== 'approved')
      return '승인 완료 상태에서만 승인 취소할 수 있습니다.'
    if (isCancelApprovalDisabledAfterClassStarted)
      return '진행 완료된 회차가 있어 승인 취소할 수 없습니다.'
    return null
  })()
  const isCancelApprovalDisabled = cancelApprovalDisabledReason !== null
  const [activeTab, setActiveTab] = useState<string>(TAB_BASIC)
  const [selectedInstructorKeys, setSelectedInstructorKeys] = useState<React.Key[]>([])
  const [isBasicEditMode, setIsBasicEditMode] = useState(false)
  const [isInstructorEditMode, setIsInstructorEditMode] = useState(false)
  const [addInstructorAssignModalOpen, setAddInstructorAssignModalOpen] = useState(false)
  const [cancelApprovalConfirmOpen, setCancelApprovalConfirmOpen] = useState(false)

  const defaultBasicValues = useMemo<SchoolDetailBasicFormValues>(
    () => (detail ? detailToBasicFormValues(detail) : EMPTY_BASIC_FORM_VALUES),
    [detail]
  )
  const basicInfoForm = useForm<SchoolDetailBasicFormValues>({
    resolver: zodResolver(schoolDetailBasicFormSchema),
    defaultValues: defaultBasicValues,
    mode: 'onBlur',
  })
  const { reset: resetBasicForm } = basicInfoForm

  useEffect(() => {
    if (detail) resetBasicForm(detailToBasicFormValues(detail))
  }, [detail, resetBasicForm])

  useLayoutEffect(() => {
    if (isBasicEditMode && detail) resetBasicForm(detailToBasicFormValues(detail))
  }, [isBasicEditMode, detail, resetBasicForm])

  useEffect(() => {
    if (!open) setIsBasicEditMode(false)
  }, [open])

  useEffect(() => {
    if (!open) setCancelApprovalConfirmOpen(false)
  }, [open])

  const handleBasicEditStart = () => {
    if (detail) {
      resetBasicForm(detailToBasicFormValues(detail))
      setIsBasicEditMode(true)
    }
  }

  const handleBasicCancel = () => {
    setIsBasicEditMode(false)
  }

  const handleBasicSave = (values: SchoolDetailBasicFormValues) => {
    const patch = basicFormValuesToDetailPatch(values)
    onSaveBasicInfo?.({ ...patch, id: detail!.id })
    setIsBasicEditMode(false)
  }

  const instructorForm = useForm<InstructorListFormValues>({
    defaultValues: { instructors: [] },
  })
  const {
    control: instructorControl,
    reset: resetInstructorForm,
    watch: watchInstructors,
    setValue: setInstructorValue,
    handleSubmit: handleInstructorSubmit,
    formState: instructorFormState,
  } = instructorForm
  const { isDirty: isInstructorDirty } = instructorFormState
  useFieldArray({ control: instructorControl, name: 'instructors' })

  useEffect(() => {
    if (!open) {
      setIsInstructorEditMode(false)
      setAddInstructorAssignModalOpen(false)
    }
  }, [open])

  useEffect(() => {
    if (detail) resetInstructorForm(instructorsToFormValues(detail.instructors))
  }, [detail, resetInstructorForm])

  useLayoutEffect(() => {
    if (isInstructorEditMode && detail)
      resetInstructorForm(instructorsToFormValues(detail.instructors))
  }, [isInstructorEditMode, detail, resetInstructorForm])

  const handleInstructorEditStart = () => {
    if (detail) {
      resetInstructorForm(instructorsToFormValues(detail.instructors))
      setIsInstructorEditMode(true)
    }
  }

  const handleInstructorSave = (values: InstructorListFormValues) => {
    onSaveInstructorInfo?.(detail!.id, values.instructors)
    setIsInstructorEditMode(false)
  }

  /** 추가 배정 모달: 선택 가능한 강사 옵션 (이미 이 학교에 배정된 강사 제외) */
  const addInstructorAssignOptions = useMemo((): AddInstructorAssignOption[] => {
    if (!detail) return []
    const assignedIds = new Set(detail.instructors.map(i => i.id))
    return MOCK_PARTICIPATING_INSTRUCTORS.filter(r => !assignedIds.has(r.id)).map(r => ({
      value: r.id,
      label: r.instructorName,
      contact: r.contact,
      email: r.email,
      initialApproval: r.initialApproval ?? true,
    }))
  }, [detail])

  const addInstructorAssignSessionOptions = useMemo(
    () => MOCK_INSTRUCTOR_ASSIGN_SESSION_OPTIONS,
    []
  )

  const handleAddInstructorAssign = (
    instructorId: string,
    role: InstructorRoleKey,
    option: AddInstructorAssignOption,
    _meta?: { isNewApproval?: boolean; sessionIds?: string[] }
  ) => {
    if (!detail) return
    let currentList: InstructorListFormInstructor[] = isInstructorEditMode
      ? (watchInstructors('instructors') ?? [])
      : instructorsToFormValues(detail.instructors).instructors
    if (role === 'lead') {
      currentList = currentList.map(i => ({ ...i, role: 'assistant' as InstructorRoleKey }))
    }
    const newRow: InstructorListFormInstructor = {
      id: instructorId,
      role,
      instructorName: option.label,
      contact: option.contact ?? '-',
      email: option.email ?? '-',
    }
    const newList = [...currentList, newRow]
    onSaveInstructorInfo?.(detail.id, newList)
    if (isInstructorEditMode) {
      setInstructorValue('instructors', newList)
    }
    setAddInstructorAssignModalOpen(false)
  }

  const instructorColumns: ColumnsType<SchoolDetailInstructorRow> = useMemo(
    () => [
      {
        title: '역할',
        dataIndex: 'role',
        key: 'role',
        width: 100,
        align: 'center',
        render: (r: InstructorRoleKey) => (
          <span
            className={
              r === 'lead'
                ? 'school-detail-fullpage-view__role-tag school-detail-fullpage-view__role-tag--lead'
                : 'school-detail-fullpage-view__role-tag school-detail-fullpage-view__role-tag--assistant'
            }
          >
            {INSTRUCTOR_ROLE_LABELS[r]}
          </span>
        ),
      },
      {
        title: '강사명',
        dataIndex: 'instructorName',
        key: 'instructorName',
        width: 100,
        align: 'center',
      },
      { title: '연락처', dataIndex: 'contact', key: 'contact', width: 140, align: 'center' },
      {
        title: '이메일',
        dataIndex: 'email',
        key: 'email',
        width: 200,
        align: 'center',
        ellipsis: true,
      },
      {
        title: '정산 현황',
        dataIndex: 'settlementStatus',
        key: 'settlementStatus',
        width: 140,
        align: 'center',
        render: (s: SettlementStatusKey) => <SettlementStatusBadge status={s} />,
      },
    ],
    []
  )

  const instructorColumnsEdit: ColumnsType<InstructorListFormInstructor> = useMemo(
    () =>
      detail
        ? [
            {
              title: '역할',
              key: 'role',
              width: 140,
              align: 'center',
              render: (_: unknown, __: unknown, index: number) => (
                <Controller
                  control={instructorControl}
                  name={`instructors.${index}.role`}
                  render={({ field }) => (
                    <Radio.Group
                      {...field}
                      options={[
                        { label: INSTRUCTOR_ROLE_LABELS.lead, value: 'lead' },
                        { label: INSTRUCTOR_ROLE_LABELS.assistant, value: 'assistant' },
                      ]}
                      onChange={e => {
                        const value = e.target.value as InstructorRoleKey
                        field.onChange(value)
                        if (value === 'lead') {
                          const list = watchInstructors('instructors') ?? []
                          list.forEach((_, idx) => {
                            if (idx !== index)
                              setInstructorValue(`instructors.${idx}.role`, 'assistant')
                          })
                        }
                      }}
                      className="school-detail-modal__instructor-role-radios"
                    />
                  )}
                />
              ),
            },
            {
              title: '강사명',
              key: 'instructorName',
              width: 120,
              align: 'center',
              render: (_: unknown, __: unknown, index: number) => (
                <Controller
                  control={instructorControl}
                  name={`instructors.${index}.instructorName`}
                  render={({ field }) => (
                    <Input {...field} size="small" className="school-detail-modal__cell-input" />
                  )}
                />
              ),
            },
            {
              title: '연락처',
              key: 'contact',
              width: 140,
              align: 'center',
              render: (_: unknown, __: unknown, index: number) => (
                <Controller
                  control={instructorControl}
                  name={`instructors.${index}.contact`}
                  render={({ field }) => (
                    <Input {...field} size="small" className="school-detail-modal__cell-input" />
                  )}
                />
              ),
            },
            {
              title: '이메일',
              key: 'email',
              width: 200,
              align: 'center',
              render: (_: unknown, __: unknown, index: number) => (
                <Controller
                  control={instructorControl}
                  name={`instructors.${index}.email`}
                  render={({ field }) => (
                    <Input {...field} size="small" className="school-detail-modal__cell-input" />
                  )}
                />
              ),
            },
            {
              title: '정산 현황',
              key: 'settlementStatus',
              width: 140,
              align: 'center',
              render: (_: unknown, record: InstructorListFormInstructor) => {
                const row = detail.instructors.find(i => i.id === record.id)
                return row ? <SettlementStatusBadge status={row.settlementStatus} /> : null
              },
            },
          ]
        : [],
    [detail, instructorControl, watchInstructors, setInstructorValue]
  )

  if (!detail) return null

  const mealDisplay = detail.mealProvided ? `제공 | ${detail.mealNotice ?? ''}` : '미제공'
  const teacherDisplay = [
    detail.teacherName && `문의처 : ${detail.teacherName}`,
    detail.teacherPhone && `Tel: ${detail.teacherPhone}`,
    detail.teacherEmail && `E-mail: ${detail.teacherEmail}`,
  ]
    .filter(Boolean)
    .join(' | ')
  const classDisplay = `${detail.classCount}개 학급 | 총 ${detail.studentCount}명`
  const waitingDisplay =
    detail.waitingRoomAvailable && detail.waitingRoomLocation
      ? `있음 | ${detail.waitingRoomLocation}`
      : '없음'

  /* 기획 시안 순서(school-detail-modal-view-edit-comparison.md): 1행 참여학교명|지역, 2행 대상학년|학급수, 3행 진행장소|대기실, 풀폭 식사·담당교사 */
  const schoolNameCell =
    detail.scheduleChangeCancelCount != null && detail.scheduleChangeCancelCount > 0 ? (
      <>
        {detail.schoolName}
        <ScheduleChangeHistoryBadge count={detail.scheduleChangeCancelCount} />
      </>
    ) : (
      detail.schoolName
    )
  const basicInfoItems = [
    { key: 'schoolName', label: '참여 학교명', children: schoolNameCell },
    { key: 'region', label: '지역', children: detail.region },
    { key: 'educationGrade', label: '대상 학년', children: detail.educationGrade },
    { key: 'classCount', label: '학급 수 및 전체 인원', children: classDisplay },
    { key: 'venue', label: '진행 장소', children: detail.venue ?? '-' },
    { key: 'waitingRoom', label: '대기실 여부 및 위치', children: waitingDisplay },
    { key: 'meal', label: '식사 제공 여부 및 안내', children: mealDisplay, span: 2 },
    { key: 'teacher', label: '담당 교사', children: teacherDisplay || '-', span: 2 },
  ]

  /* 디자이너 시안 순서: 강의 진행 회차·교재 현황 | 교재명·교재 준비 수량 */
  const lectureItems = [
    { key: 'lectureRound', label: '강의 진행 회차', children: detail.lectureRound },
    {
      key: 'textbookStatus',
      label: '교재 현황',
      children: <TextbookStatusBadge status={detail.textbookStatus} />,
    },
    { key: 'textbookName', label: '교재명', children: detail.textbookName ?? '-' },
    {
      key: 'textbookQuantity',
      label: '교재 준비 수량',
      children: detail.textbookQuantity != null ? `${detail.textbookQuantity}권` : '-',
    },
  ]

  /** 수정 모드 시 강의·교재 정보: 교재 현황만 라디오로 선택 가능 */
  function getLectureItemsEditMode(form: ReturnType<typeof useForm<SchoolDetailBasicFormValues>>) {
    const { control } = form
    const textbookStatusOptions: { label: string; value: TextbookStatusKey }[] = [
      { label: TEXTBOOK_STATUS_LABELS.preparing, value: 'preparing' },
      { label: TEXTBOOK_STATUS_LABELS.shipping, value: 'shipping' },
      { label: TEXTBOOK_STATUS_LABELS.delivered, value: 'delivered' },
    ]
    const d = detail!
    return [
      { key: 'lectureRound', label: '강의 진행 회차', children: d.lectureRound },
      {
        key: 'textbookStatus',
        label: '교재 현황',
        children: (
          <Controller
            name="textbookStatus"
            control={control}
            render={({ field }) => (
              <Radio.Group
                {...field}
                options={textbookStatusOptions}
                onChange={e => field.onChange(e.target.value)}
                className="school-detail-modal__textbook-status-radios"
              />
            )}
          />
        ),
      },
      { key: 'textbookName', label: '교재명', children: d.textbookName ?? '-' },
      {
        key: 'textbookQuantity',
        label: '교재 준비 수량',
        children: d.textbookQuantity != null ? `${d.textbookQuantity}권` : '-',
      },
    ]
  }

  /**
   * 수정 모드 기본 정보: 기획 시안과 동일한 필드 순서 (1행 참여학교명|지역, 2행 대상학년|학급수, 3행 진행장소|대기실, 풀폭 식사·담당교사)
   */
  function getBasicInfoEditModeItems(
    form: ReturnType<typeof useForm<SchoolDetailBasicFormValues>>
  ) {
    const editableItems = basicInfoEditableItems(form)
    const byKey = (key: string) => editableItems.find(item => item.key === key)!
    return [
      { key: 'schoolName', label: '참여 학교명', children: schoolNameCell },
      { key: 'region', label: '지역', children: detail?.region },
      { key: 'educationGrade', label: '대상 학년', children: detail?.educationGrade },
      { key: 'classCount', label: '학급 수 및 전체 인원', children: classDisplay },
      byKey('venue'),
      byKey('waitingRoom'),
      byKey('meal'),
      byKey('teacher'),
    ]
  }

  /** 수정 가능 필드만: 진행 장소, 대기실 여부 및 위치, 식사 제공 여부 및 안내, 담당 교사 */
  function basicInfoEditableItems(form: ReturnType<typeof useForm<SchoolDetailBasicFormValues>>) {
    const { control } = form
    return [
      {
        key: 'venue',
        label: '진행 장소',
        children: (
          <Controller
            name="venue"
            control={control}
            render={({ field }) => (
              <Input {...field} className="school-detail-modal__form-input" allowClear />
            )}
          />
        ),
      },
      {
        key: 'waitingRoom',
        label: '대기실 여부 및 위치',
        children: (
          <Controller
            name="waitingRoomAvailable"
            control={control}
            render={({ field: radioField }) => (
              <Controller
                name="waitingRoomLocation"
                control={control}
                render={({ field: locField }) => (
                  <div
                    className="school-detail-modal__form-row-with-divider"
                    role="radiogroup"
                    aria-label="대기실 여부 및 위치"
                  >
                    <Radio.Group
                      {...radioField}
                      onChange={e => radioField.onChange(e.target.value)}
                      options={[
                        { label: '있음', value: true },
                        { label: '없음', value: false },
                      ]}
                    />
                    {radioField.value && (
                      <>
                        <span className="school-detail-modal__divider-v" aria-hidden />
                        <Input
                          {...locField}
                          placeholder="위치 입력"
                          className="school-detail-modal__form-input school-detail-modal__form-input--flex"
                          allowClear
                        />
                      </>
                    )}
                  </div>
                )}
              />
            )}
          />
        ),
      },
      {
        key: 'meal',
        label: '식사 제공 여부 및 안내',
        span: 2,
        children: (
          <Controller
            name="mealProvided"
            control={control}
            render={({ field: radioField }) => (
              <Controller
                name="mealNotice"
                control={control}
                render={({ field: noticeField }) => (
                  <div
                    className="school-detail-modal__form-row-with-divider school-detail-modal__form-row-with-divider--textarea"
                    role="radiogroup"
                    aria-label="식사 제공 여부 및 안내"
                  >
                    <Radio.Group
                      {...radioField}
                      onChange={e => radioField.onChange(e.target.value)}
                      options={[
                        { label: '제공', value: true },
                        { label: '미제공', value: false },
                      ]}
                    />
                    {radioField.value && (
                      <>
                        <span className="school-detail-modal__divider-v" aria-hidden />
                        <TextArea
                          {...noticeField}
                          placeholder="식사 안내 문구"
                          rows={1}
                          className="school-detail-modal__form-textarea"
                          allowClear
                        />
                      </>
                    )}
                  </div>
                )}
              />
            )}
          />
        ),
      },
      {
        key: 'teacher',
        label: '담당 교사',
        span: 2,
        children: (
          <div className="school-detail-modal__form-teacher">
            <div className="school-detail-modal__form-teacher-segment">
              <span className="school-detail-modal__form-teacher-label">문의처</span>
              <Controller
                name="teacherName"
                control={control}
                render={({ field }) => (
                  <Input {...field} className="school-detail-modal__form-input" allowClear />
                )}
              />
            </div>
            <span className="school-detail-modal__divider-v" aria-hidden />
            <div className="school-detail-modal__form-teacher-segment">
              <span className="school-detail-modal__form-teacher-label">Tel</span>
              <Controller
                name="teacherPhone"
                control={control}
                render={({ field }) => (
                  <Input {...field} className="school-detail-modal__form-input" allowClear />
                )}
              />
            </div>
            <span className="school-detail-modal__divider-v" aria-hidden />
            <div className="school-detail-modal__form-teacher-segment">
              <span className="school-detail-modal__form-teacher-label">E-mail</span>
              <Controller
                name="teacherEmail"
                control={control}
                render={({ field }) => (
                  <Input {...field} className="school-detail-modal__form-input" allowClear />
                )}
              />
            </div>
          </div>
        ),
      },
    ]
  }

  const handleClose = () => {
    const basicDirty = isBasicEditMode && basicInfoForm.formState.isDirty
    const instructorDirty = isInstructorEditMode && instructorFormState.isDirty
    if (basicDirty || instructorDirty) {
      modal.confirm({
        title: '저장하지 않은 변경 사항이 있습니다.',
        content: '계속하시겠습니까?',
        okText: '계속',
        cancelText: '취소',
        onOk: () => onCancel(),
      })
    } else {
      onCancel()
    }
  }

  const footer = (
    <AppButton variant="cancel" size="large" onClick={handleClose}>
      닫기
    </AppButton>
  )

  const tabItems = [
    {
      key: TAB_BASIC,
      label: '기본 정보',
      children: (
        <div className="school-detail-modal__basic">
          <div className="school-detail-modal__basic-top">
            <div className="school-detail-modal__basic-header-row">
              <span className="school-detail-modal__section-title">기본 정보</span>
              <span className="school-detail-modal__notice">
                학교 담당자(교사) 및 관리자만 작성/수정이 가능합니다.
              </span>
            </div>
            {!isApplicant && isBasicEditMode ? (
              <div className="school-detail-modal__basic-actions">
                <AppButton variant="cancel" size="middle" onClick={handleBasicCancel}>
                  취소
                </AppButton>
                <AppButton
                  variant="primary"
                  size="middle"
                  modalTeal
                  onClick={basicInfoForm.handleSubmit(handleBasicSave)}
                >
                  저장
                </AppButton>
              </div>
            ) : !isApplicant ? (
              <AppButton variant="cancel" size="middle" onClick={handleBasicEditStart}>
                수정
              </AppButton>
            ) : null}
          </div>
          <div className="school-detail-modal__descriptions-wrap">
            {isBasicEditMode ? (
              <>
                <Descriptions
                  column={2}
                  bordered
                  size="middle"
                  className="school-detail-modal__descriptions"
                  labelStyle={{ background: '#EDF0F2' }}
                  items={getBasicInfoEditModeItems(basicInfoForm)}
                />
                {!isApplicant && (
                  <Descriptions
                    column={2}
                    bordered
                    size="middle"
                    className="school-detail-modal__descriptions"
                    labelStyle={{ background: '#EDF0F2' }}
                    items={getLectureItemsEditMode(basicInfoForm)}
                  />
                )}
              </>
            ) : (
              <>
                <Descriptions
                  column={2}
                  bordered
                  size="middle"
                  className="school-detail-modal__descriptions"
                  labelStyle={{ background: '#EDF0F2' }}
                  items={basicInfoItems}
                />
                {!isApplicant && (
                  <Descriptions
                    column={2}
                    bordered
                    size="middle"
                    className="school-detail-modal__descriptions"
                    labelStyle={{ background: '#EDF0F2' }}
                    items={lectureItems}
                  />
                )}
              </>
            )}
          </div>
          {!isApplicant && (
            <div className="school-detail-modal__instructor-section">
              <div className="school-detail-modal__instructor-header">
                <div className="school-detail-modal__basic-header-row">
                  <span className="school-detail-modal__instructor-title">강사진 정보</span>
                  <span className="school-detail-modal__notice">
                    총{' '}
                    {isInstructorEditMode
                      ? (watchInstructors('instructors')?.length ?? 0)
                      : detail.instructors.length}
                    건
                  </span>
                </div>
                <div className="school-detail-modal__instructor-actions">
                  {isInstructorEditMode ? (
                    <>
                      <AppButton
                        variant="primary"
                        size="middle"
                        modalTeal
                        disabled={!isInstructorDirty}
                        onClick={() => handleInstructorSubmit(handleInstructorSave)()}
                      >
                        저장
                      </AppButton>
                      <AppButton
                        variant="primary"
                        size="middle"
                        modalTeal
                        onClick={() => setAddInstructorAssignModalOpen(true)}
                      >
                        추가 배정
                      </AppButton>
                    </>
                  ) : (
                    <>
                      <AppButton variant="cancel" size="middle" onClick={handleInstructorEditStart}>
                        수정
                      </AppButton>
                      <AppButton
                        variant="primary"
                        size="middle"
                        modalTeal
                        onClick={() => setAddInstructorAssignModalOpen(true)}
                      >
                        추가 배정
                      </AppButton>
                    </>
                  )}
                </div>
              </div>
              {isInstructorEditMode && (
                <p className="school-detail-modal__instructor-edit-notice">
                  대표 강사 선택 시, 다른 강사들은 자동으로 일반 강사로 변경됩니다.
                </p>
              )}
              {isInstructorEditMode ? (
                <Table<InstructorListFormInstructor>
                  rowKey="id"
                  size="middle"
                  pagination={false}
                  rowSelection={{
                    selectedRowKeys: selectedInstructorKeys,
                    onChange: keys => setSelectedInstructorKeys(keys),
                  }}
                  columns={instructorColumnsEdit}
                  dataSource={watchInstructors('instructors') ?? []}
                  className="school-detail-modal__instructor-table cms-data-table cms-data-table--skip-auto-no-col"
                />
              ) : (
                <Table<SchoolDetailInstructorRow>
                  rowKey="id"
                  size="middle"
                  pagination={false}
                  rowSelection={{
                    selectedRowKeys: selectedInstructorKeys,
                    onChange: keys => setSelectedInstructorKeys(keys),
                  }}
                  columns={instructorColumns}
                  dataSource={detail.instructors}
                  className="school-detail-modal__instructor-table cms-data-table cms-data-table--skip-auto-no-col"
                />
              )}
            </div>
          )}
        </div>
      ),
    },
    {
      key: TAB_STUDENTS,
      label: '학생 명단',
      children: detail ? (
        <SchoolDetailStudentListSection
          schoolId={detail.id}
          studentCount={detail.studentCount}
          onSaveEdit={() => {}}
        />
      ) : null,
    },
    {
      key: TAB_POSTS,
      label: '게시글',
      disabled: true,
      children: (
        <div className="school-detail-modal__posts">
          <p className="school-detail-modal__posts-placeholder">준비 중입니다.</p>
        </div>
      ),
    },
  ]

  return (
    <>
      <TealHeaderModal open={open} onCancel={onCancel} title={title} size="large" footer={footer}>
        <div className="school-detail-modal">
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={tabItems}
            className="school-detail-modal__tabs"
            renderTabBar={(tabBarProps, DefaultTabBar) => (
              <>
                <div className="school-detail-modal__top">
                  <DefaultTabBar {...tabBarProps} className="school-detail-modal__tabs-nav" />
                  {isApplicant && activeTab !== TAB_STUDENTS && (
                    <div className="school-detail-modal__top-actions school-detail-modal__basic-actions school-detail-modal__basic-actions--approval">
                      <AppButton variant="danger" size="filter" onClick={() => {}}>
                        반려
                      </AppButton>
                      <AppButton variant="primary" size="filter" modalTeal onClick={() => {}}>
                        승인
                      </AppButton>
                    </div>
                  )}
                  {!isApplicant && activeTab === TAB_BASIC && (
                    <div className="school-detail-modal__top-actions school-detail-modal__basic-actions">
                      <AppButton
                        variant="danger"
                        size="filter"
                        disabled={isCancelApprovalDisabled}
                        title={cancelApprovalDisabledReason ?? undefined}
                        onClick={() => setCancelApprovalConfirmOpen(true)}
                      >
                        승인 취소
                      </AppButton>
                    </div>
                  )}
                </div>
              </>
            )}
          />
        </div>
      </TealHeaderModal>
      {cancelApprovalConfirmOpen && detail && onCancelApproval && (
        <DeleteGuideModal
          open={cancelApprovalConfirmOpen}
          onCancel={() => setCancelApprovalConfirmOpen(false)}
          onConfirm={() => {
            onCancelApproval(detail.id)
            setCancelApprovalConfirmOpen(false)
          }}
          title="승인 취소 안내"
          lines={buildSchoolCancelApprovalMessageLines(
            participatingRow?.schoolName ?? detail.schoolName
          )}
          confirmText="취소"
          confirmVariant="delete"
          zIndex={1100}
        />
      )}
      <SchoolDetailAddInstructorAssignModal
        open={addInstructorAssignModalOpen}
        onCancel={() => setAddInstructorAssignModalOpen(false)}
        schoolName={detail?.schoolName ?? ''}
        instructorOptions={addInstructorAssignOptions}
        assignmentSessionOptions={addInstructorAssignSessionOptions}
        currentLeadInstructorName={
          detail?.instructors.find(i => i.role === 'lead')?.instructorName ?? null
        }
        currentAssignedCount={detail?.instructors.length ?? 0}
        requiredInstructorCount={4}
        onAdd={handleAddInstructorAssign}
      />
    </>
  )
}
