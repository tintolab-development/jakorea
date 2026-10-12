import type { RecruitmentStatus } from '@jakorea/domain/recruitment/recruitment-status'
import { PFCategoryBadge, PFStateBadge } from '@/shared/ui'
import { RECRUITMENT_STATUS_TONE_MAP } from '../lib/badge-config'
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
  educationForm: _educationForm,
  educationFormLabel,
  recruitmentRoleLabel,
  className,
}: ProgramStatusBadgesProps) {
  const rootClassName = [styles.root, className].filter(Boolean).join(' ')
  const showRole = shouldShowRoleBadge(recruitmentRoleLabel)

  const badgeTypographyClass = 'typo-caption-sb'
  const badgeClassName = [styles.badge, badgeTypographyClass].join(' ')
  const stateBadgeClassName = [styles.badge, styles.stateBadge, badgeTypographyClass].filter(Boolean).join(' ')

  return (
    <div className={rootClassName}>
      <PFStateBadge
        size="small"
        tone={RECRUITMENT_STATUS_TONE_MAP[recruitmentStatus]}
        className={stateBadgeClassName}
      >
        {platformRecruitmentStatusLabel(recruitmentStatus)}
      </PFStateBadge>

      {showRole ? (
        <PFCategoryBadge size="small" variant="primary" className={badgeClassName}>
          {recruitmentRoleLabel}
        </PFCategoryBadge>
      ) : null}

      <PFCategoryBadge size="small" variant="secondary" className={badgeClassName}>
        {educationTargetLabel}
      </PFCategoryBadge>

      {educationFormLabel.trim() ? (
        <PFCategoryBadge size="small" variant="secondary" className={badgeClassName}>
          {educationFormLabel}
        </PFCategoryBadge>
      ) : null}
    </div>
  )
}
