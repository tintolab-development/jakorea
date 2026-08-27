import { useEffect, useRef, useState } from 'react'
import { useIntersectionObserver } from '@/shared/hooks/use-intersection-observer'
import { usePrefersReducedMotion } from '@/shared/hooks/use-prefers-reduced-motion'
import { useShouldUsePlatformMockData } from '@/shared/hooks'
import { getHomeAchievementHighlight, getHomeAchievementStats } from '../lib/mock'
import { AnimatedStatNumber } from './animated-stat-number'
import styles from './achievement-section.module.css'

export function AchievementSection() {
  useShouldUsePlatformMockData()
  const stats = getHomeAchievementStats()
  const highlight = getHomeAchievementHighlight()
  const sectionRef = useRef<HTMLElement>(null)
  const prefersReducedMotion = usePrefersReducedMotion()
  const isInView = useIntersectionObserver(sectionRef, {
    threshold: 0.25,
    rootMargin: '0px 0px -8% 0px',
  })
  const [hasStarted, setHasStarted] = useState(false)

  useEffect(() => {
    if (isInView) setHasStarted(true)
  }, [isInView])

  const countEnabled = prefersReducedMotion || hasStarted

  if (stats.length === 0 && !highlight) {
    return null
  }

  return (
    <section className={styles.section} ref={sectionRef}>
      <div className={styles.inner}>
        <div className={styles.header}>
          <p className={styles.eyebrow}>ACHIEVEMENTS</p>
          <h2 className={styles.title}>함께 만들어온 배움의 여정</h2>
        </div>

        {stats.length > 0 ? (
        <dl className={styles.statGrid}>
          {stats.flatMap((stat, index) => {
            const nodes = []
            if (index > 0) {
              nodes.push(
                <span
                  className={styles.statDivider}
                  key={`divider-${stat.label}`}
                  aria-hidden="true"
                />
              )
            }
            nodes.push(
              <div className={styles.stat} key={stat.label}>
                <dt className={styles.statLabel}>{stat.label}</dt>
                <dd className={styles.statValue}>
                  <AnimatedStatNumber
                    value={stat.value}
                    className={styles.statNumber}
                    enabled={countEnabled}
                    immediate={prefersReducedMotion}
                  />
                  <span className={styles.statUnit}>{stat.unit}</span>
                </dd>
              </div>
            )
            return nodes
          })}
        </dl>
        ) : null}

        {highlight ? (
        <div className={styles.highlight}>
          <p className={styles.highlightLabel}>{highlight.label}</p>
          <p className={styles.highlightValue}>
            <AnimatedStatNumber
              value={highlight.value}
              className={styles.highlightNumber}
              enabled={countEnabled}
              immediate={prefersReducedMotion}
            />
            <span className={styles.highlightUnit}>{highlight.unit}</span>
          </p>
        </div>
        ) : null}

        <p className={styles.closing}>
          학생들이 <strong>스스로 미래를 설계</strong>하도록
          <br />
          전국 200여개 지역의 <strong>JA 네트워크가 함께</strong>합니다
        </p>
      </div>
    </section>
  )
}
