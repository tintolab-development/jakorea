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
  /** 케이스 역할 배지 (강사·봉사자·기관·교육생). 없거나 참여자면 비노출 */
  recruitmentRoleLabel?: string
  className?: string
}

/** Platform 배지: 모집 예정 | 모집 중 | 모집 완료 */
function platformRecruitmentStatusLabel(status: RecruitmentStatus) {
  if (status === 'closed') return '모집 완료'
  if (status === 'scheduled') return '모집 예정'
  return '모집 중'
}

function shouldShowRoleBadge(roleLabel: string | undefined): boolean {
  if (!roleLabel?.trim()) return false
  // 일반 참여자는 교육대상 배지와 중복되어 숨김
  return roleLabel !== '참여자'
}

export function ProgramStatusBadges({
  recruitmentStatus,
  educationTargetLabel,
  educationForm,
  educationFormLabel,
  recruitmentRoleLabel,
  className,
}: ProgramStatusBadgesProps) {
  const rootClassName = [styles.root, className].filter(Boolean).join(' ')
  const showRole = shouldShowRoleBadge(recruitmentRoleLabel)

  return (
    <div className={rootClassName}>
      <PFStateBadge size="small" tone={RECRUITMENT_STATUS_TONE_MAP[recruitmentStatus]}>
        {platformRecruitmentStatusLabel(recruitmentStatus)}
      </PFStateBadge>

      {showRole ? (
        <PFCategoryBadge size="small" variant="primary">
          {recruitmentRoleLabel}
        </PFCategoryBadge>
      ) : null}

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
