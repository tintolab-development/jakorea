import { Link } from 'react-router-dom'
import arrowRightWhite16Url from '@/shared/assets/icons/arrow-right-white-16.svg'
import { useHomeMain } from '@/features/home/api/use-home-main'
import type { HomeStripBanner } from '@/features/home/lib/view'
import styles from './top-banner-strip.module.css'

function StripBannerLink({ banner }: { banner: HomeStripBanner }) {
  const className = [styles.banner, 'typo-bd-md-bd'].join(' ')
  const body = (
    <>
      <span className={styles.label}>{banner.label}</span>
      <img
        className={styles.arrow}
        src={arrowRightWhite16Url}
        alt=""
        width={16}
        height={16}
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
export function TopBannerStrip() {
  const { strips } = useHomeMain()
  if (strips.length === 0) return null

  return (
    <div className={styles.strip}>
      {strips.map(banner => (
        <StripBannerLink banner={banner} key={banner.id} />
      ))}
    </div>
  )
}
