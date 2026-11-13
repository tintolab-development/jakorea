import type { ReactNode } from 'react'
import { ANALYTICS_CLICK_METRICS, recordMetric } from '@/features/analytics'
import jaLogoGrayCompactUrl from '@/shared/assets/brand/ja-logo-gray-compact.svg'
import { useRemoteThumbnailUrl } from '@/shared/hooks'
import { downloadAttachment } from '@/shared/lib/download-attachment'
import { PFText } from '@/shared/ui'
import downloadPrimary20Url from '../image/icon/download-primary-20.svg'
import type { TransparencyReport, TransparencyReportType } from '../model/types'
import styles from './report-card.module.css'

export type ReportCardProps = {
  report: TransparencyReport
  /** annual: 세로형 커버 + 하단 타이틀 / audit: 커버(상단 라벨·다운로드) + 하단 타이틀·날짜 */
  variant: TransparencyReportType
}

function DownloadButton({
  title,
  fileName,
  downloadUrl,
  metricCode,
}: {
  title: string
  fileName: string
  downloadUrl?: string
  metricCode: string
}) {
  return (
    <button
      type="button"
      className={styles.downloadButton}
      aria-label={`${title} 다운로드`}
      onClick={() => {
        recordMetric(metricCode)
        void downloadAttachment(fileName, downloadUrl)
      }}
    >
      <img
        className={styles.downloadIcon}
        src={downloadPrimary20Url}
        alt=""
        aria-hidden="true"
        width={20}
        height={20}
      />
    </button>
  )
}

/**
 * 표지 — Figma 11001:159541(연차) · 11001:159624(회계감사) 기본 썸네일:
 * 표지가 없거나 어드민 「썸네일 없음」 표식(1×1 투명 PNG)이면 회색 배경 + 1px 테두리 + 가운데 JA Korea 로고를 그린다.
 * 표지가 있으면 이미지만 그려, 투명 배경 PNG 표지 뒤로 기본 썸네일이 비치지 않게 한다.
 */
function ReportCover({
  coverUrl,
  className,
  children,
}: {
  coverUrl?: string
  className: string
  children: ReactNode
}) {
  const imageUrl = useRemoteThumbnailUrl(coverUrl)
  return (
    <div className={[className, imageUrl ? '' : styles.coverDefault].filter(Boolean).join(' ')}>
      {/* 기본 썸네일 로고는 표지가 없을 때만 — 투명 배경 PNG 표지 뒤로 비치지 않게 한다 */}
      {imageUrl ? null : (
        <img className={styles.coverLogo} src={jaLogoGrayCompactUrl} alt="" aria-hidden="true" />
      )}
      {imageUrl ? (
        <div
          className={styles.coverImage}
          style={{ backgroundImage: `url(${imageUrl})` }}
          aria-hidden="true"
        />
      ) : null}
      {children}
    </div>
  )
}

export function ReportCard({ report, variant }: ReportCardProps) {
  if (variant === 'audit') {
    return (
      <article className={[styles.card, styles.audit].join(' ')}>
        <ReportCover coverUrl={report.coverUrl} className={styles.panel}>
          <div className={styles.auditDownload}>
            <DownloadButton
              title={report.title}
              fileName={report.fileName}
              downloadUrl={report.downloadUrl}
              metricCode={ANALYTICS_CLICK_METRICS.auditReportDownload}
            />
          </div>
        </ReportCover>

        <div className={styles.meta}>
          <PFText as="h3" typo="hl-lg" color="black" className={styles.title}>
            {report.title}
          </PFText>
          {report.date ? (
            <PFText as="p" typo="bd-lg-rg" color="neutral-cool-600" className={styles.date}>
              {report.date}
            </PFText>
          ) : null}
        </div>
      </article>
    )
  }

  return (
    <article className={[styles.card, styles.annual].join(' ')}>
      <ReportCover coverUrl={report.coverUrl} className={styles.cover}>
        <DownloadButton
          title={report.title}
          fileName={report.fileName}
          downloadUrl={report.downloadUrl}
          metricCode={ANALYTICS_CLICK_METRICS.annualReportDownload}
        />
      </ReportCover>

      <div className={styles.meta}>
        <PFText as="h3" typo="hl-lg" color="black" className={styles.title}>
          {report.title}
        </PFText>
      </div>
    </article>
  )
}
