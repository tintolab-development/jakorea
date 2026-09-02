import type { ReactNode } from 'react'
import { PFText } from '@/shared/ui'
import styles from './session-guide-block.module.css'

type EducationSessionGuideBlockProps = {
  variant?: 'default' | 'submitted'
  statusLabel?: string
  statusTone?: 'submitted' | 'unsubmitted'
  message: string
  description?: string
  actions?: ReactNode
  children?: ReactNode
}

export function EducationSessionGuideBlock({
  variant = 'default',
  statusLabel,
  statusTone,
  message,
  description,
  actions,
  children,
}: EducationSessionGuideBlockProps) {
  const blockClassName = [styles.block, variant === 'submitted' ? styles.submitted : undefined]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={blockClassName}>
      <div className={styles.top}>
        <div className={styles.main}>
          <p className={styles.messageRow}>
            {statusLabel ? (
              <PFText
                as="span"
                typo="hl-sm"
                color={statusTone === 'submitted' ? 'primary-500' : 'neutral-cool-500'}
                className={styles.statusLabel}
              >
                {statusLabel}
              </PFText>
            ) : null}
            <PFText as="span" typo="hl-sm" color="black" className={styles.message}>
              {message}
            </PFText>
          </p>
          {description ? (
            <PFText as="p" typo="bd-md-rg" color="neutral-cool-600" className={styles.description}>
              {description}
            </PFText>
          ) : null}
        </div>
        {actions ? <div className={styles.actionStack}>{actions}</div> : null}
      </div>
      {children}
    </div>
  )
}
