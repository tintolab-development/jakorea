import type { ReactNode } from 'react'
import { PFText } from '@/shared/ui'
import { authPageCopyClass } from '@/widgets/layout/auth-page-shell'
import styles from './step-header.module.css'

type StepHeaderProps = {
  title: ReactNode
  description?: ReactNode
}

export function StepHeader({ title, description }: StepHeaderProps) {
  return (
    <>
      <PFText as="div" typo="hd-sm" color="black" className={authPageCopyClass('title', styles.title)}>
        {title}
      </PFText>
      {description ? (
        <PFText as="p" typo="bd-lg-rg" color="primary-800" className={authPageCopyClass('description')}>
          {description}
        </PFText>
      ) : null}
    </>
  )
}
