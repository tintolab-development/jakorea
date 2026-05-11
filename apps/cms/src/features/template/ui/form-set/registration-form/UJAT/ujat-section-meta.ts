/**
 * UJAT 프로그램 등록 폼 — 카드 헤더(제목·설명).
 * - 기본 정보: 스크린샷에는 설명란이 비어 placeholder 「설명 입력」만 보임 → 시드는 빈 문자열.
 */
export const UJAT_REGISTRATION_SECTION_META = {
  basic: {
    title: '기본 정보',
    description: '',
  },
  businessKpi: {
    title: '사업 KPI 목표',
    description: '',
  },
  payment: {
    title: '입금 정보',
    description: '',
  },
  firstHalfEducationSchedule: {
    title: '상반기 교육 일정',
    description: '행사 일정 별 정보를 입력해 주세요',
  },
  secondHalfEducationSchedule: {
    title: '하반기 교육 일정',
    description: '행사 일정 별 정보를 입력해 주세요',
  },
  educationScheduleSettings: {
    title: '교육 진행 일정 설정',
    description: '교육이 진행되는 일정을 설정해 주세요.',
  },
  educationClassCapacityByRegion: {
    title: '지역 별 교육 진행 가능 학급 수',
    description: '지역 별 교육 진행 가능 학급 수를 설정해 주세요.',
  },
  gradeWiseClassTime: {
    title: '학년 별 수업 시간',
    description: '',
  },
} as const
