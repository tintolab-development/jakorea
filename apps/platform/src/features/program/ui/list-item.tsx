import type { ProgramCategory, ProgramListItem } from '../model/types'
import { PROGRAM_TAB_LABEL } from '../lib/constants'
import { MediaListRow } from '@/shared/ui/media-list-row'
import { PFArrowButton, PFText } from '@/shared/ui'
import { ProgramStatusBadges } from './program-status-badges'
import styles from './list-item.module.css'

type ProgramListItemRowProps = {
  program: ProgramListItem
  /** 목록 탭. 전체가 아니면 그 탭 문구만 보여 준다. */
  activeTab?: ProgramCategory
  onClick: () => void
}

export function ProgramListItemRow({ program, activeTab, onClick }: ProgramListItemRowProps) {
  const tabs =
    activeTab && activeTab !== 'all' ? [activeTab] : program.categories
  const isClosed = program.recruitmentStatus === 'closed'

  return (
    <MediaListRow
      thumbnailUrl={program.thumbnailUrl}
      muted={isClosed}
      interactive
      onClick={onClick}
      asideClassName={styles.asideSpread}
      content={
        <>
          <div className={styles.info}>
            {tabs.length > 0 ? (
              <div className={styles.categories}>
                {tabs.map(tab => (
                  <PFText
                    key={tab}
                    as="span"
                    typo="bd-lg-sb"
                    color={isClosed ? 'neutral-cool-500' : 'black'}
                  >
                    {PROGRAM_TAB_LABEL[tab]}
                  </PFText>
                ))}
              </div>
            ) : null}
            <PFText
              as="h2"
              typo="hl-lg"
              color={isClosed ? 'neutral-cool-500' : 'black'}
              className={styles.title}
            >
              {program.title}
            </PFText>
            <p className={styles.operatingPeriod}>
              <PFText as="span" typo="bd-md-md" color={isClosed ? 'neutral-cool-500' : 'primary-500'}>
                {program.operatingPeriodLabel}
              </PFText>
            </p>
          </div>

          <ProgramStatusBadges
            recruitmentStatus={program.recruitmentStatus}
            educationTargetLabel={program.educationTargetLabel}
            educationForm={program.educationForm}
            educationFormLabel={program.educationFormLabel}
          />
        </>
      }
      aside={
        <>
          <div className={styles.recruitment}>
            <PFText as="span" typo="bd-sm-rg" color="neutral-cool-600">
              모집기간
            </PFText>
            <PFText as="span" typo="bd-lg-sb" color={isClosed ? 'neutral-cool-500' : 'black'}>
              {program.recruitmentPeriodLabel}
            </PFText>
          </div>

          <PFArrowButton variant="primary" size="medium" decorative disabled={isClosed} />
        </>
      }
    />
  )
}
