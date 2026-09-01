import { Form } from 'antd'
import { useEffect, useState } from 'react'
import { LoadingButton } from '@/shared/ui'

import { checkAdminRegisterEmailAvailability } from '@/features/auth/api/admin-register-service'
import {
  buildJakoreaEmail,
  isValidJakoreaEmailLocalPart,
} from '@/features/auth/lib/jakorea-email'
import { AuthFormLabel } from '@/features/auth/ui/auth-form-label'
import type { AdminRegisterStep4Data, AdminRegisterWizardData } from '@/types/admin-register'

import { RegisterJakoreaEmailField } from './register-jakorea-email-field'
import { RegisterStepHeader } from './register-step-header'

type EmailDuplicateStatus = 'idle' | 'checking' | 'available' | 'unavailable'

interface RegisterJakoreaEmailFormItemProps {
  value?: string
  onChange?: (value: string) => void
  onLocalPartChange?: () => void
  onCheckDuplicate?: () => void
  checking?: boolean
  hasError?: boolean
}

function RegisterJakoreaEmailFormItem({
  value,
  onChange,
  onLocalPartChange,
  onCheckDuplicate,
  checking,
  hasError,
}: RegisterJakoreaEmailFormItemProps) {
  return (
    <RegisterJakoreaEmailField
      value={value}
      onChange={nextValue => {
        onChange?.(nextValue)
        onLocalPartChange?.()
      }}
      onCheckDuplicate={onCheckDuplicate}
      checking={checking}
      hasError={hasError}
    />
  )
}

interface AdminRegisterStepEmailProps {
  initialValues?: Pick<AdminRegisterWizardData, 'emailLocalPart' | 'email'>
  onNext: (values: AdminRegisterStep4Data) => void
  onBack: () => void
}

export function AdminRegisterStepEmail({
  initialValues,
  onNext,
  onBack,
}: AdminRegisterStepEmailProps) {
  const [form] = Form.useForm<{ emailLocalPart: string }>()
  const [verifiedEmail, setVerifiedEmail] = useState('')
  const [duplicateStatus, setDuplicateStatus] = useState<EmailDuplicateStatus>('idle')
  const [duplicateMessage, setDuplicateMessage] = useState<string | null>(null)

  useEffect(() => {
    form.setFieldsValue({
      emailLocalPart: initialValues?.emailLocalPart ?? '',
    })
    if (initialValues?.email && initialValues.emailLocalPart) {
      setVerifiedEmail(initialValues.email)
      setDuplicateStatus('available')
      setDuplicateMessage('사용할 수 있는 이메일이에요.')
    }
  }, [form, initialValues?.email, initialValues?.emailLocalPart])

  const resetDuplicateCheck = () => {
    setDuplicateStatus('idle')
    setDuplicateMessage(null)
    setVerifiedEmail('')
  }

  const handleDuplicateCheck = async () => {
    const localPart = form.getFieldValue('emailLocalPart')?.trim() ?? ''
    if (!isValidJakoreaEmailLocalPart(localPart)) {
      return
    }

    setDuplicateStatus('checking')
    setDuplicateMessage(null)

    try {
      const email = buildJakoreaEmail(localPart)
      const isAvailable = await checkAdminRegisterEmailAvailability(email)

      if (isAvailable) {
        setDuplicateStatus('available')
        setDuplicateMessage('사용할 수 있는 이메일이에요.')
        setVerifiedEmail(email)
        return
      }

      setDuplicateStatus('unavailable')
      setDuplicateMessage('이미 가입 된 이메일이에요.')
      setVerifiedEmail('')
    } catch {
      setDuplicateStatus('idle')
      setDuplicateMessage('중복 확인에 실패했어요. 다시 시도해 주세요.')
      setVerifiedEmail('')
    }
  }

  const handleFinish = (values: { emailLocalPart: string }) => {
    if (duplicateStatus !== 'available' || !verifiedEmail) {
      return
    }
    onNext({
      emailLocalPart: values.emailLocalPart.trim(),
      email: verifiedEmail,
    })
  }

  const canProceed = duplicateStatus === 'available'

  return (
    <div className="admin-register-step admin-register-step--email">
      <RegisterStepHeader
        title={
          <>
            로그인에 사용할
            <br />
            이메일을 입력해 주세요
          </>
        }
        description={
          <>
            JA Korea 이메일 주소만 사용 가능합니다.
            <br />
            소셜 계정은 가입을 마친 뒤 연결할 수 있어요.
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
          name="emailLocalPart"
          label={<AuthFormLabel>이메일</AuthFormLabel>}
          validateStatus={duplicateStatus === 'unavailable' ? 'error' : undefined}
          rules={[
            { required: true, message: '이메일을 입력해 주세요.' },
            {
              validator: async (_, value: string | undefined) => {
                if (!value || isValidJakoreaEmailLocalPart(value)) {
                  return
                }
                throw new Error('영문, 숫자, ., _, - 만 입력할 수 있어요.')
              },
            },
          ]}
          extra={
            duplicateMessage ? (
              <p
                className={`register-email-field__message${
                  duplicateStatus === 'available'
                    ? ' register-email-field__message--success'
                    : duplicateStatus === 'unavailable'
                      ? ' register-email-field__message--error'
                      : ''
                }`}
              >
                {duplicateMessage}
              </p>
            ) : null
          }
        >
          <RegisterJakoreaEmailFormItem
            onLocalPartChange={resetDuplicateCheck}
            onCheckDuplicate={handleDuplicateCheck}
            checking={duplicateStatus === 'checking'}
            hasError={duplicateStatus === 'unavailable'}
          />
        </Form.Item>

        <div className="auth-actions admin-register-step__actions">
          <LoadingButton
            type="primary"
            htmlType="submit"
            block
            className="auth-submit-btn"
            disabled={!canProceed}
          >
            다음
          </LoadingButton>
          <LoadingButton type="default" block className="auth-secondary-btn" onClick={onBack}>
            이전으로
          </LoadingButton>
        </div>
        <div className="admin-register-step__trailing" aria-hidden />
      </Form>
    </div>
  )
}
