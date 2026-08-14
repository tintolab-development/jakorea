import { useEffect, useRef, useState } from 'react'
import { useIntersectionObserver } from '@/shared/hooks/use-intersection-observer'
import { usePrefersReducedMotion } from '@/shared/hooks/use-prefers-reduced-motion'
import { HOME_ACHIEVEMENT_HIGHLIGHT, HOME_ACHIEVEMENT_STATS } from '../lib/mock'
import { AnimatedStatNumber } from './animated-stat-number'
import styles from './achievement-section.module.css'

export function AchievementSection() {
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

  return (
    <section className={styles.section} ref={sectionRef}>
      <div className={styles.inner}>
        <div className={styles.header}>
          <p className={styles.eyebrow}>ACHIEVEMENTS</p>
          <h2 className={styles.title}>함께 만들어온 배움의 여정</h2>
        </div>

        <dl className={styles.statGrid}>
          {HOME_ACHIEVEMENT_STATS.flatMap((stat, index) => {
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

        <div className={styles.highlight}>
          <p className={styles.highlightLabel}>{HOME_ACHIEVEMENT_HIGHLIGHT.label}</p>
          <p className={styles.highlightValue}>
            <AnimatedStatNumber
              value={HOME_ACHIEVEMENT_HIGHLIGHT.value}
              className={styles.highlightNumber}
              enabled={countEnabled}
              immediate={prefersReducedMotion}
            />
            <span className={styles.highlightUnit}>{HOME_ACHIEVEMENT_HIGHLIGHT.unit}</span>
          </p>
        </div>

        <p className={styles.closing}>
          학생들이 <strong>스스로 미래를 설계</strong>하도록
          <br />
          전국 200여개 지역의 <strong>JA 네트워크가 함께</strong>합니다
        </p>
      </div>
    </section>
  )
}
