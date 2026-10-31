import { Form } from 'antd'
import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { CmsButton } from '@/shared/ui'

import { checkAdminRegisterEmailAvailability } from '@/features/auth/api/admin-register-service'
import { SOCIAL_ACCOUNT_LINK_ENABLED } from '@/features/auth/lib/social-account-link-enabled'
import { buildJakoreaEmail, isValidJakoreaEmailLocalPart } from '@/features/auth/lib/jakorea-email'
import type { AdminRegisterStep4Data, AdminRegisterWizardData } from '@/types/admin-register'

import { RegisterJakoreaEmailField } from './register-jakorea-email-field'
import { RegisterStepHeader } from './register-step-header'

type EmailDuplicateStatus = 'idle' | 'checking' | 'available' | 'unavailable'

interface RegisterJakoreaEmailFormItemProps {
  value?: string
  onChange?: (value: string) => void
  onLocalPartChange?: () => void
  onCheckDuplicate?: () => void
  label?: ReactNode
  required?: boolean
  message?: ReactNode
  checking?: boolean
  hasError?: boolean
}

function RegisterJakoreaEmailFormItem({
  value,
  onChange,
  onLocalPartChange,
  onCheckDuplicate,
  label,
  required,
  message,
  checking,
  hasError,
}: RegisterJakoreaEmailFormItemProps) {
  return (
    <RegisterJakoreaEmailField
      label={label}
      required={required}
      message={message}
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
      setDuplicateMessage('사용할 수 있는 이메일입니다.')
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
        setDuplicateMessage('사용할 수 있는 이메일입니다.')
        setVerifiedEmail(email)
        return
      }

      setDuplicateStatus('unavailable')
      setDuplicateMessage('이미 가입 된 이메일입니다.')
      setVerifiedEmail('')
    } catch {
      setDuplicateStatus('idle')
      setDuplicateMessage('중복 확인에 실패했습니다. 다시 시도해 주세요.')
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
    <div>
      <RegisterStepHeader
        title={
          <>
            로그인에 사용할
            <br />
            이메일을 입력해 주세요
          </>
        }
        description={
          SOCIAL_ACCOUNT_LINK_ENABLED ? (
            <>
              JA Korea 이메일 주소만 사용 가능합니다.
              <br />
              소셜 계정은 가입을 마친 뒤 연결할 수 있습니다.
            </>
          ) : (
            <>JA Korea 이메일 주소만 사용 가능합니다.</>
          )
        }
      />

      <Form
        style={{ marginTop: '40px' }}
        form={form}
        layout="vertical"
        requiredMark={false}
        className="auth-form"
        onFinish={handleFinish}
      >
        <Form.Item
          name="emailLocalPart"
          rules={[
            { required: true, message: '이메일을 입력해 주세요.' },
            {
              validator: async (_, value: string | undefined) => {
                if (!value || isValidJakoreaEmailLocalPart(value)) {
                  return
                }
                throw new Error('영문, 숫자, ., _, - 만 입력할 수 있습니다.')
              },
            },
          ]}
        >
          <RegisterJakoreaEmailFormItem
            label="이메일"
            required
            message={
              duplicateStatus === 'available' && duplicateMessage ? (
                <span className="register-email-field__message--success">{duplicateMessage}</span>
              ) : (
                duplicateMessage
              )
            }
            onLocalPartChange={resetDuplicateCheck}
            onCheckDuplicate={handleDuplicateCheck}
            checking={duplicateStatus === 'checking'}
            hasError={duplicateStatus === 'unavailable'}
          />
        </Form.Item>

        <div className="auth-actions" style={{ marginTop: '40px' }}>
          <CmsButton variant="primary" size="h52" type="submit" disabled={!canProceed}>
            다음
          </CmsButton>
          <CmsButton variant="default" size="h52" onClick={onBack}>
            이전으로
          </CmsButton>
        </div>
      </Form>
    </div>
  )
}
