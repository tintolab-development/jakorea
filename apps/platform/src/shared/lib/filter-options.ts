import { withAllFilter } from '@jakorea/domain/shared/option-helpers'
import { EDUCATION_TARGET_OPTIONS } from '@jakorea/domain/recruitment/education-target'
import { RECRUITMENT_STATUS } from '@jakorea/domain/recruitment/recruitment-status'
import { PARTICIPANT_TYPE_OPTIONS } from '@jakorea/domain/recruitment/participant-type'

export const educationTargetFilterOptions = withAllFilter(EDUCATION_TARGET_OPTIONS)

/** 목록 모집현황 — 모집 예정 / 모집 중 / 모집 완료 */
export const recruitmentStatusFilterOptions = withAllFilter([
  { value: RECRUITMENT_STATUS.scheduled, label: '모집 예정' },
  { value: RECRUITMENT_STATUS.recruiting, label: '모집 중' },
  { value: RECRUITMENT_STATUS.closed, label: '모집 완료' },
])

/** CMS participant-type 라벨 (도메인 SSOT). */
export const participantTypeFilterOptions = withAllFilter(PARTICIPANT_TYPE_OPTIONS)

/**
 * 플랫폼 모집대상 필터 — 기획(초등~성인).
 * 탭 유형(청소년·기관·강사)과 분리.
 */
export const recruitmentTargetFilterOptions = educationTargetFilterOptions

/** 운영기관 등 도메인 패키지 범위 밖 필터용 mock */
export const mockOrgFilterOptions = withAllFilter([
  { value: 'org-a', label: 'JA Korea' },
  { value: 'org-b', label: '서울지부' },
  { value: 'org-c', label: '경기지부' },
])

/** 목록 교육형태 필터 */
export const educationFormFilterOptions = withAllFilter([
  { value: 'online', label: '온라인' },
  { value: 'offline', label: '오프라인' },
  { value: 'hybrid', label: '온/오프라인' },
  { value: 'participant_choice', label: '참여자 선택' },
])
