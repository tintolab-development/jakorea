import type { ReactNode } from 'react'
import jaLogoUrl from '@/shared/assets/brand/ja-logo.svg'
import styles from './lecture-report-preview-page.module.css'

type LectureReportPreviewPageProps = {
  title: string
  pageIndex: number
  children: ReactNode
}

function TitleIcon() {
  return (
    <svg
      className={styles.titleIcon}
      xmlns="http://www.w3.org/2000/svg"
      width="32"
      height="41"
      viewBox="0 0 32 41"
      fill="none"
      aria-hidden
    >
      <path d="M31.2765 0L0 24.518L19.5535 24.4619L31.2765 0Z" fill="#296076" />
      <path d="M31.2681 0L18.9316 24.4312L31.2776 40.5815L31.2681 0Z" fill="#00A0AF" />
    </svg>
  )
}

export function LectureReportPreviewPage({
  title,
  pageIndex,
  children,
}: LectureReportPreviewPageProps) {
  if (pageIndex > 0) {
    return (
      <div className={styles.stage}>
        <div className={styles.frame}>
          <div className={styles.scaleInner}>
            <section className={styles.sheet}>
              <div className={styles.content}>{children}</div>
            </section>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.stage}>
      <div className={styles.frame}>
        <div className={styles.scaleInner}>
          <section className={styles.sheet}>
            <header className={styles.header}>
              <div className={styles.headerLeft}>
                <TitleIcon />
                <h1 className={styles.docTitle}>{title}</h1>
              </div>
              <img className={styles.brandLogo} src={jaLogoUrl} alt="" aria-hidden />
            </header>
            <div className={styles.content}>{children}</div>
          </section>
        </div>
      </div>
    </div>
  )
}
