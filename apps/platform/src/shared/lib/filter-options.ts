import { withAllFilter } from '@jakorea/domain/shared/option-helpers'
import { EDUCATION_TARGET_OPTIONS } from '@jakorea/domain/recruitment/education-target'
import { RECRUITMENT_STATUS_OPTIONS } from '@jakorea/domain/recruitment/recruitment-status'
import { PARTICIPANT_TYPE_OPTIONS } from '@jakorea/domain/recruitment/participant-type'

export const educationTargetFilterOptions = withAllFilter(EDUCATION_TARGET_OPTIONS)
export const recruitmentStatusFilterOptions = withAllFilter(RECRUITMENT_STATUS_OPTIONS)

/** CMS participant-type 라벨 (도메인 SSOT). 플랫폼 UI에는 `recruitmentTargetFilterOptions` 사용 */
export const participantTypeFilterOptions = withAllFilter(PARTICIPANT_TYPE_OPTIONS)

/**
 * 플랫폼 모집대상 필터 — CMS 표기와 다름
 * 개인·봉사자 → 청소년/청년, 학교/기관 → 기관, 교사/강사 → 강사
 */
export const recruitmentTargetFilterOptions = withAllFilter([
  { value: 'youth', label: '청소년/청년' },
  { value: 'institution', label: '기관' },
  { value: 'instructor', label: '강사' },
])

/** 운영기관 등 도메인 패키지 범위 밖 필터용 mock */
export const mockOrgFilterOptions = withAllFilter([
  { value: 'org-a', label: 'JA Korea' },
  { value: 'org-b', label: '서울지부' },
  { value: 'org-c', label: '경기지부' },
])
