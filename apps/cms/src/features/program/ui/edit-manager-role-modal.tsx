/**
 * 담당자 권한 수정 모달
 * 프로그램 상세 > 담당자 정보 탭 > 테이블 행 "권한 수정" 클릭 시
 * 시안: 담당자명(읽기 전용), 권한 설정(라디오), 담당자 삭제 링크, 취소/변경
 */

import { useEffect } from 'react'
import { Form, Input, Radio } from 'antd'
import { TealHeaderModal } from '@/shared/ui/teal-header-modal'
import { AppButton } from '@/shared/ui/app-button'
import type { ProgramRole } from '@/types/user'
import { PROGRAM_ROLE_LABELS } from '@/data/mock/program-managers'
import type { ProgramManagerRow } from '@/data/mock/program-managers'
import './edit-manager-role-modal.css'

const ROLE_OPTIONS: { label: string; value: ProgramRole }[] = [
  { label: PROGRAM_ROLE_LABELS.OWNER, value: 'OWNER' },
  { label: PROGRAM_ROLE_LABELS.PARTNER, value: 'PARTNER' },
  { label: PROGRAM_ROLE_LABELS.ASSISTANT, value: 'ASSISTANT' },
]

interface EditManagerRoleModalProps {
  open: boolean
  onCancel: () => void
  manager: ProgramManagerRow | null
  onSave: (role: ProgramRole) => void
  /** 담당자 삭제 링크 클릭 시 호출 — 상위에서 삭제 안내 모달 노출 */
  onDeleteRequest?: (manager: ProgramManagerRow) => void
}

export function EditManagerRoleModal({
  open,
  onCancel,
  manager,
  onSave,
  onDeleteRequest,
}: EditManagerRoleModalProps) {
  const [form] = Form.useForm<{ role: ProgramRole }>()

  useEffect(() => {
    if (open && manager) {
      form.setFieldsValue({ role: manager.role })
    }
  }, [open, manager, form])

  const handleSubmit = (values: { role: ProgramRole }) => {
    onSave(values.role)
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
        변경
      </AppButton>
    </>
  )

  return (
    <TealHeaderModal
      open={open}
      onCancel={handleCancel}
      title="담당자 권한 수정"
      footer={footer}
      width={800}
      className="edit-manager-role-modal__root"
    >
      <Form
        form={form}
        layout="vertical"
        className="edit-manager-role-modal__form"
        onFinish={handleSubmit}
        initialValues={{ role: manager?.role ?? 'ASSISTANT' }}
      >
        {manager && (
          <Form.Item label="담당자명" className="edit-manager-role-modal__field">
            <Input
              value={manager.name}
              readOnly
              size="large"
              className="edit-manager-role-modal__name-input"
            />
          </Form.Item>
        )}
        <Form.Item
          name="role"
          label="권한 설정"
          rules={[{ required: true, message: '권한을 선택해주세요' }]}
          className="edit-manager-role-modal__field"
        >
          <Radio.Group size="middle" className="edit-manager-role-modal__role-radios">
            {ROLE_OPTIONS.map(opt => (
              <Radio key={opt.value} value={opt.value}>
                {opt.label}
              </Radio>
            ))}
          </Radio.Group>
        </Form.Item>
        {manager && onDeleteRequest && (
          <div className="edit-manager-role-modal__delete-wrap">
            <button
              type="button"
              className="edit-manager-role-modal__delete-link"
              onClick={() => onDeleteRequest(manager)}
            >
              담당자 삭제
            </button>
          </div>
        )}
      </Form>
    </TealHeaderModal>
  )
}
