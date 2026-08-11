import type { ReactNode } from 'react'
import { PFText } from '../pf-text'
import styles from './pf-form.module.css'

export type PFFormSectionProps = {
  title: string
  /** 단락 타이틀 옆 필수 `*` */
  required?: boolean
  description?: ReactNode
  /** 단락 본문(필드) 하단 안내 텍스트 */
  footer?: ReactNode
  children: ReactNode
  className?: string
  id?: string
}

export function PFFormSection({
  title,
  required = false,
  description,
  footer,
  children,
  className,
  id,
}: PFFormSectionProps) {
  const titleId = id ? `${id}-title` : undefined
  const rootClassName = [styles.section, className].filter(Boolean).join(' ')

  return (
    <section className={rootClassName} aria-labelledby={titleId}>
      <div className={styles.sectionHeader}>
        <div className={styles.sectionTitleRow}>
          <PFText
            id={titleId}
            as="h2"
            typo="form-section-title"
            color="black"
            className={styles.sectionTitle}
          >
            {title}
          </PFText>
          {required ? (
            <PFText
              as="span"
              typo="bd-lg-sb"
              color="error"
              className={styles.sectionRequired}
              aria-hidden
            >
              *
            </PFText>
          ) : null}
        </div>
        {description ? (
          typeof description === 'string' ? (
            <PFText
              as="p"
              typo="bd-md-rg"
              color="neutral-cool-500"
              className={styles.sectionDescription}
            >
              {description}
            </PFText>
          ) : (
            description
          )
        ) : null}
      </div>
      <div className={styles.sectionBody}>
        {children}
        {footer ? (
          typeof footer === 'string' ? (
            <p className={styles.sectionBodyText}>{footer}</p>
          ) : (
            footer
          )
        ) : null}
      </div>
    </section>
  )
}
