import { ADMIN_REGISTER_TOTAL_STEPS } from '@/types/admin-register'

interface RegisterStepProgressProps {
  currentStep: number
  totalSteps?: number
  className?: string
  /** 진행 단계 영역 라벨 — 회원가입 외 흐름(관리자 등록 회원 최초 로그인 등)에서 지정 */
  ariaLabel?: string
}

export function RegisterStepProgress({
  currentStep,
  totalSteps = ADMIN_REGISTER_TOTAL_STEPS,
  className,
  ariaLabel = '회원가입 진행 단계',
}: RegisterStepProgressProps) {
  const navClassName = className ? `register-step-progress ${className}` : 'register-step-progress'

  return (
    <nav className={navClassName} aria-label={ariaLabel}>
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
                <span className="register-step-progress__line" aria-hidden />
              ) : null}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
