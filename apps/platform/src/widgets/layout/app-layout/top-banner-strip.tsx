import { Link } from 'react-router-dom'
import styles from './top-banner-strip.module.css'

/** 홈 전용 상단 띠배너 2개 — 카피·링크는 CMS 연동 전 임시값 */
const topBanners = [
  {
    id: 'volunteer',
    label: '경제교육 봉사자 모집 중',
    href: '/programs',
    tone: 'light',
  },
  {
    id: 'annual-report',
    label: '2026연차보고서가 발간되었습니다 !',
    href: '/about/transparency/annual-reports',
    tone: 'primary',
  },
] as const

export function TopBannerStrip() {
  return (
    <div className={styles.strip}>
      {topBanners.map(banner => (
        <Link
          className={[
            styles.banner,
            banner.tone === 'primary' ? styles.bannerPrimary : styles.bannerLight,
          ].join(' ')}
          to={banner.href}
          key={banner.id}
        >
          <span className={styles.label}>{banner.label}</span>
          <span className={styles.arrow} aria-hidden="true">
            →
          </span>
        </Link>
      ))}
    </div>
  )
}
