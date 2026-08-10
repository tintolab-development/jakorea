import { downloadAttachment } from '@/shared/lib/download-attachment'
import { PFText } from '@/shared/ui'
import downloadGray24Url from '../image/icon/download-gray-24.svg'
import type { TransparencyReport, TransparencyReportType } from '../model/types'
import styles from './report-card.module.css'

export type ReportCardProps = {
  report: TransparencyReport
  /** annual: 세로형(4:5) 커버 + 타이틀 / audit: 가로형 커버 + 타이틀·날짜 */
  variant: TransparencyReportType
}

export function ReportCard({ report, variant }: ReportCardProps) {
  return (
    <article className={[styles.card, styles[variant]].join(' ')}>
      <div
        className={styles.cover}
        style={
          report.coverUrl
            ? { backgroundImage: `url(${report.coverUrl})` }
            : { background: report.coverGradient }
        }
      >
        {report.coverUrl ? null : (
          <span className={styles.coverLabel} aria-hidden="true">
            {report.coverLabel}
          </span>
        )}
        <button
          type="button"
          className={styles.downloadButton}
          aria-label={`${report.title} 다운로드`}
          onClick={() => downloadAttachment(report.fileName)}
        >
          <img
            className={styles.downloadIcon}
            src={downloadGray24Url}
            alt=""
            aria-hidden="true"
            width={24}
            height={24}
          />
        </button>
      </div>

      <div className={styles.meta}>
        <PFText as="h3" typo="hd-sm" color="black" className={styles.title}>
          {report.title}
        </PFText>
        {report.date ? (
          <PFText as="p" typo="bd-md-rg" color="neutral-cool-500" className={styles.date}>
            {report.date}
          </PFText>
        ) : null}
      </div>
    </article>
  )
}
