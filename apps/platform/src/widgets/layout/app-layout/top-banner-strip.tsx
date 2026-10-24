import { Link } from 'react-router-dom'
import arrowForwardCool200Url from '@/shared/assets/icons/arrow-forward-cool-200.svg'
import { useHomeMain } from '@/features/home/api/use-home-main'
import type { HomeStripBanner } from '@/features/home/lib/view'
import { SkeletonBlock } from '@/features/home/ui/skeleton-block'
import styles from './top-banner-strip.module.css'

function StripBannerLink({ banner }: { banner: HomeStripBanner }) {
  const className = styles.banner
  const body = (
    <>
      <span className={styles.label}>{banner.label}</span>
      <img
        className={styles.arrow}
        src={arrowForwardCool200Url}
        alt=""
        width={20}
        height={20}
        aria-hidden="true"
      />
    </>
  )

  if (banner.external) {
    return (
      <a
        className={className}
        href={banner.href}
        target="_blank"
        rel="noopener noreferrer"
        style={{ backgroundColor: banner.backgroundColor }}
      >
        {body}
      </a>
    )
  }

  return (
    <Link className={className} to={banner.href} style={{ backgroundColor: banner.backgroundColor }}>
      {body}
    </Link>
  )
}

/** 홈 전용 상단 띠배너 — Admin `/main/strip-banners`. 원격 빈 배열이면 숨김 */
const STRIP_SKELETON_KEYS = [0, 1] as const

export function TopBannerStrip() {
  const { strips, isPending } = useHomeMain()
  if (!isPending && strips.length === 0) return null

  return (
    <div className={styles.strip} aria-busy={isPending || undefined}>
      {isPending
        ? STRIP_SKELETON_KEYS.map(key => (
            <div
              className={[styles.banner, styles.bannerPending].join(' ')}
              key={key}
              aria-hidden="true"
            >
              <SkeletonBlock className={styles.bannerBone} />
            </div>
          ))
        : strips.map(banner => <StripBannerLink banner={banner} key={banner.id} />)}
    </div>
  )
}
