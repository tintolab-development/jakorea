/**
 * 학교 상세정보 – 강사 배정 안내 모달
 * 프로그램 진행 현황 > 참여 기관 > 강사 배정 현황 탭에서 "추가배정" 클릭 시 노출.
 * - 담당자 등록 모달과 동일 폼 패턴: 대표 강사 지정 → 강사명(Select) → 교육 배정일 선택(태그).
 * - 스크린샷 스펙: 제목 "강사 배정 안내", [기관명] 볼드 처리, 대표 강사 변경 시 확인 더블 모달(ContentModal).
 */

import { useEffect, useState } from 'react'
import { Form, Select, Radio } from 'antd'
import { ContentModal } from '@/shared/ui/content-modal'
import { CmsButton } from '@/shared/ui'
import type { InstructorRoleKey } from '../model/school-detail-types'
import { INSTRUCTOR_ROLE_LABELS } from '../model/school-detail-types'
import type { InstructorAssignSessionOption } from '../lib/instructor-assign-session-options'
import { SchoolDetailNewAssignGuideModal } from './school-detail-new-assign-guide-modal'
import { SchoolDetailAssignOverflowModal } from './school-detail-assign-overflow-modal'
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
      className="school-detail-add-instructor-assign-modal__session-tags"
      role="group"
      aria-label="교육 배정일 선택"
    >
      {options.map(opt => {
        const selected = value?.includes(opt.id) ?? false
        const isDisabled = Boolean(opt.disabled)
        return (
          <button
            key={opt.id}
            type="button"
            disabled={isDisabled}
            className={[
              'school-detail-add-instructor-assign-modal__session-tag',
              selected && !isDisabled
                ? 'school-detail-add-instructor-assign-modal__session-tag--selected'
                : '',
              isDisabled ? 'school-detail-add-instructor-assign-modal__session-tag--disabled' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            onClick={() => {
              if (isDisabled) return
              const prev = value ?? []
              const next = prev.includes(opt.id)
                ? prev.filter(id => id !== opt.id)
                : [...prev, opt.id]
              onChange?.(next)
            }}
          >
            <span className="school-detail-add-instructor-assign-modal__session-tag-text">
              {opt.dateLabel}
            </span>
            <span
              className="school-detail-add-instructor-assign-modal__session-tag-divider"
              aria-hidden
            />
            <span className="school-detail-add-instructor-assign-modal__session-tag-text">
              {opt.durationLabel}
            </span>
            <span
              className="school-detail-add-instructor-assign-modal__session-tag-divider"
              aria-hidden
            />
            <span className="school-detail-add-instructor-assign-modal__session-tag-text">
              {opt.timeRangeLabel}
            </span>
          </button>
        )
      })}
    </div>
  )
}

export interface AddInstructorAssignOption {
  value: string
  label: string
  contact?: string
  email?: string
  /** 프로그램 참여 최초 승인 유무 (false면 강사 신규 배정 안내 모달 노출) */
  initialApproval?: boolean
}

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
  /** 추가 배정 대상 기관명 (안내 문구 "[기관명]에 추가 배정할 강사님을 선택해 주세요"에 사용) */
  schoolName: string
  /** 기존 강사 목록 (이미 해당 학교에 배정된 자 제외 권장) */
  instructorOptions: AddInstructorAssignOption[]
  /** 교육 배정일 태그 (참여 기관 회차 일정 등 상위에서 매핑해 전달) */
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
const LEAD_CONFIRM_MODAL_WIDTH = 600

export function SchoolDetailAddInstructorAssignModal({
  open,
  onCancel,
  schoolName,
  instructorOptions,
  assignmentSessionOptions = [],
  currentLeadInstructorName = null,
  currentAssignedCount = 0,
  requiredInstructorCount = 4,
  overflowAlreadyConfirmed = false,
  onAdd }: SchoolDetailAddInstructorAssignModalProps) {
  const [form] = Form.useForm<AddInstructorAssignFormValues>()
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
      <CmsButton variant="secondary" size="large" onClick={handleCancel}>
        취소
      </CmsButton>
      <CmsButton variant="primary" size="large" onClick={() => form.submit()}>
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
        width={600}
        footer={footer}
        className="school-detail-add-instructor-assign-modal"
      >
        <div className="school-detail-add-instructor-assign-modal__body">
          <p className="school-detail-add-instructor-assign-modal__description">
            [<strong>{schoolName}</strong>]에 추가 배정할 강사님을 선택해 주세요
          </p>
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
                rules={[{ required: true }]}
                className="school-detail-add-instructor-assign-modal__field"
              >
                <Radio.Group
                  className="school-detail-add-instructor-assign-modal__role-radios"
                  size="large"
                  options={[
                    { label: INSTRUCTOR_ROLE_LABELS.lead, value: 'lead' as InstructorRoleKey },
                    {
                      label: INSTRUCTOR_ROLE_LABELS.assistant,
                      value: 'assistant' as InstructorRoleKey },
                  ]}
                />
              </Form.Item>
              <Form.Item
                name="instructorId"
                label="강사명"
                rules={[{ required: true }]}
                className="school-detail-add-instructor-assign-modal__field"
              >
                <Select
                  placeholder="배정할 강사를 선택해 주세요"
                  size="large"
                  allowClear
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
                rules={
                  assignmentSessionOptions.length > 0
                    ? [
                        {
                          validator: (_rule, value: string[] | undefined) =>
                            value && value.length > 0
                              ? Promise.resolve()
                              : Promise.reject(new Error('교육 배정일을 선택해 주세요')) },
                      ]
                    : []
                }
                className="school-detail-add-instructor-assign-modal__field school-detail-add-instructor-assign-modal__field--sessions"
              >
                <InstructorAssignSessionTags options={assignmentSessionOptions} />
              </Form.Item>
            </div>
          </Form>
        </div>
      </ContentModal>

      {/* 대표 강사 지정 안내 확인 더블 모달: 이미 대표 강사 있을 때 변경 여부 확인 (스크린샷 스펙) */}
      <ContentModal
        open={leadConfirmOpen}
        onCancel={handleLeadConfirmCancel}
        title="대표 강사 지정 안내"
        width={LEAD_CONFIRM_MODAL_WIDTH}
        footer={
          <div className="school-detail-add-instructor-assign-modal__lead-confirm-footer">
            <CmsButton variant="secondary" size="large" onClick={handleLeadConfirmCancel}>
              취소
            </CmsButton>
            <CmsButton variant="primary" size="large" onClick={handleLeadConfirmOk}>
              변경
            </CmsButton>
          </div>
        }
        className="school-detail-add-instructor-assign-modal__lead-confirm"
      >
        <div className="school-detail-add-instructor-assign-modal__lead-confirm-body">
          <p>
            현재 [<strong>{currentLeadInstructorName ?? ''}</strong>] 강사가 대표 강사로 지정되어
            있습니다.
          </p>
          <p>
            [<strong>{leadConfirmPayload?.option.label ?? ''}</strong>] 강사로 대표 강사를
            변경하시겠습니까?
          </p>
        </div>
      </ContentModal>

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
