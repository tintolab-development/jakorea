/**
 * 학교 상세정보 – 강사 배정 안내 모달
 * 스펙(스크린샷): width 800 · 패딩 26/30/34 · 섹션 간격 30px
 * 대표 강사 지정 → 강사명 → 교육 배정일(1열 칩 리스트) · 취소/강사 배정
 */

import { useEffect, useMemo, useState } from 'react'
import { Form } from 'antd'
import { ContentModal } from '@/shared/ui/content-modal'
import { CmsButton, CmsRadio, CmsSelect } from '@/shared/ui'
import type { ParticipatingInstructorRow } from '@/data/mock/participating-instructors'
import type {
  ParticipatingSchoolRow,
  ParticipatingSchoolSession,
} from '@/data/mock/participating-schools'
import type { InstructorRoleKey } from '../../../model/school-detail-types'
import { INSTRUCTOR_ROLE_LABELS } from '../../../model/school-detail-types'
import type { InstructorAssignSessionOption } from '../../../lib/instructor-assign-session-options'
import {
  buildProgramApprovedInstructorAssignOptions,
  buildSchoolAddInstructorAssignSessionOptions,
  type SchoolAddInstructorAssignOption,
} from '../../../lib/school-add-instructor-assign'
import { InstructorAssignSessionSlotChip } from '@/features/program/shared/ui/detail-modal/components/instructor-assign-session-slot-chip'
import { SchoolDetailNewAssignGuideModal } from './school-detail-new-assign-guide-modal'
import { SchoolDetailAssignOverflowModal } from './school-detail-assign-overflow-modal'
import { SchoolDetailLeadInstructorConfirmModal } from './school-detail-lead-instructor-confirm-modal'
import './school-detail-add-instructor-assign-modal.css'

function InstructorAssignSessionTags({
  value,
  onChange,
  options }: {
  value?: string[]
  onChange?: (ids: string[]) => void
  options: InstructorAssignSessionOption[]
}) {
  if (options.length === 0) {
    return (
      <p className="school-detail-add-instructor-assign-modal__session-empty">
        선택 가능한 교육 일정이 없습니다.
      </p>
    )
  }
  return (
    <div
      className="school-detail-add-instructor-assign-modal__session-grid"
      role="group"
      aria-label="교육 배정일 선택"
    >
      {options.map(opt => {
        const selected = value?.includes(opt.id) ?? false
        const isDisabled = Boolean(opt.disabled)
        return (
          <InstructorAssignSessionSlotChip
            key={opt.id}
            scheduleLabel={opt.scheduleLabel}
            sessionRoundLabel={opt.sessionRoundLabel}
            capacityLabel={opt.capacityLabel}
            selected={selected}
            disabled={isDisabled}
            onClick={() => {
              if (isDisabled) return
              const prev = value ?? []
              const next = prev.includes(opt.id)
                ? prev.filter(id => id !== opt.id)
                : [...prev, opt.id]
              onChange?.(next)
            }}
          />
        )
      })}
    </div>
  )
}

export type AddInstructorAssignOption = SchoolAddInstructorAssignOption

export interface AddInstructorAssignFormValues {
  instructorId: string
  role: InstructorRoleKey
  sessionIds: string[]
}

interface LeadConfirmPayload {
  instructorId: string
  role: InstructorRoleKey
  option: AddInstructorAssignOption
  sessionIds: string[]
}

export interface SchoolDetailAddInstructorAssignModalProps {
  open: boolean
  onCancel: () => void
  programId: string
  /** 추가 배정 대상 기관 id */
  schoolId: string
  /** 추가 배정 대상 기관명 (안내 문구 "[기관명]에 추가 배정할 강사님을 선택해 주세요"에 사용) */
  schoolName: string
  /** 기관이 신청한 교육 회차 일정 */
  schoolSessions?: ParticipatingSchoolSession[] | null
  /** 프로그램 참여 강사 목록 (타 기관 배정·일정 불가 판별용) */
  participatingInstructorList?: ParticipatingInstructorRow[]
  participatingSchoolList?: ParticipatingSchoolRow[]
  /** 이미 해당 기관에 배정된 강사명 (선택 목록 제외) */
  assignedInstructorNames?: string[]
  /** @deprecated instructorOptions 대신 programId + assignedInstructorNames 사용 권장 */
  instructorOptions?: AddInstructorAssignOption[]
  /** @deprecated schoolSessions 기반 자동 생성. 하위 호환용 */
  assignmentSessionOptions?: InstructorAssignSessionOption[]
  /** 현재 해당 학교 대표 강사 이름 (없으면 null, 대표 지정 시 안내 모달용) */
  currentLeadInstructorName?: string | null
  /** 현재 배정된 강사 수 (신규 배정 안내 모달용, 미전달 시 0) */
  currentAssignedCount?: number
  /** 필요 배정 인원 수 (신규 배정 안내 모달용, 미전달 시 4) */
  requiredInstructorCount?: number
  /** true면 인원 초과 여부를 묻지 않고 바로 배정 플로우 진행 (이미 인원 초과 안내 모달에서 확인한 경우) */
  overflowAlreadyConfirmed?: boolean
  onAdd: (
    instructorId: string,
    role: InstructorRoleKey,
    option: AddInstructorAssignOption,
    meta?: { isNewApproval?: boolean; sessionIds?: string[] }
  ) => void
}

