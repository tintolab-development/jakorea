/**
 * 학교 상세정보 – 강사 추가 배정 안내 모달 (A: 기관형 > 참여 기관 상세 > 강사 배정 현황 > 추가 배정)
 * 스펙(Figma CMS 9760:8214 ‘강사 추가 배정 안내’): width 600 · 패딩 24/30/34 · 섹션 간격 30px
 * 대표 강사 지정 → 강사명 → 교육 배정일(1열 칩 리스트) · 취소/배정
 * 공통 필드 UI: general-participant-add-assign-modal.tsx
 */

import { useEffect, useMemo, useState } from 'react'
import { Form } from 'antd'
import { ContentModal } from '@/shared/ui/content-modal'
import { CmsButton, CmsSelect } from '@/shared/ui'
import type { ParticipatingInstructorRow } from '@/features/program/general/model/participating-instructors'
import type {
  ParticipatingSchoolRow,
  ParticipatingSchoolSession,
} from '@/features/program/general/model/participating-schools'
import type { InstructorRoleKey } from '../../../model/school-detail-types'
import type { InstructorAssignSessionOption } from '../../../lib/instructor-assign-session-options'
import { useProgramInstructorApplications } from '@/features/program/general/hooks/use-program-instructor-applications'
import {
  buildProgramApprovedInstructorAssignOptions,
  buildSchoolAddInstructorAssignSessionOptions,
  type SchoolAddInstructorAssignOption,
} from '../../../lib/school-add-instructor-assign'
import {
  AddAssignRequiredLabel as RequiredFieldLabel,
  AddAssignRoleRadios,
  AddAssignSessionChipList,
  GENERAL_ADD_ASSIGN_MODAL_CLASS_NAME,
  GENERAL_ADD_ASSIGN_MODAL_WIDTH,
} from './general-participant-add-assign-modal'
import { SchoolDetailNewAssignGuideModal } from './school-detail-new-assign-guide-modal'
import { SchoolDetailAssignOverflowModal } from './school-detail-assign-overflow-modal'
import { SchoolDetailLeadInstructorConfirmModal } from './school-detail-lead-instructor-confirm-modal'
import './school-detail-add-instructor-assign-modal.css'

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
  /** 하위 안내 모달 문구 — 일반 기관형 시안은 `general-institution` (기본 기존 문구) */
  copyVariant?: 'default' | 'general-institution'
  /** 교육 배정일 칩 순위 라벨. 생략 시 기존 `N회차` — 1사1교는 회차 대신 지망 */
  resolveSessionRoundLabel?: (session: ParticipatingSchoolSession) => string
}

const DEFAULT_ROLE: InstructorRoleKey = 'assistant'
const MODAL_WIDTH = GENERAL_ADD_ASSIGN_MODAL_WIDTH

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
  copyVariant = 'default',
  resolveSessionRoundLabel,
}: SchoolDetailAddInstructorAssignModalProps) {
  const [form] = Form.useForm<AddInstructorAssignFormValues>()
  const selectedInstructorId = Form.useWatch('instructorId', form)

  const instructorApplications = useProgramInstructorApplications(
    instructorOptionsProp ? undefined : programId
  )
  const instructorOptions = useMemo(() => {
    if (instructorOptionsProp) return instructorOptionsProp
    return buildProgramApprovedInstructorAssignOptions(
      instructorApplications.rows,
      assignedInstructorNames
    )
  }, [assignedInstructorNames, instructorApplications.rows, instructorOptionsProp])

  const assignmentSessionOptions = useMemo(() => {
    if (assignmentSessionOptionsProp.length > 0 && !schoolSessions?.length) {
      return assignmentSessionOptionsProp
    }
    return buildSchoolAddInstructorAssignSessionOptions({
      schoolId,
      schoolName,
      sessions: schoolSessions,
      selectedInstructorId,
      applicantInstructors: instructorApplications.rows,
      participatingInstructorList,
      participatingSchoolList,
      resolveSessionRoundLabel,
    })
  }, [
    assignmentSessionOptionsProp,
    schoolSessions,
    programId,
    schoolId,
    schoolName,
    selectedInstructorId,
    instructorApplications.rows,
    participatingInstructorList,
    participatingSchoolList,
    resolveSessionRoundLabel,
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
        sessionIds,
      })
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
      commitAdd(
        leadConfirmPayload.instructorId,
        leadConfirmPayload.role,
        leadConfirmPayload.option,
        {
          sessionIds: leadConfirmPayload.sessionIds,
        }
      )
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
        배정
      </CmsButton>
    </>
  )

  return (
    <>
      <ContentModal
        open={open}
        onCancel={handleCancel}
        title="강사 추가 배정 안내"
        width={MODAL_WIDTH}
        footer={footer}
        className={GENERAL_ADD_ASSIGN_MODAL_CLASS_NAME}
        description={`**[${schoolName}]**에 추가 배정할 강사님을 선택해 주세요.`}
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
                label={<RequiredFieldLabel>대표 강사 지정</RequiredFieldLabel>}
                required
                rules={[{ required: true, message: '대표 강사 지정을 선택해 주세요.' }]}
                className="school-detail-add-instructor-assign-modal__field"
              >
                <AddAssignRoleRadios />
              </Form.Item>
              <Form.Item
                name="instructorId"
                label={<RequiredFieldLabel>강사명</RequiredFieldLabel>}
                required
                rules={[{ required: true, message: '배정할 강사를 선택해 주세요.' }]}
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
                label={<RequiredFieldLabel>교육 배정일 선택</RequiredFieldLabel>}
                required
                rules={[
                  {
                    required: true,
                    type: 'array',
                    min: 1,
                    message: '교육 배정일을 선택해 주세요.',
                  },
                ]}
                className="school-detail-add-instructor-assign-modal__field school-detail-add-instructor-assign-modal__field--sessions"
              >
                <AddAssignSessionChipList options={assignmentSessionOptions} selectionMode="multiple" />
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
        copyVariant={copyVariant}
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
