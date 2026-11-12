import {
  RECRUITMENT_STATUS,
  type RecruitmentStatus,
} from '@jakorea/domain/recruitment/recruitment-status'
import type { PFStateBadgeTone } from '@/shared/ui'
import type { EducationForm } from '../model/types'
import typeClass24IconUrl from '../image/icon/type-class-24.svg'
import typeOffline24IconUrl from '../image/icon/type-offline-24.svg'
import typeOnline24IconUrl from '../image/icon/type-online-24.svg'
import typeOnOffline24IconUrl from '../image/icon/type-onoffline-24.svg'
import typeTarget24IconUrl from '../image/icon/type-target-24.svg'

export const RECRUITMENT_STATUS_TONE_MAP: Record<RecruitmentStatus, PFStateBadgeTone> = {
  scheduled: 'success',
  recruiting: 'progress',
  closed: 'disabled',
}

/** 시안 Icon Type / 24 — 교육 형태별(참여자 선택은 시안에 없어 수업 아이콘) */
export const EDUCATION_FORM_ICON_MAP: Record<EducationForm, string> = {
  online: typeOnline24IconUrl,
  offline: typeOffline24IconUrl,
  hybrid: typeOnOffline24IconUrl,
  participant_choice: typeClass24IconUrl,
}

/** 시안 Icon Type / 24 class — 교육 대상 */
export const educationTargetBadgeIconUrl = typeClass24IconUrl

/** 시안 Icon Type / 24 target — 모집(참여) 역할 */
export const educationRoleBadgeIconUrl = typeTarget24IconUrl

export const EDUCATION_FORM_LABEL_MAP: Record<EducationForm, string> = {
  online: '온라인',
  offline: '오프라인',
  hybrid: '온/오프라인',
  participant_choice: '참여자 선택',
}

/** 상세 「신청하기」 — 모집 중·모집 예정. 모집 마감만 비활성. */
export function canApplyToProgram(status: RecruitmentStatus): boolean {
  return status === RECRUITMENT_STATUS.recruiting || status === RECRUITMENT_STATUS.scheduled
}
