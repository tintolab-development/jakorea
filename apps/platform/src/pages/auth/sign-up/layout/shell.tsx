import type { ReactNode } from 'react'
import { PFStepProgress } from '@/shared/ui'
import styles from '../wizard.module.css'

type SignUpLayoutProps = {
  currentStep: number
  totalSteps: number
  children: ReactNode
  footer?: ReactNode
}

export function SignUpLayout({ currentStep, totalSteps, children, footer }: SignUpLayoutProps) {
  return (
    <section className={styles.page}>
      <div className={styles.container}>
        <PFStepProgress
          currentStep={currentStep}
          totalSteps={totalSteps}
          ariaLabel="회원가입 진행 단계"
        />
        {children}
        {footer}
      </div>
    </section>
  )
}
