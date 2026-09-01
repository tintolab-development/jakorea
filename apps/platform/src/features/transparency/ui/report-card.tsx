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

function DownloadButton({ title, fileName }: { title: string; fileName: string }) {
  return (
    <button
      type="button"
      className={styles.downloadButton}
      aria-label={`${title} 다운로드`}
      onClick={() => downloadAttachment(fileName)}
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
  const coverStyle = report.coverUrl
    ? { backgroundImage: `url(${report.coverUrl})` }
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
            <DownloadButton title={report.title} fileName={report.fileName} />
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
        <DownloadButton title={report.title} fileName={report.fileName} />
      </div>

      <div className={styles.meta}>
        <PFText as="h3" typo="hl-lg" color="black" className={styles.title}>
          {report.title}
        </PFText>
      </div>
    </article>
  )
}
