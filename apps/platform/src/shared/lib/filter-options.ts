import { withAllFilter } from '@jakorea/domain/shared/option-helpers'
import { EDUCATION_TARGET_OPTIONS } from '@jakorea/domain/recruitment/education-target'
import { RECRUITMENT_STATUS_OPTIONS } from '@jakorea/domain/recruitment/recruitment-status'
import { PARTICIPANT_TYPE_OPTIONS } from '@jakorea/domain/recruitment/participant-type'

export const educationTargetFilterOptions = withAllFilter(EDUCATION_TARGET_OPTIONS)
export const recruitmentStatusFilterOptions = withAllFilter(RECRUITMENT_STATUS_OPTIONS)
export const participantTypeFilterOptions = withAllFilter(PARTICIPANT_TYPE_OPTIONS)

/** 운영기관 등 도메인 패키지 범위 밖 필터용 mock */
export const mockOrgFilterOptions = withAllFilter([
  { value: 'org-a', label: 'JA Korea' },
  { value: 'org-b', label: '서울지부' },
  { value: 'org-c', label: '경기지부' },
])
