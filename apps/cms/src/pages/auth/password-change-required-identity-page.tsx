/**
 * 최초 로그인 — 본인인증 (스크린샷2)
 */

import { useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

import {
  usePasswordChangeRequiredIdentityVerification,
  type IdentityChallengeCompleteResult,
} from '@/features/auth/identity-verification'
import {
  getPasswordChangeRequiredWizardState,
  hasBirthGender,
  updatePasswordChangeRequiredWizardState,
  usePasswordChangeRequiredGuard,
} from '@/features/auth/password-change-required'
import { AdminRegisterStepIdentity } from '@/features/auth/ui/admin-register/admin-register-step-identity'
import { RegisterStepProgress } from '@/features/auth/ui/admin-register/register-step-progress'
import { AuthPageShell } from '@/features/auth/ui/auth-page-shell'
import { passwordChangeRequiredPaths } from '@/shared/utils/post-auth-redirect'

import './register-page.css'

export function PasswordChangeRequiredIdentityPage() {
  const navigate = useNavigate()
  const { isReady } = usePasswordChangeRequiredGuard()
  const wizardState = getPasswordChangeRequiredWizardState()
  const birthReady = hasBirthGender(wizardState)

  useEffect(() => {
    if (!isReady) return
    if (!birthReady) {
      navigate(passwordChangeRequiredPaths.birth, { replace: true })
    }
  }, [isReady, birthReady, navigate])

  const handleSuccess = useCallback(
    (result: IdentityChallengeCompleteResult) => {
      updatePasswordChangeRequiredWizardState({
        identityVerificationSessionId: result.sessionId,
        verifiedName: result.verifiedName,
        verifiedPhone: result.verifiedPhone,
      })
      navigate(passwordChangeRequiredPaths.changePassword, { replace: true })
    },
    [navigate]
  )

  const { verify, status, isVerifying, errorMessage } =
    usePasswordChangeRequiredIdentityVerification({
      birthDate: wizardState?.birthDate,
      gender: wizardState?.gender,
      onSuccess: handleSuccess,
    })

  if (!isReady || !birthReady) {
    return null
  }

  return (
    <AuthPageShell showLogo={false} cardClassName="register-card">
      <RegisterStepProgress currentStep={2} totalSteps={2} />
      <AdminRegisterStepIdentity
        onStartVerify={verify}
        status={status}
        isVerifying={isVerifying}
        errorMessage={errorMessage}
        verifiedName={wizardState?.verifiedName}
        verifiedPhone={wizardState?.verifiedPhone}
        idleTitle="통신사 본인인증 모듈 영역"
        idleDescription="수신: 이름·휴대폰번호·생년월일·CI/DI·인증토큰·인증일시"
      />
    </AuthPageShell>
  )
}
