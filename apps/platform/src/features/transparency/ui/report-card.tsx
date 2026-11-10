import { ANALYTICS_CLICK_METRICS, recordMetric } from '@/features/analytics'
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

export function ReportCard({ report, variant }: ReportCardProps) {
  /*
   * 표지 이미지 아래에 기본 배경을 한 겹 깔아 둔다.
   * 어드민은 서버가 썸네일 필수인 동안 「썸네일 없음」을 1×1 투명 PNG로 올리므로,
   * 그 경우 기본 배경(연차: CSS 청록 단색 · 회계감사: 그라디언트)이 그대로 보인다.
   */
  const coverStyle = report.coverUrl
    ? variant === 'annual'
      ? { backgroundImage: `url(${report.coverUrl})` }
      : { backgroundImage: `url(${report.coverUrl}), ${report.coverGradient}` }
    : variant === 'annual'
      ? undefined
      : { background: report.coverGradient }

  if (variant === 'audit') {
    return (
      <article className={[styles.card, styles.audit].join(' ')}>
        <div className={styles.panel} style={coverStyle}>
          <div className={styles.auditText}>
            <PFText as="p" typo="hd-sm" color="white" className={styles.coverLabel}>
              {report.coverLabel}
            </PFText>
          </div>
          <div className={styles.auditDownload}>
            <DownloadButton
              title={report.title}
              fileName={report.fileName}
              downloadUrl={report.downloadUrl}
              metricCode={ANALYTICS_CLICK_METRICS.auditReportDownload}
            />
          </div>
        </div>

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
      <div className={styles.cover} style={coverStyle}>
        <DownloadButton
          title={report.title}
          fileName={report.fileName}
          downloadUrl={report.downloadUrl}
          metricCode={ANALYTICS_CLICK_METRICS.annualReportDownload}
        />
      </div>

      <div className={styles.meta}>
        <PFText as="h3" typo="hl-lg" color="black" className={styles.title}>
          {report.title}
        </PFText>
      </div>
    </article>
  )
}
