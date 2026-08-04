import type { RecruitmentStatus } from '@jakorea/domain/recruitment/recruitment-status'
import type { PFStateBadgeTone } from '@/shared/ui'
import type { EducationForm } from '../model/types'
import badgeOfflineIconUrl from '../image/icon/badge-offline.svg'
import badgeOnlineIconUrl from '../image/icon/badge-online.svg'
import badgeOnOfflineIconUrl from '../image/icon/badge-onoffline.svg'
import badgeRecruitTargetIconUrl from '../image/icon/badge-recruit-target.svg'

export const RECRUITMENT_STATUS_TONE_MAP: Record<RecruitmentStatus, PFStateBadgeTone> = {
  scheduled: 'success',
  recruiting: 'progress',
  closed: 'disabled',
}

export const EDUCATION_FORM_ICON_MAP: Record<EducationForm, string> = {
  online: badgeOnlineIconUrl,
  offline: badgeOfflineIconUrl,
  hybrid: badgeOnOfflineIconUrl,
  participant_choice: badgeRecruitTargetIconUrl,
}

export const educationTargetBadgeIconUrl = badgeRecruitTargetIconUrl

export const EDUCATION_FORM_LABEL_MAP: Record<EducationForm, string> = {
  online: '온라인',
  offline: '오프라인',
  hybrid: '온/오프라인',
  participant_choice: '참여자 선택',
}
