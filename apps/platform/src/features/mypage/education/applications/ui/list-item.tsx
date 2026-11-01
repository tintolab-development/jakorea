import type { EducationApplicationListItem } from '../model/types'
import { ProgramStatusBadges } from '@/features/program/ui/program-status-badges'
import { MediaListRow } from '@/shared/ui/media-list-row'
import { PFText } from '@/shared/ui'
import {
  EDUCATION_DISPLAY_STATUS_TONE_CLASS,
  getEducationDisplayStatusLabel,
  getEducationDisplayStatusTone,
  type EducationDisplayStatusAudience,
} from '../lib/display-status'
import {
  hasIssueCertificateListAction,
  shouldShowPersonalCertificateAction,
} from '../lib/personal-certificate-eligibility'
import styles from './list-item.module.css'

type EducationApplicationListItemRowProps = {
  item: EducationApplicationListItem
  onClick: () => void
  /** 교육현황은 `teacher`(승인 대기 세트). 봉사·강의현황은 기본 `general`. */
  statusAudience?: EducationDisplayStatusAudience
}

export function EducationApplicationListItemRow({
  item,
  onClick,
  statusAudience = 'general',
}: EducationApplicationListItemRowProps) {
  const statusTone = getEducationDisplayStatusTone(item.displayStatus)
  const statusToneClass = styles[EDUCATION_DISPLAY_STATUS_TONE_CLASS[statusTone]]
  const statusLabel = getEducationDisplayStatusLabel(item.displayStatus, {
    audience: statusAudience,
  })
  const statusClassName = [styles.status, statusToneClass].filter(Boolean).join(' ')
  const showCertificateHint =
    shouldShowPersonalCertificateAction({
      applicationType: item.applicationType,
      detailCase: item.detailCase,
    }) &&
    (item.certificateAvailable === true || hasIssueCertificateListAction(item.availableActions))

  return (
    <MediaListRow
      thumbnailUrl={item.thumbnailUrl}
      interactive
      onClick={onClick}
      contentClassName={styles.rowContent}
      asideClassName={styles.asideDesktop}
      content={
        <>
          <div className={styles.info}>
            <div className={styles.metaRow}>
              <PFText as="span" typo="bd-lg-sb" color="black" className={styles.categoryLabel}>
                {item.categoryLabel}
              </PFText>
              <span className={styles.metaDivider} aria-hidden="true" />
              <span className={[statusClassName, styles.statusInMeta].filter(Boolean).join(' ')}>
                {statusLabel}
              </span>
            </div>
            <PFText as="h2" typo="hl-lg" color="black" className={styles.title}>
              {item.title}
            </PFText>
            <div className={styles.periodBlock}>
              <PFText as="span" typo="bd-md-md" color="primary-700" className={styles.periodLabel}>
                모집기간
              </PFText>
              <PFText as="span" typo="bd-md-md" color="primary-500" className={styles.periodValue}>
                {item.recruitmentPeriodLabel}
              </PFText>
            </div>
            <div className={styles.periodBlock}>
              <PFText as="span" typo="bd-md-md" color="primary-700" className={styles.periodLabel}>
                진행기간
              </PFText>
              <PFText as="span" typo="bd-md-md" color="primary-500" className={styles.periodValue}>
                {item.operatingPeriodLabel}
              </PFText>
            </div>
            {showCertificateHint ? (
              <PFText as="p" typo="bd-sm-md" color="primary-700" className={styles.certificateHint}>
                수료증 발급·다운로드 가능
              </PFText>
            ) : null}
          </div>

          <ProgramStatusBadges
            recruitmentStatus={item.recruitmentStatus}
            educationTargetLabel={item.educationTargetLabel}
            educationForm={item.educationForm}
            educationFormLabel={item.educationFormLabel}
          />
        </>
      }
      aside={
        <PFText as="span" typo="bd-lg-sb" className={statusClassName}>
          {statusLabel}
        </PFText>
      }
    />
  )
}
