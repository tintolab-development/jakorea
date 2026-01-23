/**
 * 사용자 권한 변경 모달
 * Phase 5.1.2: 사용자 관리 페이지
 */

import { Modal, Form, Select, message } from 'antd'
import { useEffect } from 'react'
import type { AdminLevel, ProgramRole, User, UserRole } from '@/types/user'
import { RoleBadge, getRoleLabel, getAdminLevelLabel, getProgramRoleLabel } from '@/shared/ui'
import './user-role-change-modal.css'

interface UserRoleChangeModalProps {
  open: boolean
  user: Omit<User, 'password'> | null
  loading?: boolean
  onConfirm: (
    userId: string,
    newRole: UserRole,
    adminLevel?: AdminLevel,
    programRole?: ProgramRole
  ) => Promise<void>
  onCancel: () => void
}

const { Option } = Select

const roleOptions: UserRole[] = ['ADMIN', 'INSTRUCTOR', 'INDIVIDUAL', 'SCHOOL']
const adminLevelOptions: AdminLevel[] = ['MASTER', 'ADMIN', 'GENERAL']
const programRoleOptions: ProgramRole[] = ['OWNER', 'PARTNER', 'ASSISTANT']

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
        adminLevel: user.adminLevel || 'ADMIN',
        programRole: user.programRoles?.['program-1'] || 'ASSISTANT',
      })
    }
  }, [open, user, form])

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      if (!user) return

      await onConfirm(user.id, values.role, values.adminLevel, values.programRole)
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
      zIndex={1001}
    >
      {user && (
        <div className="user-role-change-modal__summary">
          <p>
            <strong>사용자:</strong> {user.name} ({user.email})
          </p>
          <p>
            <strong>현재 권한:</strong>{' '}
            <RoleBadge
              role={user.role}
              adminLevel={user.adminLevel}
              programRole={user.programRoles?.['program-1']}
              size="small"
              variant="tag"
            />
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
            {roleOptions.map(role => (
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
                  name="adminLevel"
                  label="관리자 권한 레벨"
                  rules={[{ required: true, message: '관리자 권한 레벨을 선택해주세요.' }]}
                >
                  <Select placeholder="관리자 권한 레벨 선택">
                    {adminLevelOptions.map(adminLevel => (
                      <Option key={adminLevel} value={adminLevel}>
                        {getAdminLevelLabel(adminLevel)}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
                <Form.Item
                  name="programRole"
                  label="프로그램 역할"
                  rules={[{ required: true, message: '프로그램 역할을 선택해주세요.' }]}
                >
                  <Select placeholder="프로그램 역할 선택">
                    {programRoleOptions.map(programRole => (
                      <Option key={programRole} value={programRole}>
                        {getProgramRoleLabel(programRole)}
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
