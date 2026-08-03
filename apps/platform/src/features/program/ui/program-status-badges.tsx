import type { RecruitmentStatus } from '@jakorea/domain/recruitment/recruitment-status'
import { PFCategoryBadge, PFStateBadge } from '@/shared/ui'
import {
  EDUCATION_FORM_ICON_MAP,
  RECRUITMENT_STATUS_TONE_MAP,
  educationTargetBadgeIconUrl,
} from '../lib/badge-config'
import type { EducationForm } from '../model/types'
import styles from './program-status-badges.module.css'

type ProgramStatusBadgesProps = {
  recruitmentStatus: RecruitmentStatus
  educationTargetLabel: string
  educationForm: EducationForm
  educationFormLabel: string
  className?: string
}

/** Platform 2단: 모집 중 | 모집 완료 (scheduled 등은 모집 중으로 표기) */
function platformRecruitmentStatusLabel(status: RecruitmentStatus) {
  return status === 'closed' ? '모집 완료' : '모집 중'
}

export function ProgramStatusBadges({
  recruitmentStatus,
  educationTargetLabel,
  educationForm,
  educationFormLabel,
  className,
}: ProgramStatusBadgesProps) {
  const rootClassName = [styles.root, className].filter(Boolean).join(' ')

  return (
    <div className={rootClassName}>
      <PFStateBadge size="small" tone={RECRUITMENT_STATUS_TONE_MAP[recruitmentStatus]}>
        {platformRecruitmentStatusLabel(recruitmentStatus)}
      </PFStateBadge>

      <PFCategoryBadge
        size="large"
        iconVariant="secondary"
        icon={
          <img
            src={educationTargetBadgeIconUrl}
            alt=""
            width={16}
            height={14}
            aria-hidden="true"
          />
        }
      >
        {educationTargetLabel}
      </PFCategoryBadge>

      <PFCategoryBadge
        size="large"
        iconVariant="secondary"
        icon={
          <img
            src={EDUCATION_FORM_ICON_MAP[educationForm]}
            alt=""
            width={14}
            height={14}
            aria-hidden="true"
          />
        }
      >
        {educationFormLabel}
      </PFCategoryBadge>
    </div>
  )
}
