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
  ADMIN_IDENTITY_DUPLICATE_NOTICE_CLOSE_LABEL,
  ADMIN_IDENTITY_DUPLICATE_NOTICE_CONTENT,
  ADMIN_IDENTITY_DUPLICATE_NOTICE_LOGIN_LABEL,
  ADMIN_IDENTITY_DUPLICATE_NOTICE_TITLE,
} from '@/features/auth/lib/admin-identity-duplicate-notice'
import {
  usePasswordChangeRequiredIdentityVerification,
  type IdentityChallengeCompleteResult,
} from '@/features/auth/identity-verification'
import { useAuthStore } from '@/features/auth/model/auth-store'
import {
  PASSWORD_CHANGE_REQUIRED_STEP_IDENTITY,
  PASSWORD_CHANGE_REQUIRED_STEP_PROGRESS_LABEL,
  PASSWORD_CHANGE_REQUIRED_TOTAL_STEPS,
  clearPasswordChangeRequiredWizardState,
  getPasswordChangeRequiredWizardState,
  hasPasswordChangeRequiredComplete,
  updatePasswordChangeRequiredWizardState,
  usePasswordChangeRequiredGuard,
} from '@/features/auth/password-change-required'
import { AdminRegisterStepIdentity } from '@/features/auth/ui/admin-register/admin-register-step-identity'
import { RegisterStepProgress } from '@/features/auth/ui/admin-register/register-step-progress'
import { showIdentityVerificationFailedAlert } from '@/features/auth/ui/admin-register/show-identity-failed-alert'
import { AuthPageShell } from '@/features/auth/ui/auth-page-shell'
import { showGlobalApiErrorAlert } from '@/shared/lib/show-global-api-error-alert'
import { ConfirmModal } from '@/shared/ui'
import { passwordChangeRequiredPaths } from '@/shared/utils/post-auth-redirect'

import './register-page.css'

export function PasswordChangeRequiredIdentityPage() {
  const navigate = useNavigate()
  const { isReady } = usePasswordChangeRequiredGuard()
  const identityVerificationRequired = useAuthStore(state => state.identityVerificationRequired)
  const setIdentityVerificationRequired = useAuthStore(
    state => state.setIdentityVerificationRequired
  )
  const logout = useAuthStore(state => state.logout)
  const wizardState = getPasswordChangeRequiredWizardState()
  const [isConfirming, setIsConfirming] = useState(false)
  /** 409 ADMIN_IDENTITY_ALREADY_VERIFIED_BY_OTHER — 「중복 가입 안내」 */
  const [duplicateNoticeOpen, setDuplicateNoticeOpen] = useState(false)

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
            // 확인 요청은 전역 오류 알럿을 끄고 보내므로(skipGlobalErrorAlert) 이 팝업만 뜬다
            setDuplicateNoticeOpen(true)
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

  /** [로그인 하기] — 첫 로그인 완료 화면과 같은 방식으로 임시 비밀번호 세션을 정리하고 로그인 화면으로 */
  const handleDuplicateNoticeGoLogin = useCallback(() => {
    setDuplicateNoticeOpen(false)
    clearPasswordChangeRequiredWizardState()
    logout()
    navigate('/login', { replace: true })
  }, [logout, navigate])

  const { verify, status, isVerifying, errorMessage } =
    usePasswordChangeRequiredIdentityVerification({
      onSuccess: handleSuccess,
    })

  if (!isReady || hasPasswordChangeRequiredComplete()) {
    return null
  }

  return (
    <AuthPageShell showLogo={false} cardClassName="register-card">
      <div className="register-page-content">
        {/* 시안 12111:298684 — 2단계 스텝퍼(본인인증 → 비밀번호 변경) */}
        <RegisterStepProgress
          currentStep={PASSWORD_CHANGE_REQUIRED_STEP_IDENTITY}
          totalSteps={PASSWORD_CHANGE_REQUIRED_TOTAL_STEPS}
          ariaLabel={PASSWORD_CHANGE_REQUIRED_STEP_PROGRESS_LABEL}
        />
        <AdminRegisterStepIdentity
          onStartVerify={verify}
          status={status}
          isVerifying={isVerifying || isConfirming}
          errorMessage={errorMessage}
          verifiedName={wizardState?.verifiedName}
          verifiedPhone={wizardState?.verifiedPhone}
        />
      </div>
      <ConfirmModal
        open={duplicateNoticeOpen}
        title={ADMIN_IDENTITY_DUPLICATE_NOTICE_TITLE}
        content={ADMIN_IDENTITY_DUPLICATE_NOTICE_CONTENT}
        cancelText={ADMIN_IDENTITY_DUPLICATE_NOTICE_CLOSE_LABEL}
        confirmText={ADMIN_IDENTITY_DUPLICATE_NOTICE_LOGIN_LABEL}
        // [확인]·X — 팝업만 닫고 본인인증 단계에 머문다
        onCancel={() => setDuplicateNoticeOpen(false)}
        onConfirm={handleDuplicateNoticeGoLogin}
      />
    </AuthPageShell>
  )
}
