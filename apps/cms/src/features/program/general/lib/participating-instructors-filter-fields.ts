import type { FilterFieldConfig } from '@/shared/components/filter-table-layout'

const REGION_OPTIONS = [
  { label: '전체', value: 'all' },
  { label: '서울', value: '서울' },
  { label: '부산', value: '부산' },
  { label: '대구', value: '대구' },
  { label: '인천', value: '인천' },
  { label: '광주', value: '광주' },
  { label: '대전', value: '대전' },
  { label: '울산', value: '울산' },
  { label: '세종', value: '세종' },
  { label: '경기', value: '경기' },
  { label: '강원', value: '강원' },
  { label: '충북', value: '충북' },
  { label: '충남', value: '충남' },
  { label: '전북', value: '전북' },
  { label: '전남', value: '전남' },
  { label: '경북', value: '경북' },
  { label: '경남', value: '경남' },
  { label: '제주', value: '제주' },
]

const JA_LECTURE_EXPERIENCE_OPTIONS = [
  { label: '전체', value: 'all' },
  { label: '1년', value: '1' },
  { label: '2년', value: '2' },
  { label: '3년', value: '3' },
  { label: '5년', value: '5' },
]

const JA_EVALUATION_GRADE_OPTIONS = [
  { label: '전체', value: 'all' },
  { label: 'A등급', value: 'A등급' },
  { label: 'B등급', value: 'B등급' },
  { label: 'C등급', value: 'C등급' },
]

const EDUCATION_ASSIGNMENT_OPTIONS = [
  { label: '전체', value: 'all' },
  { label: '진행 전', value: '진행 전' },
  { label: '1회차', value: '1회차' },
  { label: '2회차', value: '2회차' },
  { label: '진행 완료', value: '진행 완료' },
]

const COL_WIDTH = '18%'

/** 참여 강사 목록 필터 */
export const participatingInstructorsFilterFields: FilterFieldConfig[] = [
  {
    key: 'instructorName',
    type: 'search',
    label: '강사명',
    placeholder: '강사명을 입력하세요',
    width: COL_WIDTH,
  },
  {
    key: 'region',
    type: 'select',
    label: '거주 지역',
    placeholder: '전체',
    options: REGION_OPTIONS,
    width: COL_WIDTH,
  },
  {
    key: 'jaLectureExperience',
    type: 'select',
    label: 'JA 강의 이력',
    placeholder: '전체',
    options: JA_LECTURE_EXPERIENCE_OPTIONS,
    width: COL_WIDTH,
  },
  {
    key: 'jaEvaluationGrade',
    type: 'select',
    label: 'JA 평가 등급',
    placeholder: '전체',
    options: JA_EVALUATION_GRADE_OPTIONS,
    width: COL_WIDTH,
  },
  {
    key: 'educationAssignmentStatus',
    type: 'select',
    label: '교육 예정 현황',
    placeholder: '전체',
    options: EDUCATION_ASSIGNMENT_OPTIONS,
    width: COL_WIDTH,
  },
]
