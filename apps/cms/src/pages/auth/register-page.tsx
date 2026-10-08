/**
 * 관리자 회원가입 페이지
 */

import { useCallback } from 'react'

import {
  cmsIdentityVerificationClient,
  useIdentityVerification,
  type IdentityChallengeCompleteResult,
  type VerifiedIdentityProfileResponse,
} from '@/features/auth/identity-verification'
import { useAdminRegisterWizard } from '@/features/auth/hooks/use-admin-register-wizard'
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

export function RegisterPage() {
  const { params } = useQueryParams<{ redirect?: string }>()
  const { currentStep, formData, updateStepData, goNext, goPrev, buildCompletePath, totalSteps } =
    useAdminRegisterWizard({ redirectPath: params.redirect })

  const handleIdentitySuccess = useCallback(
    async (result: IdentityChallengeCompleteResult) => {
      let profile: VerifiedIdentityProfileResponse | undefined
      if (result.profileToken) {
        try {
          profile = await cmsIdentityVerificationClient.fetchVerifiedProfile(
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
    [goNext, updateStepData]
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
          isVerifying={isVerifying}
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

  return (
    <AuthPageShell showLogo={false} cardClassName={registerCardClassName}>
      <div className="register-page-content">
        <RegisterStepProgress currentStep={currentStep} totalSteps={totalSteps} />
        {renderStep()}
      </div>
    </AuthPageShell>
  )
}
