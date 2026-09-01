/**
 * 회원 추가 폼 (관리자용)
 * Phase: 회원 관리 기능 추가
 */

import { Form, Input, Select, Switch, Space } from 'antd'
import type { AdminLevel, ProgramRole, UserRole } from '@/types/user'
import { getRoleLabel, getAdminLevelLabel, getProgramRoleLabel } from '@/shared/ui'
import { CmsNumericInput } from '@/shared/ui/numeric-input'
import { CmsPhoneInput } from '@/shared/ui/cms-phone-input'
import { isValidKoreanPhoneNumber } from '@/shared/utils/phone-validation'
import type { CreateUserRequest } from '@/entities/user/api/user-service'

const { Option } = Select

interface UserCreateFormProps {
  onSubmit: (data: CreateUserRequest) => Promise<void>
  onCancel: () => void
  loading?: boolean
}

const roleOptions: UserRole[] = ['ADMIN', 'INSTRUCTOR', 'INDIVIDUAL', 'SCHOOL']
const adminLevelOptions: AdminLevel[] = ['MASTER', 'ADMIN', 'GENERAL']
const programRoleOptions: ProgramRole[] = ['OWNER', 'PARTNER', 'ASSISTANT']

export function UserCreateForm({ onSubmit, onCancel, loading = false }: UserCreateFormProps) {
  const [form] = Form.useForm()

  const handleSubmit = async () => {
    const values = form.getFieldsValue()
    const request: CreateUserRequest = {
      email: values.email,
      password: values.password,
      name: values.name,
      phone: values.phone,
      role: values.role,
      isActive: values.isActive ?? true,
    }

    // 관리자 권한 설정
    if (values.role === 'ADMIN') {
      request.adminLevel = values.adminLevel || 'ADMIN'
      request.programRole = values.programRole || 'ASSISTANT'
    }

    // 학교 정보 설정
    if (values.role === 'SCHOOL' && values.schoolName) {
      request.schoolInfo = {
        schoolName: values.schoolName,
        address: values.schoolAddress || '',
        position: values.position,
      }
    }

    // 강사 정보 설정
    if (values.role === 'INSTRUCTOR' && values.bankName) {
      request.instructorInfo = {
        bankName: values.bankName,
        accountNumber: values.accountNumber,
        accountHolder: values.accountHolder,
        isBusinessIncome: values.isBusinessIncome ?? false,
      }
    }

    await onSubmit(request)
    form.resetFields()
  }

  const handleCancel = () => {
    form.resetFields()
    onCancel()
  }

  const selectedRole = Form.useWatch('role', form)

  return (
    <Form form={form} layout="vertical" onFinish={handleSubmit}>
      <Form.Item
        name="email"
        label="이메일"
      >
        <Input placeholder="이메일을 입력하세요" />
      </Form.Item>

      <Form.Item
        name="password"
        label="비밀번호"
      >
        <Input.Password placeholder="비밀번호를 입력하세요" />
      </Form.Item>

      <Form.Item
        name="name"
        label="이름"
      >
        <Input placeholder="이름을 입력하세요" />
      </Form.Item>

      <Form.Item
        name="phone"
        label="전화번호"
        rules={[
          {
            validator: (_, value?: string) =>
              !value?.trim() || isValidKoreanPhoneNumber(value)
                ? Promise.resolve()
                : Promise.reject(new Error('올바른 전화번호 형식이 아닙니다 (예: 010-1234-5678)')),
          },
        ]}
      >
        <CmsPhoneInput placeholder="010-1234-5678" />
      </Form.Item>

      <Form.Item
        name="role"
        label="권한"
      >
        <Select placeholder="권한 선택">
          {roleOptions.map(role => (
            <Option key={role} value={role}>
              {getRoleLabel(role)}
            </Option>
          ))}
        </Select>
      </Form.Item>

      {selectedRole === 'ADMIN' && (
        <>
          <Form.Item
            name="adminLevel"
            label="관리자 권한 레벨"
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
      )}

      {selectedRole === 'SCHOOL' && (
        <>
          <Form.Item
            name="schoolName"
            label="학교명"
          >
            <Input placeholder="학교명을 입력하세요" />
          </Form.Item>
          <Form.Item name="schoolAddress" label="주소">
            <Input placeholder="주소를 입력하세요" />
          </Form.Item>
          <Form.Item name="position" label="담당자 직책">
            <Input placeholder="담당자 직책을 입력하세요" />
          </Form.Item>
        </>
      )}

      {selectedRole === 'INSTRUCTOR' && (
        <>
          <Form.Item name="bankName" label="은행명">
            <Input placeholder="은행명을 입력하세요" />
          </Form.Item>
          <Form.Item name="accountNumber" label="계좌번호" trigger="onValueChange">
            <CmsNumericInput mode="numericText" placeholder="계좌번호를 입력하세요" />
          </Form.Item>
          <Form.Item name="accountHolder" label="예금주">
            <Input placeholder="예금주를 입력하세요" />
          </Form.Item>
          <Form.Item name="isBusinessIncome" label="사업소득자" valuePropName="checked">
            <Switch />
          </Form.Item>
        </>
      )}

      <Form.Item name="isActive" label="활성 상태" valuePropName="checked" initialValue={true}>
        <Switch />
      </Form.Item>

      <Form.Item>
        <Space>
          <button type="submit" className="ant-btn ant-btn-primary" disabled={loading}>
            {loading ? '생성 중...' : '생성'}
          </button>
          <button type="button" className="ant-btn" onClick={handleCancel} disabled={loading}>
            취소
          </button>
        </Space>
      </Form.Item>
    </Form>
  )
}
