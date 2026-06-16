import { Button, Form, Input } from 'antd'
import { useEffect } from 'react'

import { AuthFormLabel } from '@/features/auth/ui/auth-form-label'
import { formatBirthDateInput, isValidBirthDate } from '@/features/auth/lib/format-birth-date'
import type { AdminRegisterStep1Data, AdminRegisterWizardData } from '@/types/admin-register'

import { RegisterGenderToggle } from './register-gender-toggle'
import { RegisterStepHeader } from './register-step-header'

interface RegisterGenderToggleFieldProps {
  value?: AdminRegisterStep1Data['gender']
  onChange?: (value: AdminRegisterStep1Data['gender']) => void
}

function RegisterGenderToggleField({ value, onChange }: RegisterGenderToggleFieldProps) {
  return <RegisterGenderToggle value={value} onChange={value => onChange?.(value)} />
}

interface AdminRegisterStepBirthGenderProps {
  initialValues?: Pick<AdminRegisterWizardData, 'birthDate' | 'gender'>
  onNext: (values: AdminRegisterStep1Data) => void
  onBack: () => void
}

export function AdminRegisterStepBirthGender({
  initialValues,
  onNext,
  onBack,
}: AdminRegisterStepBirthGenderProps) {
  const [form] = Form.useForm<AdminRegisterStep1Data>()

  useEffect(() => {
    form.setFieldsValue({
      birthDate: initialValues?.birthDate ?? '',
      gender: initialValues?.gender,
    })
  }, [form, initialValues?.birthDate, initialValues?.gender])

  const handleFinish = (values: AdminRegisterStep1Data) => {
    onNext(values)
  }

  return (
    <div className="admin-register-step">
      <RegisterStepHeader
        title="생년월일과 성별을 알려주세요"
        description={
          <>
            나이에 맞는 가입 절차를 안내하기 위해 필요해요.
            <br />
            다음 단계에서 본인인증 정보와 함께 확인할 수 있어요.
          </>
        }
      />

      <Form
        form={form}
        layout="vertical"
        requiredMark={false}
        className="auth-form admin-register-step__form"
        onFinish={handleFinish}
      >
        <Form.Item
          name="birthDate"
          label={<AuthFormLabel>생년월일</AuthFormLabel>}
          rules={[
            { required: true, message: '생년월일을 입력해 주세요.' },
            {
              validator: async (_, value: string | undefined) => {
                if (!value || isValidBirthDate(value)) {
                  return
                }
                throw new Error('YYYY.MM.DD 형식으로 입력해 주세요.')
              },
            },
          ]}
        >
          <Input
            className="admin-register-birth-input"
            placeholder="YYYY.MM.DD"
            inputMode="numeric"
            maxLength={10}
            onChange={event => {
              const formatted = formatBirthDateInput(event.target.value)
              form.setFieldValue('birthDate', formatted)
            }}
          />
        </Form.Item>

        <Form.Item
          name="gender"
          label={<AuthFormLabel>성별</AuthFormLabel>}
          rules={[{ required: true, message: '성별을 선택해 주세요.' }]}
        >
          <RegisterGenderToggleField />
        </Form.Item>

        <div className="auth-actions admin-register-step__actions">
          <Button type="primary" htmlType="submit" block className="auth-submit-btn">
            다음
          </Button>
          <Button type="default" block className="auth-secondary-btn" onClick={onBack}>
            이전으로
          </Button>
        </div>
        <div className="admin-register-step__trailing" aria-hidden />
      </Form>
    </div>
  )
}
