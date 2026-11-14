/**
 * 관리자 회원가입 페이지
 */

import { useCallback, useState } from 'react'
import { isAxiosError } from 'axios'
import { useNavigate } from 'react-router-dom'

import {
  registerIdentityVerificationClient,
  useIdentityVerification,
  type IdentityChallengeCompleteResult,
  type VerifiedIdentityProfileResponse,
} from '@/features/auth/identity-verification'
import {
  precheckAdminSignupIdentity,
  type AdminSignupIdentityPrecheckResult,
} from '@/features/auth/api/admin-register-service'
import { useAdminRegisterWizard } from '@/features/auth/hooks/use-admin-register-wizard'
import { FindEmailResultView } from '@/features/auth/ui/find-email/find-email-result-view'
import { RegisteredByAdminNotice } from '@/features/auth/ui/admin-register/registered-by-admin-notice'
import { showGlobalApiErrorAlert } from '@/shared/lib/show-global-api-error-alert'
import { AdminRegisterStepEmail } from '@/features/auth/ui/admin-register/admin-register-step-email'
import { AdminRegisterStepIdentity } from '@/features/auth/ui/admin-register/admin-register-step-identity'
import { AdminRegisterStepReview } from '@/features/auth/ui/admin-register/admin-register-step-review'
import { AdminRegisterStepPassword } from '@/features/auth/ui/admin-register/admin-register-step-password'
import { AdminRegisterStepTerms } from '@/features/auth/ui/admin-register/admin-register-step-terms'
import { RegisterStepProgress } from '@/features/auth/ui/admin-register/register-step-progress'
import { AuthPageShell } from '@/features/auth/ui/auth-page-shell'
import { useQueryParams } from '@/shared/hooks/use-query-params'
import type {
  AdminRegisterStep3Data,
  AdminRegisterStep4Data,
  AdminRegisterStep5Data,
} from '@/types/admin-register'

import './register-page.css'
// 사전 검사 안내 화면(가입한 이메일 / 관리자 등록 회원) — 이메일 찾기 결과 화면과 같은 스타일
import './find-email-page.css'

type RegisteredAccountNotice = Extract<
  AdminSignupIdentityPrecheckResult,
  { kind: 'registered_by_admin' } | { kind: 'already_registered' }
>

