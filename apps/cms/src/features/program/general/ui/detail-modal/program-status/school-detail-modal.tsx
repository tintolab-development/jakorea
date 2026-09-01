/**
 * 학교 상세 정보 모달
 * 프로그램 진행현황 > 참여 학교 정보 탭에서 행 클릭 시 노출 (large 모달, 탭: 기본 정보 | 학생 명단)
 * 명세: docs/design/school-detail-modal-spec.md
 * 학생 명단 탭 수정 모드: docs/design/school-detail-modal-student-list-edit-spec.md
 */

import { useEffect, useLayoutEffect, useMemo, useState } from 'react'
import { Tabs, Table, Input } from 'antd'
import { useForm, useFieldArray, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CmsButton, CMS_ACTION_BUTTON_WIDTH, CmsRadio } from '@/shared/ui'
import { ConfirmModal } from '@/shared/ui/confirm-modal'
import type { ColumnsType } from 'antd/es/table'
import { ContentModal } from '@/shared/ui/content-modal'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { renderDetailInfoPipeSeparated } from '@/features/program/shared/ui/program-detail-td-divider'
import '@/features/program/shared/ui/program-detail/applicant-list/applicant-instructor-basic-info.css'
import type {
  SchoolDetailForModal,
  SchoolDetailInstructorRow,
  InstructorListFormValues,
  InstructorListFormInstructor,
} from '../../../model/school-detail-types'
import type { InstructorRoleKey } from '../../../model/school-detail-types'
import { INSTRUCTOR_ROLE_LABELS } from '../../../model/school-detail-types'
import {
  schoolDetailBasicFormSchema,
  detailToBasicFormValues,
  basicFormValuesToDetailPatch,
  EMPTY_BASIC_FORM_VALUES,
  type SchoolDetailBasicFormValues,
} from '../../../model/school-detail-basic-form-schema'
import type { InstructorSettlementUiStatus } from '@/shared/constants/instructor-settlement-status'
import { TextbookStatusBadge } from '@/shared/components/textbook-status-badge'
import { InstructorPaymentStatusBadge } from '@/shared/components/instructor-payment-status-badge'
import { ScheduleChangeHistoryBadge } from '@/shared/components/schedule-change-history-badge'
import { MOCK_PARTICIPATING_INSTRUCTORS } from '@/data/mock/participating-instructors'
import type { ParticipatingInstructorRow } from '@/data/mock/participating-instructors'
import {
  TEXTBOOK_STATUS_LABELS,
  TEXTBOOK_STATUS_OPTION_KEYS,
  type ParticipatingSchoolRow,
} from '@/data/mock/participating-schools'
import {
  SchoolDetailAddInstructorAssignModal,
} from './school-detail-add-instructor-assign-modal'
import { SchoolDetailAssignCompleteModal } from './school-detail-assign-complete-modal'
import { buildProgramApprovedInstructorAssignOptions } from '../../../lib/school-add-instructor-assign'
import { SchoolDetailStudentListSection } from './school-detail-student-list-section'
import { DeleteGuideModal } from '@/shared/ui/delete-guide-modal'
import { buildSchoolCancelApprovalMessageLines } from '../../manager-delete-guide-modal'
import { EditableStatusBadge } from '@/shared/components'
import { getInstructorRoleBadgeTone } from '@/shared/constants/editable-status-badge-tones'
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
  /** 프로그램 id — 추가 배정 시 승인된 강사 목록 조회용 */
  programId?: string
  /** 진행현황 참여 강사 목록(API). 미전달 시 mock 폴백 */
  participatingInstructorList?: ParticipatingInstructorRow[]
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
  programId = '',
  participatingInstructorList = MOCK_PARTICIPATING_INSTRUCTORS,
  onCancelApproval,
}: SchoolDetailModalProps) {
  const [unsavedCloseConfirmOpen, setUnsavedCloseConfirmOpen] = useState(false)
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
  const [assignCompleteModal, setAssignCompleteModal] = useState<{
    instructorName: string
    schoolName: string
    currentCount: number
    showApprovalAlarmSection: boolean
  } | null>(null)
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

  const assignedInstructorNames = useMemo(
    () => detail?.instructors.map(i => i.instructorName) ?? [],
    [detail?.instructors]
  )

  const addInstructorAssignOptions = useMemo(() => {
    if (!programId) return []
    return buildProgramApprovedInstructorAssignOptions(programId, assignedInstructorNames)
  }, [programId, assignedInstructorNames])

  const handleAddInstructorAssign = (
    instructorId: string,
    role: InstructorRoleKey,
    option: (typeof addInstructorAssignOptions)[number],
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
    setAssignCompleteModal({
      instructorName: option.label,
      schoolName: detail.schoolName,
      currentCount: newList.length,
      showApprovalAlarmSection: _meta?.isNewApproval ?? false,
    })
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
          <EditableStatusBadge
            label={INSTRUCTOR_ROLE_LABELS[r]}
            tone={getInstructorRoleBadgeTone(r)}
          />
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
        render: (s: InstructorSettlementUiStatus) => <InstructorPaymentStatusBadge status={s} />,
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
                    <CmsRadio.Group
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
                return row ? <InstructorPaymentStatusBadge status={row.settlementStatus} /> : null
              },
            },
          ]
        : [],
    [detail, instructorControl, watchInstructors, setInstructorValue]
  )

  if (!detail) return null

  const mealDisplay = detail.mealProvided
    ? renderDetailInfoPipeSeparated(`제공 | ${detail.mealNotice ?? ''}`)
    : '미제공'
  const teacherDisplay = renderDetailInfoPipeSeparated(
    [
      detail.teacherName && `문의처 : ${detail.teacherName}`,
      detail.teacherPhone && `Tel: ${detail.teacherPhone}`,
      detail.teacherEmail && `E-mail: ${detail.teacherEmail}`,
    ]
      .filter(Boolean)
      .join(' | ') || undefined
  )
  const classDisplay = renderDetailInfoPipeSeparated(
    `${detail.classCount}개 학급 | 총 ${detail.studentCount}명`
  )
  const waitingDisplay =
    detail.waitingRoomAvailable && detail.waitingRoomLocation
      ? renderDetailInfoPipeSeparated(`있음 | ${detail.waitingRoomLocation}`)
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

  const basicInfoFormMode = isBasicEditMode ? 'edit' : 'view'
  const { control: basicControl } = basicInfoForm
  const textbookStatusOptions = TEXTBOOK_STATUS_OPTION_KEYS.map(value => ({
    label: TEXTBOOK_STATUS_LABELS[value],
    value,
  }))

  const basicInfoTitleTrailing = !isApplicant ? (
    isBasicEditMode ? (
      <div className="school-detail-modal__basic-actions">
        <CmsButton variant="secondary" size="medium" onClick={handleBasicCancel}>
          취소
        </CmsButton>
        <CmsButton
          variant="primary"
          size="medium"
          onClick={basicInfoForm.handleSubmit(handleBasicSave)}
        >
          저장
        </CmsButton>
      </div>
    ) : (
      <CmsButton variant="secondary" size="medium" onClick={handleBasicEditStart}>
        수정
      </CmsButton>
    )
  ) : null

  const handleClose = () => {
    const basicDirty = isBasicEditMode && basicInfoForm.formState.isDirty
    const instructorDirty = isInstructorEditMode && instructorFormState.isDirty
    if (basicDirty || instructorDirty) {
      setUnsavedCloseConfirmOpen(true)
    } else {
      onCancel()
    }
  }

  const footer = (
    <CmsButton variant="secondary" size="large" onClick={handleClose}>
      닫기
    </CmsButton>
  )

  const tabItems = [
    {
      key: TAB_BASIC,
      label: '기본 정보',
      children: (
        <div className="school-detail-modal__basic">
          <div className="applicant-instructor-basic-info">
            <DetailInfoForm
              title="기본 정보"
              description="학교 담당자(교사) 및 관리자만 작성/수정이 가능합니다."
              titleTrailing={basicInfoTitleTrailing}
              mode={basicInfoFormMode}
            >
              <DetailInfoForm.Row type="double">
                <DetailInfoForm.Field label="참여 학교명" view={schoolNameCell} readOnlyDisplay />
                <DetailInfoForm.Field label="지역" view={detail.region} readOnlyDisplay />
              </DetailInfoForm.Row>
              <DetailInfoForm.Row type="double">
                <DetailInfoForm.Field
                  label="대상 학년"
                  view={detail.educationGrade}
                  readOnlyDisplay
                />
                <DetailInfoForm.Field
                  label="학급 수 및 전체 인원"
                  view={classDisplay}
                  readOnlyDisplay
                />
              </DetailInfoForm.Row>
              <DetailInfoForm.Row type="double">
                <DetailInfoForm.Field
                  label="진행 장소"
                  view={detail.venue ?? '-'}
                  edit={
                    <Controller
                      name="venue"
                      control={basicControl}
                      render={({ field }) => (
                        <Input {...field} className="school-detail-modal__form-input" allowClear />
                      )}
                    />
                  }
                />
                <DetailInfoForm.Field
                  label="대기실 여부 및 위치"
                  view={waitingDisplay}
                  edit={
                    <Controller
                      name="waitingRoomAvailable"
                      control={basicControl}
                      render={({ field: radioField }) => (
                        <Controller
                          name="waitingRoomLocation"
                          control={basicControl}
                          render={({ field: locField }) => (
                            <div
                              className="school-detail-modal__form-row-with-divider"
                              role="radiogroup"
                              aria-label="대기실 여부 및 위치"
                            >
                              <CmsRadio.Group
                                {...radioField}
                                onChange={e => radioField.onChange(e.target.value)}
                                options={[
                                  { label: '있음', value: true },
                                  { label: '없음', value: false },
                                ]}
                              />
                              {radioField.value ? (
                                <>
                                  <span className="school-detail-modal__divider-v" aria-hidden />
                                  <Input
                                    {...locField}
                                    placeholder="위치 입력"
                                    className="school-detail-modal__form-input school-detail-modal__form-input--flex"
                                    allowClear
                                  />
                                </>
                              ) : null}
                            </div>
                          )}
                        />
                      )}
                    />
                  }
                />
              </DetailInfoForm.Row>
              <DetailInfoForm.Row type="single">
                <DetailInfoForm.Field
                  label="식사 제공 여부 및 안내"
                  fullRow
                  view={mealDisplay}
                  edit={
                    <Controller
                      name="mealProvided"
                      control={basicControl}
                      render={({ field: radioField }) => (
                        <Controller
                          name="mealNotice"
                          control={basicControl}
                          render={({ field: noticeField }) => (
                            <div
                              className="school-detail-modal__form-row-with-divider school-detail-modal__form-row-with-divider--textarea"
                              role="radiogroup"
                              aria-label="식사 제공 여부 및 안내"
                            >
                              <CmsRadio.Group
                                {...radioField}
                                onChange={e => radioField.onChange(e.target.value)}
                                options={[
                                  { label: '제공', value: true },
                                  { label: '미제공', value: false },
                                ]}
                              />
                              {radioField.value ? (
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
                              ) : null}
                            </div>
                          )}
                        />
                      )}
                    />
                  }
                />
              </DetailInfoForm.Row>
              <DetailInfoForm.Row type="single">
                <DetailInfoForm.Field
                  label="담당 교사"
                  fullRow
                  view={teacherDisplay || '-'}
                  edit={
                    <div className="school-detail-modal__form-teacher">
                      <div className="school-detail-modal__form-teacher-segment">
                        <span className="school-detail-modal__form-teacher-label">문의처</span>
                        <Controller
                          name="teacherName"
                          control={basicControl}
                          render={({ field }) => (
                            <Input
                              {...field}
                              className="school-detail-modal__form-input"
                              allowClear
                            />
                          )}
                        />
                      </div>
                      <span className="school-detail-modal__divider-v" aria-hidden />
                      <div className="school-detail-modal__form-teacher-segment">
                        <span className="school-detail-modal__form-teacher-label">Tel</span>
                        <Controller
                          name="teacherPhone"
                          control={basicControl}
                          render={({ field }) => (
                            <Input
                              {...field}
                              className="school-detail-modal__form-input"
                              allowClear
                            />
                          )}
                        />
                      </div>
                      <span className="school-detail-modal__divider-v" aria-hidden />
                      <div className="school-detail-modal__form-teacher-segment">
                        <span className="school-detail-modal__form-teacher-label">E-mail</span>
                        <Controller
                          name="teacherEmail"
                          control={basicControl}
                          render={({ field }) => (
                            <Input
                              {...field}
                              className="school-detail-modal__form-input"
                              allowClear
                            />
                          )}
                        />
                      </div>
                    </div>
                  }
                />
              </DetailInfoForm.Row>
            </DetailInfoForm>
            {!isApplicant ? (
              <DetailInfoForm title="강의 및 교재 정보" hideHeader mode={basicInfoFormMode}>
                <DetailInfoForm.Row type="double">
                  <DetailInfoForm.Field
                    label="강의 진행 회차"
                    view={detail.lectureRound}
                    readOnlyDisplay
                  />
                  <DetailInfoForm.Field
                    label="교재 현황"
                    view={<TextbookStatusBadge status={detail.textbookStatus} />}
                    edit={
                      <Controller
                        name="textbookStatus"
                        control={basicControl}
                        render={({ field }) => (
                          <CmsRadio.Group
                            {...field}
                            options={textbookStatusOptions}
                            onChange={e => field.onChange(e.target.value)}
                            className="school-detail-modal__textbook-status-radios"
                          />
                        )}
                      />
                    }
                  />
                </DetailInfoForm.Row>
                <DetailInfoForm.Row type="double">
                  <DetailInfoForm.Field
                    label="교재명"
                    view={detail.textbookName ?? '-'}
                    readOnlyDisplay
                  />
                  <DetailInfoForm.Field
                    label="교재 준비 수량"
                    view={
                      detail.textbookQuantity != null ? `${detail.textbookQuantity}권` : '-'
                    }
                    readOnlyDisplay
                  />
                </DetailInfoForm.Row>
              </DetailInfoForm>
            ) : null}
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
                      <CmsButton
                        variant="primary"
                        size="medium"
                        disabled={!isInstructorDirty}
                        onClick={() => handleInstructorSubmit(handleInstructorSave)()}
                      >
                        저장
                      </CmsButton>
                      <CmsButton
                        variant="primary"
                        size="medium"
                        onClick={() => setAddInstructorAssignModalOpen(true)}
                      >
                        추가 배정
                      </CmsButton>
                    </>
                  ) : (
                    <>
                      <CmsButton variant="secondary" size="medium" onClick={handleInstructorEditStart}>
                        수정
                      </CmsButton>
                      <CmsButton
                        variant="primary"
                        size="medium"
                        onClick={() => setAddInstructorAssignModalOpen(true)}
                      >
                        추가 배정
                      </CmsButton>
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
          classCount={detail.classCount}
          schoolName={detail.schoolName ?? ''}
          educationGrade={detail.educationGrade ?? ''}
          participationAppliedAt={detail.participationAppliedAt}
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
      <ContentModal open={open} onCancel={onCancel} title={title} size="large" footer={footer}>
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
                      <CmsButton
                        variant="delete"
                        size="large"
                        className="cms-button--action"
                        width={CMS_ACTION_BUTTON_WIDTH}
                        onClick={() => {}}
                      >
                        반려
                      </CmsButton>
                      <CmsButton
                        variant="primary"
                        size="large"
                        className="cms-button--action"
                        width={CMS_ACTION_BUTTON_WIDTH}
                        onClick={() => {}}
                      >
                        승인
                      </CmsButton>
                    </div>
                  )}
                  {!isApplicant && activeTab === TAB_BASIC && (
                    <div className="school-detail-modal__top-actions school-detail-modal__basic-actions">
                      <CmsButton
                        variant="delete"
                        size="large"
                        className="cms-button--action"
                        width={CMS_ACTION_BUTTON_WIDTH}
                        disabled={isCancelApprovalDisabled}
                        title={cancelApprovalDisabledReason ?? undefined}
                        onClick={() => setCancelApprovalConfirmOpen(true)}
                      >
                        승인 취소
                      </CmsButton>
                    </div>
                  )}
                </div>
              </>
            )}
          />
        </div>
      </ContentModal>
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
        programId={programId}
        schoolId={participatingRow?.id ?? detail?.id ?? ''}
        schoolName={detail?.schoolName ?? ''}
        schoolSessions={participatingRow?.sessions}
        participatingInstructorList={participatingInstructorList}
        assignedInstructorNames={assignedInstructorNames}
        instructorOptions={addInstructorAssignOptions}
        currentLeadInstructorName={
          detail?.instructors.find(i => i.role === 'lead')?.instructorName ?? null
        }
        currentAssignedCount={detail?.instructors.length ?? 0}
        requiredInstructorCount={4}
        onAdd={handleAddInstructorAssign}
      />
      <SchoolDetailAssignCompleteModal
        open={assignCompleteModal != null}
        onClose={() => setAssignCompleteModal(null)}
        instructorName={assignCompleteModal?.instructorName ?? ''}
        schoolName={assignCompleteModal?.schoolName ?? ''}
        currentCount={assignCompleteModal?.currentCount ?? 0}
        requiredCount={4}
        showApprovalAlarmSection={assignCompleteModal?.showApprovalAlarmSection ?? false}
      />
      <ConfirmModal
        open={unsavedCloseConfirmOpen}
        title="저장하지 않은 변경 사항이 있습니다."
        content="계속하시겠습니까?"
        confirmText="계속"
        cancelText="취소"
        onConfirm={() => {
          setUnsavedCloseConfirmOpen(false)
          onCancel()
        }}
        onCancel={() => setUnsavedCloseConfirmOpen(false)}
      />
    </>
  )
}
