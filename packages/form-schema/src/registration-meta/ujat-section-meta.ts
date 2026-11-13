/**
 * UJAT 프로그램 등록 폼 — 카드 헤더(제목·설명).
 */
export const UJAT_REGISTRATION_SECTION_META = {
  basic: {
    title: '기본 정보',
    description: '참여자 유형은 프로그램 등록 이후 항목 수정이 불가합니다.',
  },
  businessKpi: {
    title: '사업 KPI 목표',
    description: '',
  },
  wage: {
    title: '임금 정보',
    description: '',
  },
  firstHalfEducationSchedule: {
    title: '상반기 교육 일정',
    /** 시안(5767:194428) 마침표 포함 */
    description: '행사 일정 별 정보를 입력해 주세요.',
  },
  secondHalfEducationSchedule: {
    title: '하반기 교육 일정',
    /** 시안(5767:194428) 마침표 포함 */
    description: '행사 일정 별 정보를 입력해 주세요.',
  },
  educationScheduleSettings: {
    title: '교육 진행 일정 설정',
    description: '교육이 실행되는 일정을 설정해 주세요.',
  },
  educationClassCapacityByRegion: {
    title: '지역 별 교육 진행 가능 학급 및 봉사단 수',
    description: '지역 별로 상반기/하반기 교육 진행 가능한 최대 학급 수와 봉사단 수를 설정해 주세요.',
  },
} as const
