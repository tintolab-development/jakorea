import type { ProgramListItem } from '../model/types'
import { PFArrowButton, PFText } from '@/shared/ui'
import styles from './list-item.module.css'

type ProgramListItemRowProps = {
  program: ProgramListItem
  onClick: () => void
}

export function ProgramListItemRow({ program, onClick }: ProgramListItemRowProps) {
  return (
    <button className={styles.row} type="button" onClick={onClick}>
      <div className={styles.thumbnailWrap}>
        <img className={styles.thumbnail} src={program.thumbnailUrl} alt="" />
      </div>

      <div className={styles.content}>
        <PFText as="span" typo="label-md" color="primary-500">
          {program.categoryLabel}
        </PFText>
        <PFText as="h2" typo="bd-lg-sb" color="black" className={styles.title}>
          {program.title}
        </PFText>
        <PFText as="p" typo="bd-sm-rg" color="neutral-cool-600">
          {program.operatingPeriodLabel}
        </PFText>
        <div className={styles.tags}>
          {program.statusTags.map(tag => (
            <span className={styles.tag} key={tag}>
              <PFText as="span" typo="caption-rg" color="neutral-cool-600">
                {tag}
              </PFText>
            </span>
          ))}
        </div>
      </div>

      <div className={styles.recruitment}>
        <PFText as="span" typo="label-md" color="neutral-cool-500">
          모집기간
        </PFText>
        <PFText as="span" typo="bd-md-sb" color="black">
          {program.recruitmentPeriodLabel}
        </PFText>
      </div>

      <PFArrowButton
        className={styles.arrow}
        size="medium"
        variant="secondary"
        aria-label={`${program.title} 상세 보기`}
      />
    </button>
  )
}
