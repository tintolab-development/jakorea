import type { ReactNode } from 'react'
import { PFStepProgress } from '@/shared/ui'

type SignUpLayoutProps = {
  currentStep: number
  totalSteps: number
  children: ReactNode
  footer?: ReactNode
}

export function SignUpLayout({ currentStep, totalSteps, children, footer }: SignUpLayoutProps) {
  return (
    <>
      <PFStepProgress
        currentStep={currentStep}
        totalSteps={totalSteps}
        ariaLabel="회원가입 진행 단계"
      />
      {children}
      {footer}
    </>
  )
}
