import { useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  requireAdminRegisteredWizardState,
  updateAdminRegisteredWizardState,
} from '@/features/auth/admin-registered'
import {
  useSignupIdentityVerification,
  type IdentityChallengeCompleteResult,
} from '@/features/auth/identity-verification'
import { PFButton, PFText } from '@/shared/ui'
import { authPageCopyClass } from '@/widgets/layout/auth-page-shell'
import sharedStyles from './shared.module.css'

export function AdminRegisteredIdentityPage() {
  const navigate = useNavigate()
  const wizardState = requireAdminRegisteredWizardState()
  const birthDate = wizardState?.birthDate ?? ''
  const gender = wizardState?.gender ?? null
  const canVerify = Boolean(wizardState?.birthDate && wizardState.gender)

  useEffect(() => {
    if (!wizardState) return
    if (!wizardState.birthDate || !wizardState.gender) {
      navigate('/auth/admin-registered/birth', { replace: true })
    }
  }, [navigate, wizardState])

  const handleSuccess = useCallback(
    (result: IdentityChallengeCompleteResult) => {
      updateAdminRegisteredWizardState({
        identityVerificationSessionId: result.sessionId,
        verifiedName: result.verifiedName,
        verifiedPhone: result.verifiedPhone,
      })
      navigate('/auth/admin-registered/change-password')
    },
    [navigate],
  )

  const { verify, isVerifying, errorMessage } = useSignupIdentityVerification({
    birthDate,
    gender,
    onSuccess: handleSuccess,
  })

  const handleVerify = () => {
    if (!canVerify) return
    void verify()
  }

  const handlePrevious = () => {
    navigate('/auth/admin-registered/birth')
  }

  if (!wizardState || !canVerify) {
    return null
  }

  return (
    <section>
      <div className={sharedStyles.header}>
        <PFText as="h1" typo="hd-sm" color="black" className={authPageCopyClass('title')}>
          본인인증을 진행해 주세요
        </PFText>
        <PFText as="p" typo="bd-lg-rg" color="primary-800" className={authPageCopyClass('description')}>
          안전하게 가입하기 위해 휴대폰 본인인증이 필요해요. 인증 결과는 생년월일과 함께 확인하며,
          회원가입 절차에만 사용돼요.
        </PFText>
      </div>

      <div className={sharedStyles.content}>
        <div className={sharedStyles.identityModule}>
          <PFText as="p" typo="bd-sm-rg" color="neutral-warm-500">
            휴대폰 본인인증 창이 열리면 안내에 따라 인증을 완료해 주세요.
            <br />
            인증이 끝나면 이 화면으로 돌아와 다음 단계로 진행돼요.
          </PFText>
          {errorMessage ? (
            <PFText as="p" typo="bd-sm-md" color="error">
              {errorMessage}
            </PFText>
          ) : null}
        </div>
      </div>

      <div className={sharedStyles.actions}>
        <PFButton size="xlarge" width="100%" disabled={isVerifying} onClick={handleVerify}>
          {isVerifying ? '본인인증 진행 중…' : '휴대폰 본인인증하기'}
        </PFButton>
        <PFButton size="large" variant="text" width="100%" onClick={handlePrevious}>
          이전으로
        </PFButton>
      </div>
    </section>
  )
}
