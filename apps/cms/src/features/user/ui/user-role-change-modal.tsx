/**
 * 사용자 권한 변경 모달
 * Phase 5.1.2: 사용자 관리 페이지
 * Phase 0.1.1: 역할 체계 재정의
 */

import { Modal, Form, Select, message } from 'antd'
import { useEffect } from 'react'
import type { AdminProgramRole, AdminLevel, AdminRole, ProgramRole, User, UserRole } from '@/types/user'
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
    adminRole?: AdminRole, // 하위 호환성
    programRole?: ProgramRole,
    adminProgramRole?: AdminProgramRole // 하위 호환성
  ) => Promise<void>
  onCancel: () => void
}

const { Option } = Select

// Phase 0.1.1: INDIVIDUAL, SCHOOL 추가
const roleOptions: UserRole[] = ['ADMIN', 'INSTRUCTOR', 'INDIVIDUAL', 'SCHOOL', 'STUDENT', 'VOLUNTEER']
const adminLevelOptions: AdminLevel[] = ['MASTER', 'ADMIN', 'GENERAL']
const programRoleOptions: ProgramRole[] = ['OWNER', 'PARTNER', 'ASSISTANT']
// 하위 호환성
const adminRoleOptions: AdminRole[] = adminLevelOptions
const adminProgramRoleOptions: AdminProgramRole[] = programRoleOptions

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
      // Phase 0.1.1: adminLevel, programRole 우선 사용
      form.setFieldsValue({
        role: user.role,
        adminLevel: user.adminLevel || user.adminRole || 'ADMIN',
        adminRole: user.adminRole || user.adminLevel || 'ADMIN', // 하위 호환성
        programRole: user.programRoles?.['program-1'] || user.adminProgramRole || 'ASSISTANT',
        adminProgramRole: user.adminProgramRole || user.programRoles?.['program-1'] || 'ASSISTANT', // 하위 호환성
      })
    }
  }, [open, user, form])

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      if (!user) return

      // Phase 0.1.1: adminLevel, programRole 우선 전달
      await onConfirm(
        user.id,
        values.role,
        values.adminLevel || values.adminRole,
        values.adminRole, // 하위 호환성
        values.programRole || values.adminProgramRole,
        values.adminProgramRole // 하위 호환성
      )
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
            <RoleBadge
              role={user.role}
              adminLevel={user.adminLevel}
              adminRole={user.adminRole}
              programRole={user.programRoles?.['program-1']}
              adminProgramRole={user.adminProgramRole}
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
                  name="adminLevel"
                  label="관리자 권한 레벨"
                  rules={[{ required: true, message: '관리자 권한 레벨을 선택해주세요.' }]}
                >
                  <Select placeholder="관리자 권한 레벨 선택">
                    {adminLevelOptions.map((adminLevel) => (
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
                    {programRoleOptions.map((programRole) => (
                      <Option key={programRole} value={programRole}>
                        {getProgramRoleLabel(programRole)}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
                {/* 하위 호환성 필드 (숨김) */}
                <Form.Item name="adminRole" hidden>
                  <Select>
                    {adminRoleOptions.map((adminRole) => (
                      <Option key={adminRole} value={adminRole}>
                        {adminRole}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
                <Form.Item name="adminProgramRole" hidden>
                  <Select>
                    {adminProgramRoleOptions.map((adminProgramRole) => (
                      <Option key={adminProgramRole} value={adminProgramRole}>
                        {adminProgramRole}
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

