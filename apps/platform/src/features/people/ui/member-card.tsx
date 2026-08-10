import type { PeopleMember } from '../model/types'
import { PFText } from '@/shared/ui'
import styles from './member-card.module.css'

type MemberCardProps = {
  member: PeopleMember
}

export function MemberCard({ member }: MemberCardProps) {
  return (
    <article className={styles.card}>
      <div className={styles.nameRow}>
        <PFText as="span" typo="hd-md" color="black" className={styles.name}>
          {member.name}
        </PFText>
        <PFText as="span" typo="bd-lg-sb" color="black" className={styles.role}>
          {member.role}
        </PFText>
      </div>
      <PFText as="p" typo="bd-md-sb" color="black" className={styles.affiliation}>
        {member.affiliation}
      </PFText>
      <PFText as="p" typo="bd-md-rg" color="neutral-cool-500" className={styles.englishName}>
        {member.englishName}
      </PFText>
    </article>
  )
}
