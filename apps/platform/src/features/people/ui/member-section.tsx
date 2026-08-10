import type { PeopleMemberSection } from '../model/types'
import { PFText } from '@/shared/ui'
import { MemberCard } from './member-card'
import styles from './member-section.module.css'

type MemberSectionProps = {
  section: PeopleMemberSection
}

const columnClassMap = {
  2: styles.columns2,
  3: styles.columns3,
  4: styles.columns4,
} as const

export function MemberSection({ section }: MemberSectionProps) {
  return (
    <section className={styles.section} aria-labelledby={`people-section-${section.id}`}>
      <PFText
        as="h2"
        id={`people-section-${section.id}`}
        typo="bd-md-rg"
        color="neutral-cool-500"
        className={styles.title}
      >
        {section.title}
      </PFText>
      <div className={[styles.grid, columnClassMap[section.columns]].join(' ')}>
        {section.members.map(member => (
          <MemberCard key={member.id} member={member} />
        ))}
      </div>
    </section>
  )
}
