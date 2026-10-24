import { useEffect, useRef, useState } from 'react'
import { useHomeMain } from '../api/use-home-main'
import styles from './social-rail.module.css'

/** 히어로 이탈 시 다크 배경 보간 거리(px) */
const LEAVE_FADE_PX = 220
/** 초기 투명 유지용 스크롤 임계값 */
const SCROLL_CHROME_PX = 8

type RailChrome = {
  isInitial: boolean
  showBlur: boolean
}

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value))
}

export function SocialRail() {
  const { socialLinks } = useHomeMain()
  const railRef = useRef<HTMLElement>(null)
  const chromeRef = useRef<RailChrome>({ isInitial: true, showBlur: false })
  const [chrome, setChrome] = useState<RailChrome>(chromeRef.current)

  useEffect(() => {
    if (socialLinks.length === 0) return
    const rail = railRef.current
    if (!rail) return

    const hero = document.querySelector('[data-home-hero]')
    let frame = 0
    let lastTransform = ''
    let lastLeave = ''

    const measure = () => {
      const viewportMidY = window.innerHeight / 2
      const isInitial = window.scrollY <= SCROLL_CHROME_PX

      let topPx = viewportMidY
      let leave = 1

      if (hero) {
        const rect = hero.getBoundingClientRect()
        const heroMidY = rect.top + rect.height / 2
        // 시작: 히어로 세로 중앙 → 스크롤 후 뷰포트 중앙 스티키
        topPx = Math.max(heroMidY, viewportMidY)
        // 히어로가 뷰포트 아래로 완전히 빠진 뒤에만 배경·쉐도우를 보간한다.
        leave = isInitial || rect.bottom > 0 ? 0 : clamp01(-rect.bottom / LEAVE_FADE_PX)
      }

      const transform = `translate3d(0, calc(${topPx}px - 50%), 0)`
      const leaveValue = leave.toFixed(3)
      const showBlur = !isInitial && leave > 0

      if (transform !== lastTransform) {
        rail.style.transform = transform
        lastTransform = transform
      }
      if (leaveValue !== lastLeave) {
        rail.style.setProperty('--rail-leave', leaveValue)
        lastLeave = leaveValue
      }

      const prev = chromeRef.current
      if (prev.isInitial !== isInitial || prev.showBlur !== showBlur) {
        const next = { isInitial, showBlur }
        chromeRef.current = next
        setChrome(next)
      }
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

  const railClassName = [
    styles.rail,
    chrome.isInitial ? styles.railInitial : undefined,
    chrome.showBlur ? styles.railBlur : undefined,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <nav ref={railRef} className={railClassName} aria-label="JA Korea 소셜 미디어">
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
