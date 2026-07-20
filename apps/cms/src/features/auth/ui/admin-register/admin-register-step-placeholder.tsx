import { LoadingButton } from '@/shared/ui'

import type { AdminRegisterWizardData } from '@/types/admin-register'

interface AdminRegisterStepPlaceholderProps {
  step: number
  formData: AdminRegisterWizardData
  onNext: () => void
  onBack: () => void
}

export function AdminRegisterStepPlaceholder({
  step,
  formData,
  onNext,
  onBack,
}: AdminRegisterStepPlaceholderProps) {
  return (
    <div className="admin-register-step admin-register-step--placeholder">
      <header className="register-step-header">
        <h1 className="register-step-header__title">{step}단계 준비 중</h1>
        <p className="register-step-header__description">
          이후 단계 UI는 추후 제공될 예정입니다.
          {step === 6 && formData.password ? (
            <>
              <br />
              5단계 비밀번호 설정 완료
            </>
          ) : null}
        </p>
      </header>

      <div className="auth-actions admin-register-step__actions">
        {step < 6 ? (
          <LoadingButton type="primary" block className="auth-submit-btn" onClick={onNext}>
            다음
          </LoadingButton>
        ) : null}
        <LoadingButton type="default" block className="auth-secondary-btn" onClick={onBack}>
          이전으로
        </LoadingButton>
      </div>
    </div>
  )
}
