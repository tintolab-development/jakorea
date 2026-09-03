import type { EducationSettlementItem } from '../model/types'
import { formatEducationSessionDate } from '../../shared'
import { PFText } from '@/shared/ui'
import styles from './settlement-session-banner.module.css'

type EducationSettlementSessionBannerProps = {
  programTitle?: string
  session?: EducationSettlementItem
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
}: EducationSettlementSessionBannerProps) {
  if (!programTitle && !session) return null

  return (
    <div className={styles.banner}>
      {programTitle ? (
        <PFText as="p" typo="bd-lg-sb" color="black" className={styles.bannerTitle}>
          {programTitle}
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
