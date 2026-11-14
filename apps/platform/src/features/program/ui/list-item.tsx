import type { ProgramCategory, ProgramListItem } from '../model/types'
import { PROGRAM_TAB_LABEL } from '../lib/constants'
import { programListRecruitmentRoleLabel } from '../lib/list-recruitment-role'
import { MediaListRow } from '@/shared/ui/media-list-row'
import { PFArrowButton, PFDivider, PFText } from '@/shared/ui'
import { ProgramStatusBadges } from './program-status-badges'
import styles from './list-item.module.css'

type ProgramListItemRowProps = {
  program: ProgramListItem
  /** 목록 탭. 전체가 아니면 그 탭 문구만 보여 준다. */
  activeTab?: ProgramCategory
  onClick: () => void
}

function RecruitmentPeriodValue({ value }: { value: string }) {
  const separator = ' ~ '
  const separatorIndex = value.indexOf(separator)
  if (separatorIndex < 0) return value

  return (
    <>
      <span className={styles.recruitmentPeriodPart}>{value.slice(0, separatorIndex)}</span>
      <span className={styles.recruitmentPeriodSeparator}>{separator}</span>
      <span className={styles.recruitmentPeriodPart}>
        {value.slice(separatorIndex + separator.length)}
      </span>
    </>
  )
}

export function ProgramListItemRow({ program, activeTab, onClick }: ProgramListItemRowProps) {
  const tabs =
    activeTab && activeTab !== 'all' ? [activeTab] : program.categories
  const recruitmentRole = programListRecruitmentRoleLabel(program.recruitmentType)
  const categoryLine =
    activeTab && activeTab !== 'all'
      ? PROGRAM_TAB_LABEL[activeTab]
      : recruitmentRole === '강사'
        ? PROGRAM_TAB_LABEL.instructor
        : recruitmentRole === '기관'
          ? PROGRAM_TAB_LABEL.institution
          : recruitmentRole === '봉사자'
            ? PROGRAM_TAB_LABEL.youth
            : tabs.map(tab => PROGRAM_TAB_LABEL[tab]).join(' • ')
  const isClosed = program.recruitmentStatus === 'closed'

  return (
    <MediaListRow
      thumbnailUrl={program.thumbnailUrl}
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
                color="black"
                className={styles.categoryLine}
              >
                {categoryLine}
              </PFText>
            ) : null}
            <PFText
              as="h2"
              typo="hl-lg"
              color="black"
              className={styles.title}
            >
              {program.title}
            </PFText>
            <p className={styles.operatingPeriod}>
              <PFText
                as="span"
                typo="bd-md-md"
                color="primary-500"
                className={[
                  styles.operatingPeriodText,
                  isClosed ? styles.operatingPeriodTextClosed : null,
                ]
                  .filter(Boolean)
                  .join(' ')}
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
              recruitmentRoleLabel={programListRecruitmentRoleLabel(program.recruitmentType)}
              showParticipantRole
              stateBadgeClassName={isClosed ? styles.closedStateBadge : undefined}
              size="regular"
            />
            <p className={styles.recruitmentPeriod}>
              <PFText as="span" typo="bd-sm-md" color="neutral-cool-600" className={styles.recruitmentPeriodText}>
                모집 기간 : <RecruitmentPeriodValue value={program.recruitmentPeriodLabel} />
              </PFText>
            </p>
          </div>
        </div>
      }
      aside={
        <>
          <PFDivider orientation="vertical" className={styles.asideDivider} />
          <div className={styles.asideScheduleGroup}>
            <div className={styles.recruitment}>
              <PFText as="span" typo="bd-sm-rg" color="neutral-cool-600">
                모집 기간
              </PFText>
              <PFText
                as="span"
                typo="bd-lg-sb"
                color="black"
                className={styles.recruitmentDate}
              >
                <RecruitmentPeriodValue value={program.recruitmentPeriodLabel} />
              </PFText>
            </div>

            {/* 모집 완료도 행 클릭으로 상세 진입 — 회색 화살표는 시안 표기일 뿐 비활성 아님 */}
            <PFArrowButton
              variant="primary"
              size="medium"
              decorative
              disabled={isClosed}
              className={styles.arrow}
            />
          </div>
        </>
      }
    />
  )
}
