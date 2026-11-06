import type { EducationSettlementItem } from '../model/types'
import { formatSettlementSessionBannerTitle } from '../lib/format-write-draft'
import { formatEducationSessionDate } from '../../shared'
import { PFText } from '@/shared/ui'
import styles from './settlement-session-banner.module.css'

type EducationSettlementSessionBannerProps = {
  programTitle?: string
  session?: EducationSettlementItem
  /** 지급조서: 기관명+학년 우선. 개인형처럼 없으면 프로그램명 */
  institutionTitle?: boolean
}

function formatSessionBannerMeta(item: EducationSettlementItem): string {
  const date = formatEducationSessionDate(item.heldAt)
  const timeAndSession = item.sessionMeta.replace(
    /^(\d{2}:\d{2})~(\d{2}:\d{2})\s+(.+)$/,
    '$1 - $2 | $3'
  )
  return `${date} ${timeAndSession}`
}

export function EducationSettlementSessionBanner({
  programTitle,
  session,
  institutionTitle = false,
}: EducationSettlementSessionBannerProps) {
  const title = formatSettlementSessionBannerTitle(session, programTitle, {
    institutionOnly: institutionTitle,
  })
  if (!title && !session) return null

  return (
    <div className={styles.banner}>
      {title ? (
        <PFText as="p" typo="bd-lg-sb" color="black" className={styles.bannerTitle}>
          {title}
        </PFText>
      ) : null}
      {session ? (
        <PFText as="p" typo="bd-md-rg" color="primary-500" className={styles.bannerMeta}>
          {formatSessionBannerMeta(session)}
        </PFText>
      ) : null}
    </div>
  )
}
