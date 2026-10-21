import type { ReactNode } from 'react'
import { PFText } from '../pf-text'
import styles from './pf-form.module.css'

export type PFFormPageProps = {
  /** 상단 이전/목록 버튼 영역 */
  back?: ReactNode
  title: ReactNode
  /** 제목 옆 단계 (시안 `1 / 2`) */
  step?: string
  /** 제목 행 우측 (예: 전자서명 수정하기) */
  titleAside?: ReactNode
  description?: ReactNode
  /** 시안 프로그램 요약 바 (제목 + 신청/운영 기간) */
  programSummary?: { title: string; period?: string }
  children: ReactNode
  className?: string
  innerClassName?: string
  'aria-label'?: string
}

export function PFFormPage({
  back,
  title,
  step,
  titleAside,
  description,
  programSummary,
  children,
  className,
  innerClassName,
  'aria-label': ariaLabel,
}: PFFormPageProps) {
  const rootClassName = [styles.page, className].filter(Boolean).join(' ')
  const innerClassNames = [styles.inner, innerClassName].filter(Boolean).join(' ')

  return (
    <section className={rootClassName} aria-label={ariaLabel}>
      <div className={innerClassNames}>
        {back ? <div className={styles.back}>{back}</div> : null}

        <header className={styles.titleBlock}>
          <div className={titleAside != null ? styles.titleRow : undefined}>
            <div className={step ? styles.titleWithStep : undefined}>
              {typeof title === 'string' ? (
                <PFText as="h1" typo="hd-lg" color="black" className={styles.pageTitle}>
                  {title}
                </PFText>
              ) : (
                title
              )}
              {step ? (
                <PFText as="p" typo="hl-sm" color="primary-500" className={styles.pageStep}>
                  {step}
                </PFText>
              ) : null}
            </div>
            {titleAside != null ? <div className={styles.titleAside}>{titleAside}</div> : null}
          </div>
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

        {programSummary ? (
          <div className={styles.programSummary}>
            <PFText as="h2" typo="hl-sm" color="black">
              {programSummary.title}
            </PFText>
            {programSummary.period ? (
              <PFText as="p" typo="bd-md-md" color="primary-500">
                {programSummary.period}
              </PFText>
            ) : null}
          </div>
        ) : null}

        <div className={styles.content}>{children}</div>
      </div>
    </section>
  )
}
