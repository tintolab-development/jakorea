/**
 * 관리자 회원가입 페이지
 */

import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

import { useIdentityVerification, clearPendingIdentityChallenge } from '@/features/auth/identity-verification'
import { useAdminRegisterWizard } from '@/features/auth/hooks/use-admin-register-wizard'
import { AdminRegisterStepBirthGender } from '@/features/auth/ui/admin-register/admin-register-step-birth-gender'
import { AdminRegisterStepEmail } from '@/features/auth/ui/admin-register/admin-register-step-email'
import { AdminRegisterStepIdentity } from '@/features/auth/ui/admin-register/admin-register-step-identity'
import { AdminRegisterStepReview } from '@/features/auth/ui/admin-register/admin-register-step-review'
import { AdminRegisterStepPassword } from '@/features/auth/ui/admin-register/admin-register-step-password'
import { AdminRegisterStepTerms } from '@/features/auth/ui/admin-register/admin-register-step-terms'
import { RegisterStepProgress } from '@/features/auth/ui/admin-register/register-step-progress'
import { AuthPageShell } from '@/features/auth/ui/auth-page-shell'
import { useQueryParams } from '@/shared/hooks/use-query-params'
import type {
  AdminRegisterStep1Data,
  AdminRegisterStep3Data,
  AdminRegisterStep4Data,
  AdminRegisterStep5Data,
} from '@/types/admin-register'

import './register-page.css'

export function RegisterPage() {
  const navigate = useNavigate()
  const { params } = useQueryParams<{ redirect?: string }>()
  const {
    currentStep,
    formData,
    updateStepData,
    goNext,
    goPrev,
    buildLoginPath,
    buildCompletePath,
    totalSteps,
  } = useAdminRegisterWizard({ redirectPath: params.redirect })

  const handleIdentitySuccess = useCallback(
    (result: {
      sessionId: number
      sessionUuid?: string
      verifiedName?: string
      verifiedPhone?: string
      verifiedAt: string
    }) => {
      updateStepData({
        identityVerificationSessionId: result.sessionId,
        identityVerificationSessionUuid:
          result.sessionUuid ?? String(result.sessionId),
        identityVerificationStatus: 'verified',
        identityVerifiedAt: result.verifiedAt,
        verifiedName: result.verifiedName,
        verifiedPhone: result.verifiedPhone,
      })
      goNext()
    },
    [goNext, updateStepData]
  )

  const { verify, status, isVerifying, errorMessage } = useIdentityVerification({
    birthDate: formData.birthDate,
    gender: formData.gender,
    onSuccess: handleIdentitySuccess,
  })

  const handleStep1Next = (values: AdminRegisterStep1Data) => {
    updateStepData(values)
    goNext()
  }

  const handleStep3Next = (values: AdminRegisterStep3Data) => {
    updateStepData(values)
    goNext()
  }

  const handleStep4Next = (values: AdminRegisterStep4Data) => {
    updateStepData(values)
    goNext()
  }

  const handleStep5Next = (values: AdminRegisterStep5Data) => {
    updateStepData(values)
    goNext()
  }

  const handleBack = () => {
    if (currentStep === 2) {
      clearPendingIdentityChallenge()
    }
    if (currentStep === 1) {
      navigate(buildLoginPath(), { replace: true })
      return
    }
    goPrev()
  }

  const renderStep = () => {
    if (currentStep === 1) {
      return (
        <AdminRegisterStepBirthGender
          initialValues={formData}
          onNext={handleStep1Next}
          onBack={handleBack}
        />
      )
    }

    if (currentStep === 2) {
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

    if (currentStep === 3) {
      return (
        <AdminRegisterStepTerms
          initialValues={{
            termsOfService: formData.termsOfService,
            privacyPolicy: formData.privacyPolicy,
            marketingConsent: formData.marketingConsent,
            mfaSetupAgreed: formData.mfaSetupAgreed,
          }}
          onNext={handleStep3Next}
          onBack={handleBack}
        />
      )
    }

    if (currentStep === 4) {
      return (
        <AdminRegisterStepEmail
          initialValues={{
            emailLocalPart: formData.emailLocalPart,
            email: formData.email,
          }}
          onNext={handleStep4Next}
          onBack={handleBack}
        />
      )
    }

    if (currentStep === 5) {
      return (
        <AdminRegisterStepPassword
          initialValues={{ password: formData.password }}
          onNext={handleStep5Next}
          onBack={handleBack}
        />
      )
    }

    if (currentStep === 6) {
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
    currentStep === 2
      ? 'auth-card--register auth-card--register-step-2'
      : currentStep === 3
        ? 'auth-card--register auth-card--register-step-3'
        : currentStep === 5
          ? 'auth-card--register auth-card--register-step-5'
          : currentStep === 6
            ? 'auth-card--register auth-card--register-step-6'
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
