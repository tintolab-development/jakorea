import { PFCategoryBadge } from '@/shared/ui'
import partnerSchoolIconUrl from '../image/icon/partner-school.svg'
import styles from './partner-badge.module.css'

type PartnerBadgeProps = {
  partnerName: string
}

export function PartnerBadge({ partnerName }: PartnerBadgeProps) {
  return (
    <PFCategoryBadge
      size="small"
      iconVariant="primary"
      className={styles.badge}
      icon={
        <img
          src={partnerSchoolIconUrl}
          alt=""
          width={20}
          height={20}
          aria-hidden="true"
        />
      }
    >
      <span className={styles.content}>
        <span>파트너</span>
        <span className={styles.divider} aria-hidden="true" />
        <span>{partnerName}</span>
      </span>
    </PFCategoryBadge>
  )
}
