import type { ReactNode } from 'react'
import { SignUpActions } from './actions'
import { StepHeader } from './step-header'
import styles from './sign-up-step-layout.module.css'

type SignUpStepLayoutProps = {
  title: ReactNode
  description?: ReactNode
  children: ReactNode
  actions: ReactNode
  actionsVariant?: 'default' | 'terms'
  afterActions?: ReactNode
}

export function SignUpStepLayout({
  title,
  description,
  children,
  actions,
  actionsVariant = 'default',
  afterActions,
}: SignUpStepLayoutProps) {
  return (
    <>
      <StepHeader title={title} description={description} />
      <div className={styles.stepBody}>{children}</div>
      <SignUpActions variant={actionsVariant}>{actions}</SignUpActions>
      {afterActions}
    </>
  )
}
