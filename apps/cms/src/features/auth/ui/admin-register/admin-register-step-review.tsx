import { Alert, Button } from 'antd'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { register } from '@/entities/user/api/register-service'
import type { AdminRegisterWizardData } from '@/types/admin-register'

import { RegisterReviewSummary } from './register-review-summary'
import { RegisterStepHeader } from './register-step-header'

interface AdminRegisterStepReviewProps {
  formData: AdminRegisterWizardData
  onBack: () => void
  completePath: string
}

export function AdminRegisterStepReview({
  formData,
  onBack,
  completePath,
}: AdminRegisterStepReviewProps) {
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const handleComplete = async () => {
    if (
      !formData.email ||
      !formData.password ||
      !formData.verifiedName ||
      !formData.verifiedPhone ||
      !formData.birthDate ||
      !formData.gender ||
      !formData.termsOfService ||
      !formData.privacyPolicy
    ) {
      setSubmitError('가입 정보가 올바르지 않습니다. 이전 단계를 다시 확인해 주세요.')
      return
    }

    setSubmitting(true)
    setSubmitError(null)

    try {
      await register({
        formData: {
          role: 'ADMIN',
          adminLevel: 'ADMIN',
          email: formData.email,
          password: formData.password,
          passwordConfirm: formData.password,
          name: formData.verifiedName,
          phone: formData.verifiedPhone,
        },
        consent: {
          termsOfService: formData.termsOfService,
          privacyPolicy: formData.privacyPolicy,
          marketingConsent: formData.marketingConsent ?? false,
        },
      })
      navigate(completePath, { replace: true })
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : '회원가입에 실패했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="admin-register-step admin-register-step--review">
      <RegisterStepHeader
        title="입력한 정보를 확인해 주세요"
        description="내용이 맞다면 가입을 완료할게요."
      />

      <div className="admin-register-step__content">
        <RegisterReviewSummary formData={formData} />

        {submitError ? (
          <Alert type="error" message={submitError} showIcon className="admin-register-step__submit-error" />
        ) : null}

        <div className="auth-actions admin-register-step__actions">
          <Button
            type="primary"
            block
            className="auth-submit-btn"
            loading={submitting}
            onClick={handleComplete}
          >
            가입 완료하기
          </Button>
          <Button type="default" block className="auth-secondary-btn" onClick={onBack}>
            이전으로
          </Button>
        </div>
        <div className="admin-register-step__trailing" aria-hidden />
      </div>
    </div>
  )
}
