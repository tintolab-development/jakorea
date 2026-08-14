import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  clearAdminProvisionedIdentityConfirmPending,
  markAdminProvisionedIdentityConfirmPending,
  requireAdminRegisteredWizardState,
  updateAdminRegisteredWizardState,
  useAdminProvisionedIdentityConfirmMutation,
} from '@/features/auth/admin-registered'
import {
  useAdminProvisionedIdentityVerification,
  type IdentityChallengeCompleteResult,
} from '@/features/auth/identity-verification'
import { getLoginApiErrorMessage } from '@/features/auth/sign-in'
import { isRemoteApiConfigured } from '@/shared/lib'
import { PFButton, PFText } from '@/shared/ui'
import { authPageCopyClass } from '@/widgets/layout/auth-page-shell'
import { normalizeBirthDateDigits } from '@jakorea/identity-verification'
import sharedStyles from './shared.module.css'

const IDENTITY_MISMATCH_MESSAGE =
  '입력하신 생년월일이 본인인증 정보와 일치하지 않습니다. 다시 확인해 주세요.'

export function AdminRegisteredIdentityPage() {
  const navigate = useNavigate()
  const wizardState = requireAdminRegisteredWizardState()
  const birthDate = wizardState?.birthDate ?? ''
  const gender = wizardState?.gender ?? null
  const canVerify = Boolean(wizardState?.birthDate && wizardState.gender)
  const [confirmError, setConfirmError] = useState<string | null>(null)
  const identityConfirmMutation = useAdminProvisionedIdentityConfirmMutation()
  const confirmIdentity = identityConfirmMutation.mutateAsync
  const isConfirming = identityConfirmMutation.isPending

  useEffect(() => {
    if (!wizardState) return
    if (!wizardState.birthDate || !wizardState.gender) {
      navigate('/auth/admin-registered/birth', { replace: true })
    }
  }, [navigate, wizardState])

  const handleSuccess = useCallback(
    (result: IdentityChallengeCompleteResult) => {
      void (async () => {
        setConfirmError(null)

        const expectedDigits = normalizeBirthDateDigits(birthDate)
        const verifiedDigits = normalizeBirthDateDigits(result.verifiedBirthDate)
        if (expectedDigits && verifiedDigits && expectedDigits !== verifiedDigits) {
          clearAdminProvisionedIdentityConfirmPending()
          setConfirmError(IDENTITY_MISMATCH_MESSAGE)
          return
        }

        if (isRemoteApiConfigured()) {
          const profileToken = result.profileToken?.trim()
          if (!profileToken) {
            clearAdminProvisionedIdentityConfirmPending()
            setConfirmError('본인인증 정보가 부족합니다. 다시 시도해 주세요.')
            return
          }

          try {
            const onboarding = await confirmIdentity({
              identityVerificationSessionId: Number(result.sessionId),
              profileToken,
            })

            if (onboarding.identityCompleted === false) {
              setConfirmError('본인인증 정보를 확인할 수 없습니다. 다시 시도해 주세요.')
              return
            }
          } catch (error) {
            setConfirmError(
              getLoginApiErrorMessage(
                error,
                '본인인증 정보가 회원 정보와 일치하지 않습니다. 생년월일·성별을 확인해 주세요.',
              ),
            )
            return
          } finally {
            clearAdminProvisionedIdentityConfirmPending()
          }
        }

        updateAdminRegisteredWizardState({
          identityVerificationSessionId: result.sessionId,
          identityProfileToken: result.profileToken,
          verifiedName: result.verifiedName,
          verifiedPhone: result.verifiedPhone,
        })
        navigate('/auth/admin-registered/change-password')
      })()
    },
    [birthDate, confirmIdentity, navigate],
  )

  const { verify, isVerifying, errorMessage } = useAdminProvisionedIdentityVerification({
    birthDate,
    gender,
    onSuccess: handleSuccess,
  })

  const handleVerify = () => {
    if (!canVerify || isConfirming) return
    setConfirmError(null)
    if (isRemoteApiConfigured()) {
      markAdminProvisionedIdentityConfirmPending()
    }
    void verify()
  }

  const handlePrevious = () => {
    clearAdminProvisionedIdentityConfirmPending()
    navigate('/auth/admin-registered/birth')
  }

  if (!wizardState || !canVerify) {
    return null
  }

  const displayError = confirmError ?? errorMessage
  const busy = isVerifying || isConfirming

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
          {displayError ? (
            <PFText as="p" typo="bd-sm-md" color="error">
              {displayError}
            </PFText>
          ) : null}
        </div>
      </div>

      <div className={sharedStyles.actions}>
        <PFButton size="xlarge" width="100%" disabled={busy} onClick={handleVerify}>
          {busy ? '본인인증 진행 중…' : '휴대폰 본인인증하기'}
        </PFButton>
        <PFButton size="large" variant="text" width="100%" onClick={handlePrevious}>
          이전으로
        </PFButton>
      </div>
    </section>
  )
}
