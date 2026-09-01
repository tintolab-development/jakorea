import styles from './pf-step-progress.module.css'

type PFStepProgressProps = {
  currentStep: number
  totalSteps?: number
  ariaLabel?: string
}

export function PFStepProgress({
  currentStep,
  totalSteps = 7,
  ariaLabel = '진행 단계',
}: PFStepProgressProps) {
  return (
    <nav className={styles.progress} aria-label={ariaLabel}>
      <ol className={styles.list}>
        {Array.from({ length: totalSteps }, (_, index) => {
          const step = index + 1
          const isActive = step === currentStep
          const isCompleted = step < currentStep
          const circleClassName = [
            styles.circle,
            isActive ? styles.circleActive : undefined,
            isCompleted ? styles.circleCompleted : undefined,
          ]
            .filter(Boolean)
            .join(' ')
          const lineClassName = [
            styles.line,
            step < currentStep ? styles.lineActive : undefined,
          ]
            .filter(Boolean)
            .join(' ')

          return (
            <li className={styles.item} key={step}>
              <span className={circleClassName} aria-current={isActive ? 'step' : undefined}>
                {step}
              </span>
              {index < totalSteps - 1 ? <span className={lineClassName} aria-hidden="true" /> : null}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
