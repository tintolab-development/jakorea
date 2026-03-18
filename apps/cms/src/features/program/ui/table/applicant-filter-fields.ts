import type { FilterFieldConfig } from '@/shared/ui/unified-filter-card'
import { APPROVAL_STATUS_LABELS } from '@/shared/components/textbook-status-badge'

const GRADE_OPTIONS = [
  { label: '전체', value: 'all' },
  { label: '1학년', value: '1학년' },
  { label: '2학년', value: '2학년' },
  { label: '3학년', value: '3학년' },
  { label: '4학년', value: '4학년' },
  { label: '5학년', value: '5학년' },
  { label: '6학년', value: '6학년' },
]

const APPROVAL_STATUS_OPTIONS = [
  { label: '전체', value: 'all' },
  { label: APPROVAL_STATUS_LABELS.pending, value: 'pending' },
  { label: APPROVAL_STATUS_LABELS.rejected, value: 'rejected' },
  { label: APPROVAL_STATUS_LABELS.approved, value: 'approved' },
]

/** 신청 기관(Participants) 필터 필드 */
export const participantFilterFields: FilterFieldConfig[] = [
  {
    key: 'organizationName',
    type: 'search',
    label: '기관명',
    placeholder: '기관명을 입력하세요',
  },
  {
    key: 'region',
    type: 'select',
    label: '기관 지역',
    placeholder: '전체',
    options: [], // 추후 추가 예정
  },
  {
    key: 'approvalStatus',
    type: 'select',
    label: '프로그램 승인 현황',
    placeholder: '전체',
    options: APPROVAL_STATUS_OPTIONS,
  },
  {
    key: 'grade',
    type: 'select',
    label: '대상 학년',
    placeholder: '전체',
    options: GRADE_OPTIONS,
  },
  {
    key: 'teacherName',
    type: 'search',
    label: '담당 교사명',
    placeholder: '담당 교사명을 입력하세요',
  },
]

/** 신청 강사(Instructors) 필터 필드 */
export const instructorFilterFields: FilterFieldConfig[] = [
  {
    key: 'instructorName',
    type: 'search',
    label: '강사명',
    placeholder: '강사명을 입력하세요',
  },
  {
    key: 'residenceRegion',
    type: 'select',
    label: '거주 지역',
    placeholder: '전체',
    options: [], // 추후 추가 예정
  },
  {
    key: 'evaluationGrade',
    type: 'select',
    label: 'JA 평가 등급',
    placeholder: '전체',
    options: [
      { label: 'A등급', value: 'A' },
      { label: 'B등급', value: 'B' },
      { label: 'C등급', value: 'C' },
    ],
  },
  {
    key: 'teachingExperience',
    type: 'select',
    label: 'JA 강의 경력',
    placeholder: '전체',
    options: [], // 추후 추가 예정
  },
  {
    key: 'approvalStatus',
    type: 'select',
    label: '프로그램 승인 현황',
    placeholder: '전체',
    options: APPROVAL_STATUS_OPTIONS,
  },
]

/** 신청 봉사자(Volunteers) 필터 필드 (추후 확장 예정) */
export const volunteerFilterFields: FilterFieldConfig[] = []
