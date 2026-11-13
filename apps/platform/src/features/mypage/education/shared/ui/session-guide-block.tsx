import type { ReactNode } from 'react'
import { PFText } from '@/shared/ui'
import styles from './session-guide-block.module.css'

type EducationSessionGuideBlockProps = {
  variant?: 'default' | 'submitted' | 'feedback'
  statusLabel?: string
  statusTone?: 'submitted' | 'unsubmitted'
  message: string
  /** 비활성 안내(예: 진행 예정 강의보고서)는 Figma에서 neutral-cool-500 */
  messageColor?: 'black' | 'neutral-cool-500'
  description?: string
  actions?: ReactNode
  children?: ReactNode
  /** PC 미만에서 문구·버튼을 세로로 쌓고 버튼을 꽉 채움 (opt-in, 기본 off) */
  mobileStack?: boolean
}

export function EducationSessionGuideBlock({
  variant = 'default',
  statusLabel,
  statusTone,
  message,
  messageColor = 'black',
  description,
  actions,
  children,
  mobileStack = false,
}: EducationSessionGuideBlockProps) {
  const blockClassName = [
    styles.block,
    variant === 'submitted' ? styles.submitted : undefined,
    variant === 'feedback' ? styles.feedback : undefined,
    mobileStack ? styles.mobileStack : undefined,
  ]
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
            <PFText as="span" typo="hl-sm" color={messageColor} className={styles.message}>
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
