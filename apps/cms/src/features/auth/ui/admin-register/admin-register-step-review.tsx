import { Alert } from 'antd'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CmsButton } from '@/shared/ui'

import { completeAdminSignup } from '@/features/auth/api/admin-register-service'
import type { AdminRegisterWizardData } from '@/types/admin-register'

import { RegisterReviewSummary } from './register-review-summary'
import { RegisterStepHeader } from './register-step-header'

interface AdminRegisterStepReviewProps {
  formData: AdminRegisterWizardData
  onBack: () => void
  completePath: string
}

function isIdentityVerified(formData: AdminRegisterWizardData): boolean {
  return (
    formData.identityVerificationStatus === 'verified' ||
    formData.identityVerificationSessionId != null ||
    formData.identityVerificationSessionUuid != null
  )
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
      !isIdentityVerified(formData) ||
      !formData.termsOfService ||
      !formData.privacyPolicy ||
      formData.mfaSetupAgreed !== true
    ) {
      setSubmitError('가입 정보가 올바르지 않습니다. 이전 단계를 다시 확인해 주세요.')
      return
    }

    setSubmitting(true)
    setSubmitError(null)

    try {
      await completeAdminSignup(formData)
      navigate(completePath, { replace: true })
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : '회원가입에 실패했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <RegisterStepHeader
        title="입력한 정보를 확인해 주세요."
        description={
          <>
            정보를 확인해 주세요.
            <br />
            내용이 맞다면 아래 버튼을 눌러 가입을 완료해 주세요.
          </>
        }
      />

      <div style={{ marginTop: '40px' }}>
        <RegisterReviewSummary formData={formData} />

        {submitError ? <Alert type="error" message={submitError} showIcon /> : null}

        <div className="auth-actions" style={{ marginTop: '40px' }}>
          <CmsButton
            variant="primary"
            size="h52"
            loading={submitting}
            onClick={handleComplete} >
            가입 완료하기
          </CmsButton>
          <CmsButton variant="default" size="h52" onClick={onBack}>
            이전으로
          </CmsButton>
        </div>
      </div>
    </div>
  )
}