const DEFAULT_ROLE: InstructorRoleKey = 'assistant'
const MODAL_WIDTH = 800

export function SchoolDetailAddInstructorAssignModal({
  open,
  onCancel,
  programId,
  schoolId,
  schoolName,
  schoolSessions,
  participatingInstructorList = [],
  participatingSchoolList = [],
  assignedInstructorNames = [],
  instructorOptions: instructorOptionsProp,
  assignmentSessionOptions: assignmentSessionOptionsProp = [],
  currentLeadInstructorName = null,
  currentAssignedCount = 0,
  requiredInstructorCount = 4,
  overflowAlreadyConfirmed = false,
  onAdd,
}: SchoolDetailAddInstructorAssignModalProps) {
  const [form] = Form.useForm<AddInstructorAssignFormValues>()
  const selectedInstructorId = Form.useWatch('instructorId', form)

  const instructorOptions = useMemo(() => {
    if (instructorOptionsProp?.length) return instructorOptionsProp
    return buildProgramApprovedInstructorAssignOptions(programId, assignedInstructorNames)
  }, [instructorOptionsProp, programId, assignedInstructorNames])

  const assignmentSessionOptions = useMemo(() => {
    if (assignmentSessionOptionsProp.length > 0 && !schoolSessions?.length) {
      return assignmentSessionOptionsProp
    }
    return buildSchoolAddInstructorAssignSessionOptions({
      programId,
      schoolId,
      schoolName,
      sessions: schoolSessions,
      selectedInstructorId,
      participatingInstructorList,
      participatingSchoolList,
    })
  }, [
    assignmentSessionOptionsProp,
    schoolSessions,
    programId,
    schoolId,
    schoolName,
    selectedInstructorId,
    participatingInstructorList,
    participatingSchoolList,
  ])

  useEffect(() => {
    if (!open) return
    form.setFieldValue('sessionIds', [])
  }, [open, selectedInstructorId, form])
  const [leadConfirmOpen, setLeadConfirmOpen] = useState(false)
  const [leadConfirmPayload, setLeadConfirmPayload] = useState<LeadConfirmPayload | null>(null)
  const [newAssignGuideOpen, setNewAssignGuideOpen] = useState(false)
  const [newAssignGuidePayload, setNewAssignGuidePayload] = useState<LeadConfirmPayload | null>(
    null
  )
  const [overflowOpen, setOverflowOpen] = useState(false)
  const [overflowPayload, setOverflowPayload] = useState<LeadConfirmPayload | null>(null)

  useEffect(() => {
    if (open) {
      form.resetFields()
      form.setFieldsValue({ role: DEFAULT_ROLE, sessionIds: [], instructorId: undefined })
      setLeadConfirmOpen(false)
      setLeadConfirmPayload(null)
      setNewAssignGuideOpen(false)
      setNewAssignGuidePayload(null)
      setOverflowOpen(false)
      setOverflowPayload(null)
    }
  }, [open, form])

  /** 인원 초과/신규/대표 확인 이후 실제 배정 처리 분기 */
  const doSubmitFlow = (
    instructorId: string,
    role: InstructorRoleKey,
    option: AddInstructorAssignOption,
    sessionIds: string[]
  ) => {
    if (option.initialApproval === false) {
      setNewAssignGuidePayload({ instructorId, role, option, sessionIds })
      setNewAssignGuideOpen(true)
      return
    }
    const isNewLead = role === 'lead'
    const hasCurrentLead =
      currentLeadInstructorName != null && currentLeadInstructorName.trim() !== ''
    if (isNewLead && hasCurrentLead) {
      setLeadConfirmPayload({ instructorId, role, option, sessionIds })
      setLeadConfirmOpen(true)
      return
    }
    commitAdd(instructorId, role, option, { sessionIds })
  }

  const handleSubmit = (values: AddInstructorAssignFormValues) => {
    const option = instructorOptions.find(o => o.value === values.instructorId)
    if (!option) return
    const sessionIds = values.sessionIds ?? []
    /** 최대 배정 인원 초과: 인원 초과 안내 모달 노출 후 인원 외 추가 배정 가능 (이미 overflow 확인한 경우는 스킵) */
    if (!overflowAlreadyConfirmed && currentAssignedCount >= requiredInstructorCount) {
      setOverflowPayload({
        instructorId: values.instructorId,
        role: values.role,
        option,
        sessionIds })
      setOverflowOpen(true)
      return
    }
    doSubmitFlow(values.instructorId, values.role, option, sessionIds)
  }

  const commitAdd = (
    instructorId: string,
    role: InstructorRoleKey,
    option: AddInstructorAssignOption,
    meta?: { isNewApproval?: boolean; sessionIds?: string[] }
  ) => {
    onAdd(instructorId, role, option, meta)
    form.resetFields()
    setLeadConfirmOpen(false)
    setLeadConfirmPayload(null)
    setNewAssignGuideOpen(false)
    setNewAssignGuidePayload(null)
    setOverflowOpen(false)
    setOverflowPayload(null)
    onCancel()
  }

  const handleLeadConfirmCancel = () => {
    setLeadConfirmOpen(false)
    setLeadConfirmPayload(null)
  }

  const handleLeadConfirmOk = () => {
    if (leadConfirmPayload) {
      commitAdd(leadConfirmPayload.instructorId, leadConfirmPayload.role, leadConfirmPayload.option, {
        sessionIds: leadConfirmPayload.sessionIds })
    }
  }

  const handleCancel = () => {
    form.resetFields()
    onCancel()
  }

  const footer = (
    <>
      <CmsButton variant="secondary" size="medium" onClick={handleCancel}>
        취소
      </CmsButton>
      <CmsButton variant="primary" size="medium" onClick={() => form.submit()}>
        강사 배정
      </CmsButton>
    </>
  )

  return (
    <>
      <ContentModal
        open={open}
        onCancel={handleCancel}
        title="강사 배정 안내"
        width={MODAL_WIDTH}
        footer={footer}
        className="school-detail-add-instructor-assign-modal"
        description={`**[${schoolName}]**에 추가 배정할 강사님을 선택해 주세요`}
      >
        <div className="school-detail-add-instructor-assign-modal__body">
          <Form
            form={form}
            layout="vertical"
            className="school-detail-add-instructor-assign-modal__form"
            onFinish={handleSubmit}
            initialValues={{ instructorId: undefined, role: DEFAULT_ROLE, sessionIds: [] }}
            requiredMark={false}
          >
            <div className="school-detail-add-instructor-assign-modal__fields">
              <Form.Item
                name="role"
                label="대표 강사 지정"
                className="school-detail-add-instructor-assign-modal__field"
              >
                <CmsRadio.Group
                  className="school-detail-add-instructor-assign-modal__role-radios"
                  size="medium"
                  options={[
                    { label: INSTRUCTOR_ROLE_LABELS.lead, value: 'lead' as InstructorRoleKey },
                    {
                      label: INSTRUCTOR_ROLE_LABELS.assistant,
                      value: 'assistant' as InstructorRoleKey,
                    },
                  ]}
                />
              </Form.Item>
              <Form.Item
                name="instructorId"
                label="강사명"
                className="school-detail-add-instructor-assign-modal__field"
              >
                <CmsSelect
                  placeholder="배정할 강사를 선택해 주세요"
                  inputSize="medium"
                  width="100%"
                  className="school-detail-add-instructor-assign-modal__select"
                  options={instructorOptions}
                  showSearch
                  optionFilterProp="label"
                  getPopupContainer={() => document.body}
                  notFoundContent={
                    instructorOptions.length === 0 ? '선택 가능한 강사가 없습니다.' : undefined
                  }
                />
              </Form.Item>
              <Form.Item
                name="sessionIds"
                label="교육 배정일 선택"
                className="school-detail-add-instructor-assign-modal__field school-detail-add-instructor-assign-modal__field--sessions"
              >
                <InstructorAssignSessionTags options={assignmentSessionOptions} />
              </Form.Item>
            </div>
          </Form>
        </div>
      </ContentModal>

      <SchoolDetailLeadInstructorConfirmModal
        open={leadConfirmOpen}
        onCancel={handleLeadConfirmCancel}
        onConfirm={handleLeadConfirmOk}
        currentLeadInstructorName={currentLeadInstructorName ?? ''}
        newLeadInstructorName={leadConfirmPayload?.option.label ?? ''}
      />

      {/* 강사 배정 인원 초과 안내: 최대 인원 찼을 때 인원 외 추가 배정 확인 */}
      <SchoolDetailAssignOverflowModal
        open={overflowOpen}
        onCancel={() => {
          setOverflowOpen(false)
          setOverflowPayload(null)
        }}
        requiredCount={requiredInstructorCount}
        instructorName={overflowPayload?.option.label}
        onConfirm={() => {
          if (overflowPayload) {
            setOverflowOpen(false)
            const { instructorId, role, option, sessionIds } = overflowPayload
            setOverflowPayload(null)
            doSubmitFlow(instructorId, role, option, sessionIds)
          }
        }}
      />

      {/* 강사 신규 배정 안내: 최초 승인 미완료 강사 배정 시 승인+배정 안내 */}
      <SchoolDetailNewAssignGuideModal
        open={newAssignGuideOpen}
        onCancel={() => {
          setNewAssignGuideOpen(false)
          setNewAssignGuidePayload(null)
        }}
        instructorName={newAssignGuidePayload?.option.label ?? ''}
        schoolName={schoolName}
        currentCount={currentAssignedCount}
        requiredCount={requiredInstructorCount}
        onConfirm={() => {
          if (newAssignGuidePayload) {
            commitAdd(
              newAssignGuidePayload.instructorId,
              newAssignGuidePayload.role,
              newAssignGuidePayload.option,
              { isNewApproval: true, sessionIds: newAssignGuidePayload.sessionIds }
            )
          }
        }}
      />
    </>
  )
}
