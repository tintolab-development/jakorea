/**
 * 최초 로그인 — 본인인증 (step 1)
 * 서버가 identityVerificationRequired=true로 준 관리자 등록 계정은 본인인증 후 `/identity/confirm`으로 확정한 뒤
 * 비밀번호 변경으로 간다(BE R1). 값이 없으면(배포 전) 기존처럼 본인인증만 하고 넘어간다.
 */

import { useCallback, useEffect, useState } from 'react'
import { isAxiosError } from 'axios'
import { useNavigate } from 'react-router-dom'

import { confirmAdminIdentity } from '@/features/auth/api/admin-identity-confirm'
import {
  usePasswordChangeRequiredIdentityVerification,
  type IdentityChallengeCompleteResult,
} from '@/features/auth/identity-verification'
import { useAuthStore } from '@/features/auth/model/auth-store'
import {
  getPasswordChangeRequiredWizardState,
  hasPasswordChangeRequiredComplete,
  updatePasswordChangeRequiredWizardState,
  usePasswordChangeRequiredGuard,
} from '@/features/auth/password-change-required'
import { AdminRegisterStepIdentity } from '@/features/auth/ui/admin-register/admin-register-step-identity'
import { showIdentityVerificationFailedAlert } from '@/features/auth/ui/admin-register/show-identity-failed-alert'
import { AuthPageShell } from '@/features/auth/ui/auth-page-shell'
import { showGlobalApiErrorAlert } from '@/shared/lib/show-global-api-error-alert'
import { passwordChangeRequiredPaths } from '@/shared/utils/post-auth-redirect'

import './register-page.css'

export function PasswordChangeRequiredIdentityPage() {
  const navigate = useNavigate()
  const { isReady } = usePasswordChangeRequiredGuard()
  const identityVerificationRequired = useAuthStore(state => state.identityVerificationRequired)
  const setIdentityVerificationRequired = useAuthStore(
    state => state.setIdentityVerificationRequired
  )
  const wizardState = getPasswordChangeRequiredWizardState()
  const [isConfirming, setIsConfirming] = useState(false)

  useEffect(() => {
    if (hasPasswordChangeRequiredComplete()) {
      navigate(passwordChangeRequiredPaths.complete, { replace: true })
      return
    }
    // 새로고침·재진입 — 서버가 이미 확정됐다고 하면 비밀번호 변경 단계로 복원한다
    if (isReady && identityVerificationRequired === false) {
      navigate(passwordChangeRequiredPaths.changePassword, { replace: true })
    }
  }, [identityVerificationRequired, isReady, navigate])

  const goToChangePassword = useCallback(
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

  const confirmAndContinue = useCallback(
    async (result: IdentityChallengeCompleteResult) => {
      if (!result.profileToken) {
        // 확정에 필요한 profileToken이 없으면 본인인증부터 다시 한다
        return
      }
      setIsConfirming(true)
      try {
        const confirmed = await confirmAdminIdentity({
          identityVerificationSessionId: result.sessionId,
          profileToken: result.profileToken,
        })
        // 서버 거부는 훅의 error 상태로 팝업이 뜨지 않으므로 여기서 직접 띄운다
        switch (confirmed.kind) {
          case 'confirmed':
            setIdentityVerificationRequired(false)
            goToChangePassword(result)
            return
          case 'mismatch':
            showIdentityVerificationFailedAlert()
            return
          case 'verified_by_other':
            // 「인증 불가」 시안 미확인 — 안내 없이 이 단계에 머문다(보고 항목)
            return
          case 'reverify':
            return
        }
      } catch (error) {
        if (isAxiosError(error)) showGlobalApiErrorAlert(error)
      } finally {
        setIsConfirming(false)
      }
    },
    [goToChangePassword, setIdentityVerificationRequired]
  )

  const handleSuccess = useCallback(
    (result: IdentityChallengeCompleteResult) => {
      if (useAuthStore.getState().identityVerificationRequired === true) {
        void confirmAndContinue(result)
        return
      }
      goToChangePassword(result)
    },
    [confirmAndContinue, goToChangePassword]
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
        isVerifying={isVerifying || isConfirming}
        errorMessage={errorMessage}
        verifiedName={wizardState?.verifiedName}
        verifiedPhone={wizardState?.verifiedPhone}
      />
    </AuthPageShell>
  )
}
