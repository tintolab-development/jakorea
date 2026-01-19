/**
 * 사용자 권한 변경 모달
 * Phase 5.1.2: 사용자 관리 페이지
 */

import { Modal, Form, Select, message } from 'antd'
import { useEffect } from 'react'
import type { AdminProgramRole, AdminRole, User, UserRole } from '@/types/user'
import { RoleBadge, getRoleLabel, getAdminProgramRoleLabel } from '@/shared/ui'
import './user-role-change-modal.css'

interface UserRoleChangeModalProps {
  open: boolean
  user: Omit<User, 'password'> | null
  loading?: boolean
  onConfirm: (
    userId: string,
    newRole: UserRole,
    adminRole?: AdminRole,
    adminProgramRole?: AdminProgramRole
  ) => Promise<void>
  onCancel: () => void
}

const { Option } = Select

const roleOptions: UserRole[] = ['ADMIN', 'INSTRUCTOR', 'STUDENT']
const adminRoleOptions: AdminRole[] = ['MASTER', 'ADMIN', 'GENERAL']
const adminProgramRoleOptions: AdminProgramRole[] = ['OWNER', 'PARTNER', 'ASSISTANT']

export function UserRoleChangeModal({
  open,
  user,
  loading = false,
  onConfirm,
  onCancel,
}: UserRoleChangeModalProps) {
  const [form] = Form.useForm()

  useEffect(() => {
    if (open && user) {
      form.setFieldsValue({
        role: user.role,
        adminRole: user.adminRole || 'ADMIN',
        adminProgramRole: user.adminProgramRole || 'ASSISTANT',
      })
    }
  }, [open, user, form])

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      if (!user) return

      await onConfirm(user.id, values.role, values.adminRole, values.adminProgramRole)
      message.success('권한이 변경되었습니다.')
      form.resetFields()
      onCancel()
    } catch (error) {
      // Form validation error는 무시 (이미 표시됨)
      if (error && typeof error === 'object' && 'errorFields' in error) {
        return
      }
      message.error('권한 변경에 실패했습니다.')
    }
  }

  const handleCancel = () => {
    form.resetFields()
    onCancel()
  }

  return (
    <Modal
      title="권한 변경"
      open={open}
      onOk={handleSubmit}
      onCancel={handleCancel}
      confirmLoading={loading}
      okText="변경"
      cancelText="취소"
    >
      {user && (
        <div className="user-role-change-modal__summary">
          <p>
            <strong>사용자:</strong> {user.name} ({user.email})
          </p>
          <p>
            <strong>현재 권한:</strong>{' '}
            <RoleBadge role={user.role} adminRole={user.adminRole} size="small" variant="tag" />
          </p>
        </div>
      )}

      <Form form={form} layout="vertical">
        <Form.Item
          name="role"
          label="새 권한"
          rules={[{ required: true, message: '권한을 선택해주세요.' }]}
        >
          <Select placeholder="권한 선택">
            {roleOptions.map((role) => (
              <Option key={role} value={role}>
                {getRoleLabel(role)}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item shouldUpdate>
          {() => {
            const role = form.getFieldValue('role') as UserRole
            if (role !== 'ADMIN') return null
            return (
              <>
                <Form.Item
                  name="adminRole"
                  label="관리자 구분"
                  rules={[{ required: true, message: '관리자 구분을 선택해주세요.' }]}
                >
                  <Select placeholder="관리자 구분 선택">
                    {adminRoleOptions.map((adminRole) => (
                      <Option key={adminRole} value={adminRole}>
                        {getRoleLabel('ADMIN', adminRole)}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
                <Form.Item
                  name="adminProgramRole"
                  label="프로그램 범위 역할"
                  rules={[{ required: true, message: '프로그램 범위 역할을 선택해주세요.' }]}
                >
                  <Select placeholder="프로그램 범위 역할 선택">
                    {adminProgramRoleOptions.map((adminProgramRole) => (
                      <Option key={adminProgramRole} value={adminProgramRole}>
                        {getAdminProgramRoleLabel(adminProgramRole)}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </>
            )
          }}
        </Form.Item>
      </Form>
    </Modal>
  )
}

