import type { RecruitmentStatus } from '@jakorea/domain/recruitment/recruitment-status'
import schoolIconUrl from '@/shared/assets/icons/school-primary-700-20.svg'
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
  /** 상태 배지에만 덧붙일 클래스 (예: 프로그램 목록 모집 완료 시안 색) */
  stateBadgeClassName?: string
  /**
   * compact(기본): 12px 캡션 — 마이페이지 기존 유지.
   * regular: 참여하기 목록 카드·프로그램 상세 헤더 — Figma Badge Category(PC 14px SemiBold, 배지 간격 8px), 대상·형태 배지에 학교 아이콘(PC만).
   * 모바일은 둘 다 Badge mobile(24px·12px).
   */
  size?: 'compact' | 'regular'
}

/** Platform 배지: 모집예정 | 모집중 | 모집완료 (Figma 표기·홈 캐러셀과 동일하게 붙여 씀) */
function platformRecruitmentStatusLabel(status: RecruitmentStatus) {
  if (status === 'closed') return '모집완료'
  if (status === 'scheduled') return '모집예정'
  return '모집중'
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
  stateBadgeClassName: stateBadgeExtraClassName,
  size = 'compact',
}: ProgramStatusBadgesProps) {
  const rootClassName = [styles.root, size === 'regular' ? styles.regular : null, className]
    .filter(Boolean)
    .join(' ')
  const showRole = shouldShowRoleBadge(recruitmentRoleLabel)

  const badgeTypographyClass = 'typo-caption-sb'
  const badgeClassName = [styles.badge, badgeTypographyClass].join(' ')
  const stateBadgeClassName = [styles.badge, styles.stateBadge, badgeTypographyClass, stateBadgeExtraClassName]
    .filter(Boolean)
    .join(' ')

  /**
   * regular(목록 카드): Figma Badge Category icon·large — 학교 아이콘 20px, pl12·pr16, gap 6.
   * 아이콘은 PC만 — 모바일은 CSS로 숨기고 기존 24px 배지 그대로.
   */
  const withIcon = size === 'regular'
  const categoryIcon = withIcon ? (
    <img className={styles.categoryIcon} src={schoolIconUrl} alt="" aria-hidden="true" width={20} height={20} />
  ) : undefined
  const categoryBadgeSize = withIcon ? 'large' : 'small'

  return (
    <div className={rootClassName}>
      <PFStateBadge
        size="small"
        tone={RECRUITMENT_STATUS_TONE_MAP[recruitmentStatus]}
        className={stateBadgeClassName}
      >
        {size === 'regular' ? (
          <span className={styles.badgeLabel}>{platformRecruitmentStatusLabel(recruitmentStatus)}</span>
        ) : (
          platformRecruitmentStatusLabel(recruitmentStatus)
        )}
      </PFStateBadge>

      {showRole ? (
        <PFCategoryBadge size="small" variant="primary" className={badgeClassName}>
          {recruitmentRoleLabel}
        </PFCategoryBadge>
      ) : null}

      <PFCategoryBadge
        size={categoryBadgeSize}
        variant="secondary"
        icon={categoryIcon}
        iconVariant="primary"
        className={badgeClassName}
      >
        {educationTargetLabel}
      </PFCategoryBadge>

      {educationFormLabel.trim() ? (
        <PFCategoryBadge
          size={categoryBadgeSize}
          variant="secondary"
          icon={categoryIcon}
          iconVariant="primary"
          className={badgeClassName}
        >
          {educationFormLabel}
        </PFCategoryBadge>
      ) : null}
    </div>
  )
}
