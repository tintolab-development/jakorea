/**
 * 담당자 권한 수정 모달
 * 프로그램 상세 > 담당자 정보 탭 > 권한 수정
 * ContentModal · 담당자 삭제는 상위에서 더블모달(담당자 삭제 안내) 연동
 */

import { useEffect, useState } from 'react'
import { Form, Input, Radio, Modal, Button } from 'antd'
import { ContentModal } from '@/shared/ui/content-modal'
import { CmsButton } from '@/shared/ui'
import type { ProgramRole } from '@/types/user'
import { PROGRAM_ROLE_LABELS } from '@/data/mock/program-managers'
import {
  canSetProgramManagerRole,
  PROGRAM_PM_ROLE_LIMIT_MESSAGE } from '@/entities/program/lib/program-pm-role-policy'
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
  /** 프로그램당 PM 인원 상한 검증용 전체 담당자 목록 */
  managerList: ProgramManagerRow[]
  onSave: (role: ProgramRole) => void
  /** 담당자 삭제 링크 클릭 시 — 상위에서 삭제 안내(더블) 모달 오픈 */
  onDeleteRequest?: (manager: ProgramManagerRow) => void
}

export function EditManagerRoleModal({
  open,
  onCancel,
  manager,
  managerList,
  onSave,
  onDeleteRequest }: EditManagerRoleModalProps) {
  const [form] = Form.useForm<{ role: ProgramRole }>()
  const [showOwnerLimitModal, setShowOwnerLimitModal] = useState(false)

  useEffect(() => {
    if (open && manager) {
      form.setFieldsValue({ role: manager.role })
    }
  }, [open, manager, form])

  useEffect(() => {
    if (!open) setShowOwnerLimitModal(false)
  }, [open])

  const handleSubmit = (values: { role: ProgramRole }) => {
    if (!manager) {
      onCancel()
      return
    }
    if (values.role === manager.role) {
      onCancel()
      return
    }
    if (!canSetProgramManagerRole(managerList, manager.id, values.role)) {
      setShowOwnerLimitModal(true)
      return
    }
    onSave(values.role)
    onCancel()
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
        권한 변경
      </CmsButton>
    </>
  )

  return (
    <>
      <ContentModal
        open={open}
        onCancel={handleCancel}
        title="담당자 권한 수정"
        width={560}
        footer={footer}
        className="edit-manager-role-modal"
      >
        <div className="edit-manager-role-modal__body">
          <Form
            form={form}
            layout="vertical"
            className="edit-manager-role-modal__form"
            onFinish={handleSubmit}
            initialValues={{ role: manager?.role ?? 'ASSISTANT' }}
            requiredMark={false}
          >
            <Form.Item
              name="role"
              label="권한 설정"
              rules={[{ required: true }]}
              className="edit-manager-role-modal__field"
            >
              <Radio.Group size="large" className="edit-manager-role-modal__role-radios">
                {ROLE_OPTIONS.map(opt => {
                  const disablePm =
                    manager &&
                    opt.value === 'OWNER' &&
                    !canSetProgramManagerRole(managerList, manager.id, 'OWNER')
                  return (
                    <Radio key={opt.value} value={opt.value} disabled={!!disablePm}>
                      {opt.label}
                    </Radio>
                  )
                })}
              </Radio.Group>
            </Form.Item>
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
        </div>
      </ContentModal>

      <Modal
        title="설정 불가"
        open={showOwnerLimitModal}
        onCancel={() => setShowOwnerLimitModal(false)}
        footer={
          <Button type="primary" onClick={() => setShowOwnerLimitModal(false)}>
            확인
          </Button>
        }
        zIndex={1200}
        centered
        width={400}
      >
        {PROGRAM_PM_ROLE_LIMIT_MESSAGE}
      </Modal>
    </>
  )
}
