import type { EducationForm } from '@/features/program'
import type { EducationDisplayStatus } from '../model/types'
import {
  EDUCATION_FORM_ICON_MAP,
  educationTargetBadgeIconUrl,
} from '@/features/program'
import {
  EDUCATION_DISPLAY_STATUS_TONE_CLASS,
  getEducationDisplayStatusLabel,
  getEducationDisplayStatusTone,
  type EducationDisplayStatusAudience,
} from '../lib/display-status'
import jaSendMintUrl from '@/shared/assets/icons/ja-send-mint.svg'
import { PFCategoryBadge, PFText } from '@/shared/ui'
import styles from './detail-header.module.css'

type EducationDetailHeaderProps = {
  title: string
  displayStatus: EducationDisplayStatus
  educationTargetLabel: string
  educationForm: EducationForm
  educationFormLabel: string
  statusAudience?: EducationDisplayStatusAudience
  /** Figma 상단 역할 배지 — 강의현황 상세는 `강사` */
  participationRoleLabel?: string
}

export function EducationDetailHeader({
  title,
  displayStatus,
  educationTargetLabel,
  educationForm,
  educationFormLabel,
  statusAudience = 'general',
  participationRoleLabel,
}: EducationDetailHeaderProps) {
  const tone = getEducationDisplayStatusTone(displayStatus)
  const statusToneClass = styles[EDUCATION_DISPLAY_STATUS_TONE_CLASS[tone]]
  const statusLabel = getEducationDisplayStatusLabel(displayStatus, { audience: statusAudience })

  return (
    <header className={styles.header}>
      <PFText as="h1" typo="hl-lg" color="black" className={styles.title}>
        {title}
      </PFText>
      <PFText as="p" typo="hd-lg" className={[styles.status, statusToneClass].join(' ')}>
        {displayStatus === 'in_progress' ? (
          <img
            className={styles.statusIcon}
            src={jaSendMintUrl}
            alt=""
            width={40}
            height={40}
            aria-hidden="true"
          />
        ) : null}
        {statusLabel}
      </PFText>
      <div className={styles.meta}>
        <span className={styles.metaItem}>
          <img
            className={styles.metaIcon}
            src={educationTargetBadgeIconUrl}
            alt=""
            width={16}
            height={14}
          />
          <PFText as="span" typo="bd-md-sb" color="primary-700">
            {educationTargetLabel}
          </PFText>
        </span>
        {educationFormLabel.trim() ? (
          <span className={styles.metaItem}>
            <img
              className={styles.metaIcon}
              src={EDUCATION_FORM_ICON_MAP[educationForm]}
              alt=""
              width={14}
              height={14}
            />
            <PFText as="span" typo="bd-md-sb" color="primary-700">
              {educationFormLabel}
            </PFText>
          </span>
        ) : null}
        {participationRoleLabel?.trim() ? (
          <PFCategoryBadge size="small" variant="primary" className={styles.roleBadge}>
            {participationRoleLabel.trim()}
          </PFCategoryBadge>
        ) : null}
      </div>
    </header>
  )
}
