import { HOME_ACHIEVEMENT_HIGHLIGHT, HOME_ACHIEVEMENT_STATS } from '../lib/mock'
import styles from './achievement-section.module.css'

export function AchievementSection() {
  return (
    <section className={styles.section}>
      <div className={styles.inner}>
        <div className={styles.header}>
          <p className={styles.eyebrow}>ACHIEVEMENTS</p>
          <h2 className={styles.title}>함께 만들어온 배움의 여정</h2>
        </div>

        <dl className={styles.statGrid}>
          {HOME_ACHIEVEMENT_STATS.map(stat => (
            <div className={styles.stat} key={stat.label}>
              <dt className={styles.statLabel}>{stat.label}</dt>
              <dd className={styles.statValue}>
                <span className={styles.statNumber}>{stat.value}</span>
                <span className={styles.statUnit}>{stat.unit}</span>
              </dd>
            </div>
          ))}
        </dl>

        <div className={styles.arcDivider} aria-hidden="true">
          <span className={styles.arcDot} />
        </div>

        <div className={styles.highlight}>
          <p className={styles.highlightLabel}>{HOME_ACHIEVEMENT_HIGHLIGHT.label}</p>
          <p className={styles.highlightValue}>
            <span className={styles.highlightNumber}>{HOME_ACHIEVEMENT_HIGHLIGHT.value}</span>
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
