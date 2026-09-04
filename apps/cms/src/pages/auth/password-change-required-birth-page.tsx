/**
 * 최초 로그인 — 생년월일·성별 (스크린샷1)
 */

import { useNavigate } from 'react-router-dom'

import {
  getPasswordChangeRequiredWizardState,
  updatePasswordChangeRequiredWizardState,
  usePasswordChangeRequiredGuard,
} from '@/features/auth/password-change-required'
import { AdminRegisterStepBirthGender } from '@/features/auth/ui/admin-register/admin-register-step-birth-gender'
import { RegisterStepProgress } from '@/features/auth/ui/admin-register/register-step-progress'
import { AuthPageShell } from '@/features/auth/ui/auth-page-shell'
import type { AdminRegisterStep1Data } from '@/types/admin-register'
import { passwordChangeRequiredPaths } from '@/shared/utils/post-auth-redirect'

import './register-page.css'
import './password-change-required-birth-page.css'

export function PasswordChangeRequiredBirthPage() {
  const navigate = useNavigate()
  const { isReady } = usePasswordChangeRequiredGuard()
  const wizardState = getPasswordChangeRequiredWizardState()

  if (!isReady) {
    return null
  }

  const handleNext = (values: AdminRegisterStep1Data) => {
    updatePasswordChangeRequiredWizardState({
      birthDate: values.birthDate,
      gender: values.gender,
    })
    navigate(passwordChangeRequiredPaths.identity)
  }

  const handleBack = () => {
    navigate(passwordChangeRequiredPaths.notice)
  }

  return (
    <AuthPageShell showLogo={false} cardClassName="register-card">
      <div className="password-change-required-birth-page">
        <RegisterStepProgress currentStep={1} totalSteps={2} />
        <AdminRegisterStepBirthGender
          initialValues={{
            birthDate: wizardState?.birthDate,
            gender: wizardState?.gender,
          }}
          onNext={handleNext}
          onBack={handleBack}
        />
      </div>
    </AuthPageShell>
  )
}
