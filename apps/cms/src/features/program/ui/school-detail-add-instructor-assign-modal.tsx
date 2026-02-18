/**
 * 학교 상세정보 – 강사진 추가 배정 모달
 * 기존 강사 목록에서 선택 후 해당 학교에 역할(대표/일반) 지정하여 배정
 * 대표 강사 지정 시 기존 대표가 있으면 600×250 안내 확인 모달 노출
 * 명세: docs/design/school-detail-add-instructor-assign-spec.md
 */

import { useEffect, useState } from 'react'
import { Form, Modal, Select, Radio } from 'antd'
import { TealHeaderModal } from '@/shared/ui/teal-header-modal'
import { AppButton } from '@/shared/ui/app-button'
import type { InstructorRoleKey } from '../model/school-detail-types'
import { INSTRUCTOR_ROLE_LABELS } from '../model/school-detail-types'
import './school-detail-add-instructor-assign-modal.css'

export interface AddInstructorAssignOption {
  value: string
  label: string
  contact?: string
  email?: string
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

interface SchoolDetailAddInstructorAssignModalProps {
  open: boolean
  onCancel: () => void
  /** 기존 강사 목록 (이미 해당 학교에 배정된 자 제외 권장) */
  instructorOptions: AddInstructorAssignOption[]
  /** 현재 해당 학교 대표 강사 이름 (없으면 null, 대표 지정 시 안내 모달용) */
  currentLeadInstructorName?: string | null
  onAdd: (instructorId: string, role: InstructorRoleKey, option: AddInstructorAssignOption) => void
}

const DEFAULT_ROLE: InstructorRoleKey = 'assistant'
const LEAD_CONFIRM_MODAL_WIDTH = 600
const LEAD_CONFIRM_MODAL_HEIGHT = 250

export function SchoolDetailAddInstructorAssignModal({
  open,
  onCancel,
  instructorOptions,
  currentLeadInstructorName = null,
  onAdd,
}: SchoolDetailAddInstructorAssignModalProps) {
  const [form] = Form.useForm<AddInstructorAssignFormValues>()
  const [leadConfirmOpen, setLeadConfirmOpen] = useState(false)
  const [leadConfirmPayload, setLeadConfirmPayload] = useState<LeadConfirmPayload | null>(null)

  useEffect(() => {
    if (open) {
      form.resetFields()
      form.setFieldsValue({ role: DEFAULT_ROLE })
      setLeadConfirmOpen(false)
      setLeadConfirmPayload(null)
    }
  }, [open, form])

  const handleSubmit = (values: AddInstructorAssignFormValues) => {
    const option = instructorOptions.find(o => o.value === values.instructorId)
    if (!option) return
    const isNewLead = values.role === 'lead'
    const hasCurrentLead =
      currentLeadInstructorName != null && currentLeadInstructorName.trim() !== ''
    if (isNewLead && hasCurrentLead) {
      setLeadConfirmPayload({
        instructorId: values.instructorId,
        role: values.role,
        option,
      })
      setLeadConfirmOpen(true)
      return
    }
    commitAdd(values.instructorId, values.role, option)
  }

  const commitAdd = (
    instructorId: string,
    role: InstructorRoleKey,
    option: AddInstructorAssignOption
  ) => {
    onAdd(instructorId, role, option)
    form.resetFields()
    setLeadConfirmOpen(false)
    setLeadConfirmPayload(null)
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
        추가
      </AppButton>
    </>
  )

  return (
    <>
      <TealHeaderModal
        open={open}
        onCancel={handleCancel}
        title="강사진 추가 배정"
        footer={footer}
        width={800}
      >
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
      </TealHeaderModal>

      {/* 대표 강사 지정 안내 확인 모달 (600×250) */}
      <Modal
        title="대표 강사 지정 안내"
        open={leadConfirmOpen}
        onCancel={handleLeadConfirmCancel}
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
        width={LEAD_CONFIRM_MODAL_WIDTH}
        centered
        className="school-detail-add-instructor-assign-modal__lead-confirm"
        styles={{
          body: { minHeight: LEAD_CONFIRM_MODAL_HEIGHT - 120 },
        }}
      >
        <div className="school-detail-add-instructor-assign-modal__lead-confirm-body">
          <p>
            현재 <strong>{currentLeadInstructorName ?? ''}</strong> 강사가 대표 강사로 지정되어
            있습니다.
          </p>
          <p>
            <strong>{leadConfirmPayload?.option.label ?? ''}</strong> 강사로 대표 강사를
            변경하시겠습니까?
          </p>
        </div>
      </Modal>
    </>
  )
}
