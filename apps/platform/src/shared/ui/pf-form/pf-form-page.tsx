import type { ReactNode } from 'react'
import { PFText } from '../pf-text'
import styles from './pf-form.module.css'

export type PFFormPageProps = {
  /** 상단 이전/목록 버튼 영역 */
  back?: ReactNode
  title: ReactNode
  description?: ReactNode
  children: ReactNode
  className?: string
  'aria-label'?: string
}

export function PFFormPage({
  back,
  title,
  description,
  children,
  className,
  'aria-label': ariaLabel,
}: PFFormPageProps) {
  const rootClassName = [styles.page, className].filter(Boolean).join(' ')

  return (
    <section className={rootClassName} aria-label={ariaLabel}>
      <div className={styles.inner}>
        {back ? <div className={styles.back}>{back}</div> : null}

        <header className={styles.titleBlock}>
          {typeof title === 'string' ? (
            <PFText as="h1" typo="hd-lg" color="black" className={styles.pageTitle}>
              {title}
            </PFText>
          ) : (
            title
          )}
          {description ? (
            typeof description === 'string' ? (
              <PFText
                as="p"
                typo="bd-md-rg"
                color="neutral-cool-600"
                className={styles.pageDescription}
              >
                {description}
              </PFText>
            ) : (
              description
            )
          ) : null}
        </header>

        <div className={styles.content}>{children}</div>
      </div>
    </section>
  )
}
