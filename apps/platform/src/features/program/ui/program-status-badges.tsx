import type { RecruitmentStatus } from '@jakorea/domain/recruitment/recruitment-status'
import { PFCategoryBadge, PFStateBadge } from '@/shared/ui'
import { RECRUITMENT_STATUS_TONE_MAP } from '../lib/badge-config'
import type { EducationForm } from '../model/types'
import typeClassIconUrl from '../image/icon/type-class-20.svg'
import typeOfflineIconUrl from '../image/icon/type-offline-20.svg'
import typeOnlineIconUrl from '../image/icon/type-online-20.svg'
import typeOnOfflineIconUrl from '../image/icon/type-onoffline-20.svg'
import typeTargetIconUrl from '../image/icon/type-target-20.svg'
import styles from './program-status-badges.module.css'

type ProgramStatusBadgesProps = {
  recruitmentStatus: RecruitmentStatus
  educationTargetLabel: string
  educationForm?: EducationForm
  educationFormLabel: string
  /** 케이스 역할 배지 (강사·봉사자·기관·교육생). 없거나 참여자면 비노출 */
  recruitmentRoleLabel?: string
  /** 참여자 역할 배지도 보여 줄지 — 참여하기 목록 카드만 true (QA-0518, 모집별 카드 구분) */
  showParticipantRole?: boolean
  className?: string
  /** 상태 배지에만 덧붙일 클래스 (예: 프로그램 목록 모집 완료 시안 색) */
  stateBadgeClassName?: string
  /** 마이페이지 목록은 진행 상태를 우측 글로 두고, 알약에는 대상·형태·역할만 둔다 */
  showRecruitmentStatus?: boolean
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

/** 시안 Icon Type / 20 — 교육 형태별 아이콘(참여자 선택은 시안에 없어 수업 아이콘) */
const EDUCATION_FORM_TYPE_ICON: Record<EducationForm, string> = {
  online: typeOnlineIconUrl,
  offline: typeOfflineIconUrl,
  hybrid: typeOnOfflineIconUrl,
  participant_choice: typeClassIconUrl,
}

function shouldShowRoleBadge(roleLabel: string | undefined, showParticipantRole: boolean): boolean {
  if (!roleLabel?.trim()) return false
  if (showParticipantRole) return true
  // 일반 참여자는 교육대상 배지와 중복되어 숨김
  return roleLabel !== '참여자'
}

export function ProgramStatusBadges({
  recruitmentStatus,
  educationTargetLabel,
  educationForm,
  educationFormLabel,
  recruitmentRoleLabel,
  showParticipantRole = false,
  className,
  stateBadgeClassName: stateBadgeExtraClassName,
  showRecruitmentStatus = true,
  size = 'compact',
}: ProgramStatusBadgesProps) {
  const rootClassName = [styles.root, size === 'regular' ? styles.regular : null, className]
    .filter(Boolean)
    .join(' ')
  const showRole = shouldShowRoleBadge(recruitmentRoleLabel, showParticipantRole)

  const badgeTypographyClass = 'typo-caption-sb'
  const badgeClassName = [styles.badge, badgeTypographyClass].join(' ')
  const stateBadgeClassName = [styles.badge, styles.stateBadge, badgeTypographyClass, stateBadgeExtraClassName]
    .filter(Boolean)
    .join(' ')

  /**
   * regular(목록 카드): Figma Badge Category icon·large — 20px 아이콘, pl12·pr16, gap 6.
   * 시안: 교육 대상 → 교육 형태 → 모집 역할(강사 등). 역할 배지 아이콘은 대상 아이콘.
   * 아이콘은 PC만 — 모바일은 CSS로 숨기고 기존 24px 배지 그대로.
   */
  const withIcon = size === 'regular'
  const renderIcon = (src: string) =>
    withIcon ? (
      <img className={styles.categoryIcon} src={src} alt="" aria-hidden="true" width={20} height={20} />
    ) : undefined
  const categoryBadgeSize = withIcon ? 'large' : 'small'

  return (
    <div className={rootClassName}>
      {showRecruitmentStatus ? (
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
      ) : null}

      {educationTargetLabel.trim() ? (
        <PFCategoryBadge
          size={categoryBadgeSize}
          variant="secondary"
          icon={renderIcon(typeClassIconUrl)}
          iconVariant="primary"
          className={badgeClassName}
        >
          {educationTargetLabel}
        </PFCategoryBadge>
      ) : null}

      {educationFormLabel.trim() ? (
        <PFCategoryBadge
          size={categoryBadgeSize}
          variant="secondary"
          icon={renderIcon(educationForm ? EDUCATION_FORM_TYPE_ICON[educationForm] : typeClassIconUrl)}
          iconVariant="primary"
          className={badgeClassName}
        >
          {educationFormLabel}
        </PFCategoryBadge>
      ) : null}

      {showRole ? (
        <PFCategoryBadge
          size={withIcon ? 'large' : 'small'}
          variant="primary"
          icon={renderIcon(typeTargetIconUrl)}
          iconVariant="primary"
          className={badgeClassName}
        >
          {recruitmentRoleLabel}
        </PFCategoryBadge>
      ) : null}
    </div>
  )
}
