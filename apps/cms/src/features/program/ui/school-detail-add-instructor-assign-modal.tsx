/**
 * 학교 상세정보 – 강사 배정 안내 모달
 * 프로그램 진행 현황 > 참여 기관 > 강사 배정 현황 탭에서 "추가배정" 클릭 시 노출.
 * - 기획: 해당 프로그램에 승인된 강사진 목록 노출(프로그램 단위). 담당자 등록 시 같은 구조 팝업 재사용 예정
 *   (강사명→담당자명, 대표 강사 지정→권한 설정으로 라벨만 변경).
 * - 스크린샷 스펙: 제목 "강사 배정 안내", [기관명] 볼드 처리, 대표 강사 변경 시 확인 더블 모달(ContentModal).
 */

import { useEffect, useState } from 'react'
import { Form, Select, Radio } from 'antd'
import { ContentModal } from '@/shared/ui/content-modal'
import { AppButton } from '@/shared/ui/app-button'
import type { InstructorRoleKey } from '../model/school-detail-types'
import { INSTRUCTOR_ROLE_LABELS } from '../model/school-detail-types'
import { SchoolDetailNewAssignGuideModal } from './school-detail-new-assign-guide-modal'
import { SchoolDetailAssignOverflowModal } from './school-detail-assign-overflow-modal'
import './school-detail-add-instructor-assign-modal.css'

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
}

interface LeadConfirmPayload {
  instructorId: string
  role: InstructorRoleKey
  option: AddInstructorAssignOption
}

export interface SchoolDetailAddInstructorAssignModalProps {
  open: boolean
  onCancel: () => void
  /** 추가 배정 대상 기관명 (안내 문구 "[기관명]에 추가 배정할 강사님을 선택해 주세요"에 사용) */
  schoolName: string
  /** 기존 강사 목록 (이미 해당 학교에 배정된 자 제외 권장) */
  instructorOptions: AddInstructorAssignOption[]
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
    meta?: { isNewApproval: boolean }
  ) => void
}

const DEFAULT_ROLE: InstructorRoleKey = 'assistant'
const LEAD_CONFIRM_MODAL_WIDTH = 600

export function SchoolDetailAddInstructorAssignModal({
  open,
  onCancel,
  schoolName,
  instructorOptions,
  currentLeadInstructorName = null,
  currentAssignedCount = 0,
  requiredInstructorCount = 4,
  overflowAlreadyConfirmed = false,
  onAdd,
}: SchoolDetailAddInstructorAssignModalProps) {
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
      form.setFieldsValue({ role: DEFAULT_ROLE })
      setLeadConfirmOpen(false)
      setLeadConfirmPayload(null)
      setNewAssignGuideOpen(false)
      setNewAssignGuidePayload(null)
      setOverflowOpen(false)
      setOverflowPayload(null)
    }
  }, [open, form])

  /** 인원 초과/신규/대표 확인 이후 실제 배정 처리 분기 */
  const doSubmitFlow = (instructorId: string, role: InstructorRoleKey, option: AddInstructorAssignOption) => {
    if (option.initialApproval === false) {
      setNewAssignGuidePayload({ instructorId, role, option })
      setNewAssignGuideOpen(true)
      return
    }
    const isNewLead = role === 'lead'
    const hasCurrentLead =
      currentLeadInstructorName != null && currentLeadInstructorName.trim() !== ''
    if (isNewLead && hasCurrentLead) {
      setLeadConfirmPayload({ instructorId, role, option })
      setLeadConfirmOpen(true)
      return
    }
    commitAdd(instructorId, role, option)
  }

  const handleSubmit = (values: AddInstructorAssignFormValues) => {
    const option = instructorOptions.find(o => o.value === values.instructorId)
    if (!option) return
    /** 최대 배정 인원 초과: 인원 초과 안내 모달 노출 후 인원 외 추가 배정 가능 (이미 overflow 확인한 경우는 스킵) */
    if (!overflowAlreadyConfirmed && currentAssignedCount >= requiredInstructorCount) {
      setOverflowPayload({
        instructorId: values.instructorId,
        role: values.role,
        option,
      })
      setOverflowOpen(true)
      return
    }
    doSubmitFlow(values.instructorId, values.role, option)
  }

  const commitAdd = (
    instructorId: string,
    role: InstructorRoleKey,
    option: AddInstructorAssignOption,
    meta?: { isNewApproval: boolean }
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
      commitAdd(leadConfirmPayload.instructorId, leadConfirmPayload.role, leadConfirmPayload.option)
    }
  }

  const handleCancel = () => {
    form.resetFields()
    onCancel()
  }

  const footer = (
    <>
      <AppButton variant="cancel" size="large" onClick={handleCancel}>
        취소
      </AppButton>
      <AppButton variant="primary" size="large" modalTeal onClick={() => form.submit()}>
        강사 배정
      </AppButton>
    </>
  )

  return (
    <>
      <ContentModal
        open={open}
        onCancel={handleCancel}
        title="강사 배정 안내"
        width={800}
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
            initialValues={{ instructorId: undefined, role: DEFAULT_ROLE }}
            requiredMark={(labelNode, { required }) =>
              required ? (
                <>
                  {labelNode}
                  <span className="school-detail-add-instructor-assign-modal__required" aria-hidden>
                    {' '}
                    *
                  </span>
                </>
              ) : (
                labelNode
              )
            }
          >
            <div className="school-detail-add-instructor-assign-modal__fields">
              <Form.Item
                name="instructorId"
                label="강사명"
                rules={[{ required: true, message: '배정할 강사를 선택해 주세요' }]}
                className="school-detail-add-instructor-assign-modal__field"
              >
                <Select
                  placeholder="배정할 강사를 선택해 주세요"
                  size="large"
                  allowClear
                  options={instructorOptions}
                  showSearch
                  optionFilterProp="label"
                  notFoundContent={
                    instructorOptions.length === 0 ? '선택 가능한 강사가 없습니다.' : undefined
                  }
                />
              </Form.Item>
              <Form.Item
                name="role"
                label="대표 강사 지정"
                className="school-detail-add-instructor-assign-modal__field"
              >
                <Radio.Group
                  options={[
                    { label: INSTRUCTOR_ROLE_LABELS.lead, value: 'lead' as InstructorRoleKey },
                    {
                      label: INSTRUCTOR_ROLE_LABELS.assistant,
                      value: 'assistant' as InstructorRoleKey,
                    },
                  ]}
                />
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
            <AppButton variant="cancel" size="large" onClick={handleLeadConfirmCancel}>
              취소
            </AppButton>
            <AppButton variant="primary" size="large" modalTeal onClick={handleLeadConfirmOk}>
              변경
            </AppButton>
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
            const { instructorId, role, option } = overflowPayload
            setOverflowPayload(null)
            doSubmitFlow(instructorId, role, option)
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
              { isNewApproval: true }
            )
          }
        }}
      />
    </>
  )
}