export function RegisterPage() {
  const navigate = useNavigate()
  const { params } = useQueryParams<{ redirect?: string }>()
  const { currentStep, formData, updateStepData, goNext, goPrev, buildCompletePath, totalSteps } =
    useAdminRegisterWizard({ redirectPath: params.redirect })
  const [isPrechecking, setIsPrechecking] = useState(false)
  const [registeredNotice, setRegisteredNotice] = useState<RegisteredAccountNotice | null>(null)

  /** 본인인증 직후 같은 본인정보 관리자 계정이 있는지 확인한다(BE R2). true면 다음 단계로 진행 */
  const precheckBeforeTerms = useCallback(
    async (result: IdentityChallengeCompleteResult): Promise<boolean> => {
      if (!result.profileToken) return true
      setIsPrechecking(true)
      try {
        const precheck = await precheckAdminSignupIdentity({
          identityVerificationSessionId: result.sessionId,
          profileToken: result.profileToken,
        })
        if (precheck.kind === 'continue') return true
        // 본인인증부터 다시 — 1단계에 머문다
        if (precheck.kind === 'reverify') return false
        setRegisteredNotice(precheck)
        return false
      } catch (error) {
        // 429 등 — 기존 공통 오류 처리
        if (isAxiosError(error)) showGlobalApiErrorAlert(error)
        return false
      } finally {
        setIsPrechecking(false)
      }
    },
    []
  )

  const handleIdentitySuccess = useCallback(
    async (result: IdentityChallengeCompleteResult) => {
      if (!(await precheckBeforeTerms(result))) return

      let profile: VerifiedIdentityProfileResponse | undefined
      if (result.profileToken) {
        try {
          profile = await registerIdentityVerificationClient.fetchVerifiedProfile(
            result.sessionId,
            result.profileToken
          )
        } catch {
          profile = undefined
        }
      }

      updateStepData({
        identityVerificationSessionId: result.sessionId,
        identityVerificationSessionUuid: result.sessionUuid ?? String(result.sessionId),
        identityVerificationStatus: 'verified',
        identityVerifiedAt: result.verifiedAt,
        verifiedName: result.verifiedName,
        verifiedPhone: result.verifiedPhone,
        verifiedBirthDate: result.verifiedBirthDate ?? profile?.birthDate,
        verifiedGender: profile?.gender ?? profile?.genderLabel,
      })
      goNext()
    },
    [goNext, precheckBeforeTerms, updateStepData]
  )

  const { verify, status, isVerifying, errorMessage } = useIdentityVerification({
    onSuccess: handleIdentitySuccess,
  })

  const handleTermsNext = (values: AdminRegisterStep3Data) => {
    updateStepData(values)
    goNext()
  }

  const handleEmailNext = (values: AdminRegisterStep4Data) => {
    updateStepData(values)
    goNext()
  }

  const handlePasswordNext = (values: AdminRegisterStep5Data) => {
    updateStepData(values)
    goNext()
  }

  const handleBack = () => {
    goPrev()
  }

  const renderStep = () => {
    if (currentStep === 1) {
      return (
        <AdminRegisterStepIdentity
          onStartVerify={verify}
          status={status}
          isVerifying={isVerifying || isPrechecking}
          errorMessage={errorMessage}
          verifiedName={formData.verifiedName}
          verifiedPhone={formData.verifiedPhone}
        />
      )
    }

    if (currentStep === 2) {
      return (
        <AdminRegisterStepTerms
          initialValues={{
            termsOfService: formData.termsOfService,
            privacyPolicy: formData.privacyPolicy,
            marketingConsent: formData.marketingConsent,
            mfaSetupAgreed: formData.mfaSetupAgreed,
          }}
          onNext={handleTermsNext}
          onBack={handleBack}
        />
      )
    }

    if (currentStep === 3) {
      return (
        <AdminRegisterStepEmail
          initialValues={{
            emailLocalPart: formData.emailLocalPart,
            email: formData.email,
          }}
          onNext={handleEmailNext}
          onBack={handleBack}
        />
      )
    }

    if (currentStep === 4) {
      return (
        <AdminRegisterStepPassword
          initialValues={{ password: formData.password }}
          onNext={handlePasswordNext}
          onBack={handleBack}
        />
      )
    }

    if (currentStep === 5) {
      return (
        <AdminRegisterStepReview
          formData={formData}
          onBack={handleBack}
          completePath={buildCompletePath()}
        />
      )
    }

    return null
  }

  const registerCardClassName =
    currentStep === 1
      ? 'auth-card--register auth-card--register-step-1'
      : currentStep === 2
        ? 'auth-card--register auth-card--register-step-2'
        : currentStep === 4
          ? 'auth-card--register auth-card--register-step-4'
          : currentStep === 5
            ? 'auth-card--register auth-card--register-step-5'
            : 'auth-card--register'

  if (registeredNotice) {
    return (
      <AuthPageShell showLogo={false} cardClassName="auth-card--find-email-result">
        <div className="register-page-content">
          {registeredNotice.kind === 'already_registered' ? (
            // 시안 4945-78880 — 마스킹 이메일만 표시
            <FindEmailResultView
              email={registeredNotice.maskedEmail ?? ''}
              onGoLogin={() => navigate('/login', { replace: true })}
              onResetPassword={() => navigate('/find-password', { replace: true })}
            />
          ) : (
            // 시안 5568-43677
            <RegisteredByAdminNotice
              onChangePassword={() => navigate('/login', { replace: true })}
              onFindEmail={() => navigate('/find-email', { replace: true })}
            />
          )}
        </div>
      </AuthPageShell>
    )
  }

  return (
    <AuthPageShell showLogo={false} cardClassName={registerCardClassName}>
      <div className="register-page-content">
        <RegisterStepProgress currentStep={currentStep} totalSteps={totalSteps} />
        {renderStep()}
      </div>
    </AuthPageShell>
  )
}
