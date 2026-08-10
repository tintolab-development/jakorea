import {
  MemberSection,
  MOCK_PEOPLE_SECTIONS,
  orgChartUrl,
} from '@/features/people'
import { PFDivider, PFText } from '@/shared/ui'
import styles from './page.module.css'

export function PeoplePage() {
  return (
    <section className={styles.page}>
      <div className={styles.pageBackground} aria-hidden="true" />

      <div className={styles.content}>
        <header className={styles.hero}>
          <PFText as="span" typo="hl-lg" color="primary-700" className={styles.heroLabel}>
            함께하는 사람들
          </PFText>
          <PFText as="h1" typo="page-title-md" color="black" className={styles.heroTitle}>
            청소년들의 미래를 위해 JA Korea와 함께하는 사람들
          </PFText>
        </header>

        <div className={styles.orgBlock}>
          <div className={styles.orgCard}>
            <img
              className={styles.orgImage}
              src={orgChartUrl}
              alt="JA Korea 조직도"
            />
          </div>
        </div>

        <div className={styles.memberList}>
          {MOCK_PEOPLE_SECTIONS.map((section, index) => (
            <div
              key={section.id}
              className={
                index === 0 ? styles.memberSectionBlock : styles.memberSectionBlockSpaced
              }
            >
              <PFDivider className={styles.rankDivider} />
              <MemberSection section={section} />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
