/**
 * 최초 로그인 — 본인인증 (step 1)
 */

import { useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

import {
  usePasswordChangeRequiredIdentityVerification,
  type IdentityChallengeCompleteResult,
} from '@/features/auth/identity-verification'
import {
  getPasswordChangeRequiredWizardState,
  hasPasswordChangeRequiredComplete,
  updatePasswordChangeRequiredWizardState,
  usePasswordChangeRequiredGuard,
} from '@/features/auth/password-change-required'
import { AdminRegisterStepIdentity } from '@/features/auth/ui/admin-register/admin-register-step-identity'
import { AuthPageShell } from '@/features/auth/ui/auth-page-shell'
import { passwordChangeRequiredPaths } from '@/shared/utils/post-auth-redirect'

import './register-page.css'

export function PasswordChangeRequiredIdentityPage() {
  const navigate = useNavigate()
  const { isReady } = usePasswordChangeRequiredGuard()
  const wizardState = getPasswordChangeRequiredWizardState()

  useEffect(() => {
    if (hasPasswordChangeRequiredComplete()) {
      navigate(passwordChangeRequiredPaths.complete, { replace: true })
    }
  }, [navigate])

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
      onSuccess: handleSuccess,
    })

  if (!isReady || hasPasswordChangeRequiredComplete()) {
    return null
  }

  return (
    <AuthPageShell showLogo={false} cardClassName="register-card">
      <AdminRegisterStepIdentity
        onStartVerify={verify}
        status={status}
        isVerifying={isVerifying}
        errorMessage={errorMessage}
        verifiedName={wizardState?.verifiedName}
        verifiedPhone={wizardState?.verifiedPhone}
      />
    </AuthPageShell>
  )
}
