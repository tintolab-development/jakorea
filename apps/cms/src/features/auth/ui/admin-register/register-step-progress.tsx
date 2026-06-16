import { ADMIN_REGISTER_TOTAL_STEPS } from '@/types/admin-register'

interface RegisterStepProgressProps {
  currentStep: number
  totalSteps?: number
}

export function RegisterStepProgress({
  currentStep,
  totalSteps = ADMIN_REGISTER_TOTAL_STEPS,
}: RegisterStepProgressProps) {
  return (
    <nav className="register-step-progress" aria-label="회원가입 진행 단계">
      <ol className="register-step-progress__list">
        {Array.from({ length: totalSteps }, (_, index) => {
          const step = index + 1
          const isActive = step === currentStep
          const isCompleted = step < currentStep

          return (
            <li key={step} className="register-step-progress__item">
              <span
                className={`register-step-progress__circle${
                  isActive ? ' register-step-progress__circle--active' : ''
                }${isCompleted ? ' register-step-progress__circle--completed' : ''}`}
                aria-current={isActive ? 'step' : undefined}
              >
                {step}
              </span>
              {index < totalSteps - 1 ? (
                <span
                  className={`register-step-progress__line${
                    step < currentStep ? ' register-step-progress__line--active' : ''
                  }`}
                  aria-hidden
                />
              ) : null}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
