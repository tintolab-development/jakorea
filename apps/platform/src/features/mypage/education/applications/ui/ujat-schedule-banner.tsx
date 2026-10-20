import peopleIconUrl from '../assets/icon/people.svg'
import educationStatusBgUrl from '../assets/image/education-status-bg-gradient.svg'
import type { UjatScheduleBannerCopy } from '../lib/ujat-portal-banner'
import { PFChevronButton, PFText } from '@/shared/ui'
import styles from './ujat-schedule-banner.module.css'

type UjatScheduleBannerProps = {
  copy: UjatScheduleBannerCopy
  onActivate?: () => void
}

function noopActivate() {}

export function UjatScheduleBanner({ copy, onActivate }: UjatScheduleBannerProps) {
  const copyBlock = (
    <>
      <img className={styles.bg} src={educationStatusBgUrl} alt="" aria-hidden="true" />
      <div className={styles.headline}>
        <img className={styles.icon} src={peopleIconUrl} alt="" aria-hidden="true" />
        <PFText as="p" typo="hd-sm" color="white" className={styles.title}>
          {copy.title}
        </PFText>
      </div>
      <PFText as="p" typo="bd-lg-sb" color="white" className={styles.body}>
        {copy.body}
      </PFText>
      {copy.clickable ? (
        <PFChevronButton className={styles.chevron} size="large" direction="right" decorative />
      ) : null}
    </>
  )

  if (!copy.clickable) {
    return (
      <div className={styles.banner} role="status">
        {copyBlock}
      </div>
    )
  }

  return (
    <button
      type="button"
      className={`${styles.banner} ${styles.bannerClickable}`}
      aria-label={copy.title}
      data-pf-chevron-hover=""
      onClick={onActivate ?? noopActivate}
    >
      {copyBlock}
    </button>
  )
}
