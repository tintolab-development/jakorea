import { Link } from 'react-router-dom'
import arrowRightWhite16Url from '@/shared/assets/icons/arrow-right-white-16.svg'
import styles from './top-banner-strip.module.css'

/** 홈 전용 상단 띠배너 2개 — 카피·링크·배경색은 Admin 연동 전 임시값 */
const topBanners = [
  {
    id: 'volunteer',
    label: '경제교육 봉사자 모집 중',
    href: '/programs',
    /** Admin 지정 배경색 */
    backgroundColor: 'var(--color-primary-700)',
  },
  {
    id: 'annual-report',
    label: '2026연차보고서가 발간되었습니다 !',
    href: '/about/transparency/annual-reports',
    backgroundColor: 'var(--color-primary-500)',
  },
] as const

export function TopBannerStrip() {
  return (
    <div className={styles.strip}>
      {topBanners.map(banner => (
        <Link
          className={[styles.banner, 'typo-bd-md-bd'].join(' ')}
          to={banner.href}
          key={banner.id}
          style={{ backgroundColor: banner.backgroundColor }}
        >
          <span className={styles.label}>{banner.label}</span>
          <img
            className={styles.arrow}
            src={arrowRightWhite16Url}
            alt=""
            aria-hidden="true"
          />
        </Link>
      ))}
    </div>
  )
}
