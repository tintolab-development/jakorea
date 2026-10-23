import peopleIconUrl from '../assets/icon/people.svg'
import arrowForwardUrl from '../assets/icon/arrow-forward.svg'
import educationStatusBgUrl from '../assets/image/education-status-bg-gradient.svg'
import type { UjatScheduleBannerCopy } from '../lib/ujat-portal-banner'
import { PFText } from '@/shared/ui'
import styles from './ujat-schedule-banner.module.css'

type UjatScheduleBannerProps = {
  copy: UjatScheduleBannerCopy
  onActivate?: () => void
}

function noopActivate() {}

function BannerCopy({ copy }: { copy: UjatScheduleBannerCopy }) {
  return (
    <>
      <img className={styles.bg} src={educationStatusBgUrl} alt="" aria-hidden="true" />
      <div className={styles.headline}>
        <img className={styles.icon} src={peopleIconUrl} alt="" aria-hidden="true" />
        <PFText as="p" typo="hd-sm" color="white" className={styles.title}>
          {copy.title}
        </PFText>
      </div>
      <PFText as="p" typo="bd-lg-rg" color="white" className={styles.body}>
        {copy.body}
      </PFText>
      {copy.clickable ? (
        <span className={styles.chevron} aria-hidden="true">
          <img src={arrowForwardUrl} width={32} height={32} alt="" />
        </span>
      ) : null}
    </>
  )
}

export function UjatScheduleBanner({ copy, onActivate }: UjatScheduleBannerProps) {
  if (!copy.clickable) {
    return (
      <div className={styles.banner} role="status">
        <BannerCopy copy={copy} />
      </div>
    )
  }

  return (
    <button
      type="button"
      className={`${styles.banner} ${styles.bannerClickable}`}
      aria-label={copy.title}
      onClick={onActivate ?? noopActivate}
    >
      <BannerCopy copy={copy} />
    </button>
  )
}
