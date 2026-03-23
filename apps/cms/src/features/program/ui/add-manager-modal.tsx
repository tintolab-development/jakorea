/**
 * 담당자 등록 모달
 * 프로그램 상세 > 담당자 정보 탭 > 등록 버튼 클릭 시
 */

import { useEffect, useState } from 'react'
import { Form, Input, Select, Modal, Button } from 'antd'
import { TealHeaderModal } from '@/shared/ui/teal-header-modal'
import { AppButton } from '@/shared/ui/app-button'
import type { ProgramRole } from '@/types/user'
import { PROGRAM_ROLE_LABELS } from '@/data/mock/program-managers'
import {
  canAddProgramPmFromPmCount,
  PROGRAM_PM_ROLE_LIMIT_MESSAGE,
} from '@/entities/program/lib/program-pm-role-policy'
import type { ProgramManagerRow } from '@/data/mock/program-managers'
import './add-manager-modal.css'

const ROLE_OPTIONS: { label: string; value: ProgramRole }[] = [
  { label: PROGRAM_ROLE_LABELS.OWNER, value: 'OWNER' },
  { label: PROGRAM_ROLE_LABELS.PARTNER, value: 'PARTNER' },
  { label: PROGRAM_ROLE_LABELS.ASSISTANT, value: 'ASSISTANT' },
]

export interface AddManagerFormValues {
  name: string
  email: string
  phone: string
  role: ProgramRole
}

interface AddManagerModalProps {
  open: boolean
  onCancel: () => void
  /** PM(ProgramRole.OWNER) 인원 — 프로그램당 상한 검증용 */
  currentOwnerCount: number
  onAdd: (values: AddManagerFormValues) => void
}

export function AddManagerModal({
  open,
  onCancel,
  currentOwnerCount,
  onAdd,
}: AddManagerModalProps) {
  const [form] = Form.useForm<AddManagerFormValues>()
  const [showOwnerLimitModal, setShowOwnerLimitModal] = useState(false)

  useEffect(() => {
    if (open) {
      form.resetFields()
    }
  }, [open, form])

  useEffect(() => {
    if (!open) setShowOwnerLimitModal(false)
  }, [open])

  const handleSubmit = (values: AddManagerFormValues) => {
    if (values.role === 'OWNER' && !canAddProgramPmFromPmCount(currentOwnerCount)) {
      setShowOwnerLimitModal(true)
      return
    }
    onAdd({
      name: values.name.trim(),
      email: values.email.trim(),
      phone: values.phone.trim(),
      role: values.role,
    })
    form.resetFields()
    onCancel()
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
        등록
      </AppButton>
    </>
  )

  return (
    <TealHeaderModal
      open={open}
      onCancel={handleCancel}
      title="담당자 등록"
      footer={footer}
      width={800}
    >
      <Form
        form={form}
        layout="vertical"
        className="add-manager-modal__form"
        onFinish={handleSubmit}
        initialValues={{ name: '', email: '', phone: '', role: 'ASSISTANT' }}
        requiredMark={(labelNode, { required }) =>
          required ? (
            <>
              {labelNode}
              <span className="add-manager-modal__required-asterisk" aria-hidden>
                {' '}
                *
              </span>
            </>
          ) : (
            labelNode
          )
        }
      >
        <div className="add-manager-modal__fields">
          <div className="add-manager-modal__row">
            <Form.Item
              name="name"
              label="담당자명"
              rules={[{ required: true, message: '담당자명을 입력해주세요' }]}
              className="add-manager-modal__field"
            >
              <Input placeholder="담당자명을 입력하세요" size="large" allowClear />
            </Form.Item>
            <Form.Item
              name="role"
              label="권한"
              rules={[{ required: true, message: '권한을 선택해주세요' }]}
              className="add-manager-modal__field"
            >
              <Select
                placeholder="권한을 선택해주세요"
                size="large"
                options={ROLE_OPTIONS.map(opt => ({
                  ...opt,
                  disabled:
                    opt.value === 'OWNER' && !canAddProgramPmFromPmCount(currentOwnerCount),
                }))}
                getPopupContainer={() => document.body}
              />
            </Form.Item>
          </div>
          <div className="add-manager-modal__row">
            <Form.Item
              name="phone"
              label="연락처"
              rules={[{ required: true, message: '연락처를 입력해주세요' }]}
              className="add-manager-modal__field"
            >
              <Input placeholder="010-1234-5678" size="large" allowClear />
            </Form.Item>
            <Form.Item
              name="email"
              label="이메일"
              rules={[
                { required: true, message: '이메일을 입력해주세요' },
                { type: 'email', message: '올바른 이메일 형식이 아닙니다' },
              ]}
              className="add-manager-modal__field"
            >
              <Input placeholder="이메일을 입력하세요" size="large" allowClear />
            </Form.Item>
          </div>
        </div>
      </Form>

      <Modal
        title="설정 불가"
        open={showOwnerLimitModal}
        onCancel={() => setShowOwnerLimitModal(false)}
        footer={
          <Button type="primary" onClick={() => setShowOwnerLimitModal(false)}>
            확인
          </Button>
        }
        zIndex={2010}
        centered
        width={400}
      >
        {PROGRAM_PM_ROLE_LIMIT_MESSAGE}
      </Modal>
    </TealHeaderModal>
  )
}

/** 등록일시 포맷: YYYY.MM.DD HH:mm */
function formatRegisteredAt(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  const h = String(date.getHours()).padStart(2, '0')
  const min = String(date.getMinutes()).padStart(2, '0')
  return `${y}.${m}.${d} ${h}:${min}`
}

/** 폼 값으로 새 담당자 행 생성 (목록 추가용) */
export function buildManagerRowFromForm(
  values: AddManagerFormValues,
  nextNo: number,
  nextId: string
): ProgramManagerRow {
  return {
    id: nextId,
    no: nextNo,
    name: values.name,
    role: values.role,
    phone: values.phone,
    email: values.email,
    registeredAt: formatRegisteredAt(new Date()),
  }
}
