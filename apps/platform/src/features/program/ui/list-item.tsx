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
  const categoryLine = tabs.map(tab => PROGRAM_TAB_LABEL[tab]).join(' • ')
  const isClosed = program.recruitmentStatus === 'closed'

  return (
    <MediaListRow
      thumbnailUrl={program.thumbnailUrl}
      muted={isClosed}
      interactive
      onClick={onClick}
      className={styles.card}
      thumbnailWrapClassName={styles.thumbnailWrap}
      contentClassName={styles.cardContent}
      asideClassName={styles.asideDesktop}
      content={
        <div className={styles.contentColumn}>
          <div className={styles.topBlock}>
            {tabs.length > 0 ? (
              <PFText
                as="span"
                typo="bd-lg-sb"
                color={isClosed ? 'neutral-cool-500' : 'black'}
                className={styles.categoryLine}
              >
                {categoryLine}
              </PFText>
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
              <PFText
                as="span"
                typo="bd-md-md"
                color={isClosed ? 'neutral-cool-500' : 'primary-500'}
                className={styles.operatingPeriodText}
              >
                {program.operatingPeriodLabel}
              </PFText>
            </p>
          </div>

          <div className={styles.bottomBlock}>
            <ProgramStatusBadges
              recruitmentStatus={program.recruitmentStatus}
              educationTargetLabel={program.educationTargetLabel}
              educationForm={program.educationForm}
              educationFormLabel={program.educationFormLabel}
            />
            <p className={styles.recruitmentPeriod}>
              <PFText as="span" typo="bd-sm-md" color="neutral-cool-600" className={styles.recruitmentPeriodText}>
                {`모집기간 : ${program.recruitmentPeriodLabel}`}
              </PFText>
            </p>
          </div>
        </div>
      }
      aside={
        <>
          <div className={styles.recruitment}>
            <PFText as="span" typo="bd-sm-rg" color="neutral-cool-600">
              모집기간
            </PFText>
            <PFText
              as="span"
              typo="bd-lg-sb"
              color={isClosed ? 'neutral-cool-500' : 'black'}
              className={styles.recruitmentDate}
            >
              {program.recruitmentPeriodLabel}
            </PFText>
          </div>

          <PFArrowButton
            variant="primary"
            size="medium"
            decorative
            disabled={isClosed}
            className={styles.arrow}
          />
        </>
      }
    />
  )
}
