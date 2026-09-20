import { useEffect, useState, type CSSProperties } from 'react'
import { useHomeMain } from '../api/use-home-main'
import styles from './social-rail.module.css'

/** 히어로 이탈 시 다크 배경 보간 거리(px) */
const LEAVE_FADE_PX = 220
/** 초기 투명 유지용 스크롤 임계값 */
const SCROLL_CHROME_PX = 8

type RailSurface = {
  topPx: number
  /** 스크롤 전 초기 — 배경·보더·그림자 완전 비표시 */
  isInitial: boolean
  /** 0 = 히어로 · 1 = 이탈 후 다크 카드 배경 */
  leave: number
}

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value))
}

export function SocialRail() {
  const { socialLinks } = useHomeMain()
  const [rail, setRail] = useState<RailSurface>({
    topPx: typeof window === 'undefined' ? 0 : window.innerHeight / 2,
    isInitial: true,
    leave: 0,
  })

  useEffect(() => {
    if (socialLinks.length === 0) return
    const hero = document.querySelector('[data-home-hero]')
    let frame = 0

    const measure = () => {
      const viewportMidY = window.innerHeight / 2
      const isInitial = window.scrollY <= SCROLL_CHROME_PX

      if (!hero) {
        setRail({ topPx: viewportMidY, isInitial: false, leave: 1 })
        return
      }

      const rect = hero.getBoundingClientRect()
      const heroMidY = rect.top + rect.height / 2
      // 시작: 히어로 세로 중앙 → 스크롤 후 뷰포트 중앙 스티키
      const topPx = Math.max(heroMidY, viewportMidY)
      // 초기(스크롤 전)는 항상 투명 · 이탈은 히어로 하단이 뷰포트 중앙을 지날 때
      const leave = isInitial
        ? 0
        : clamp01((viewportMidY - rect.bottom) / LEAVE_FADE_PX)

      setRail({ topPx, isInitial, leave })
    }

    const onScrollOrResize = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(measure)
    }

    measure()
    window.addEventListener('scroll', onScrollOrResize, { passive: true })
    window.addEventListener('resize', onScrollOrResize)

    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScrollOrResize)
      window.removeEventListener('resize', onScrollOrResize)
    }
  }, [socialLinks.length])

  if (socialLinks.length === 0) return null

  const railClassName = [styles.rail, rail.isInitial ? styles.railInitial : undefined]
    .filter(Boolean)
    .join(' ')

  return (
    <nav
      className={railClassName}
      aria-label="JA Korea 소셜 미디어"
      style={
        {
          top: rail.topPx,
          '--rail-leave': String(rail.leave),
        } as CSSProperties
      }
    >
      {socialLinks.map(({ label, href, iconUrl, channelCode }) => {
        const isMail = href.startsWith('mailto:')
        return (
          <a
            className={styles.link}
            href={href}
            target={isMail ? undefined : '_blank'}
            rel={isMail ? undefined : 'noopener noreferrer'}
            aria-label={label}
            key={channelCode}
          >
            <img className={styles.icon} src={iconUrl} alt="" aria-hidden="true" />
          </a>
        )
      })}
    </nav>
  )
}
