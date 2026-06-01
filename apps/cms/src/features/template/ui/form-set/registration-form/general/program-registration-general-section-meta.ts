/**
 * 일반 프로그램 등록 폼 — 카드 헤더(제목·설명).
 * 시드(`program-registration-draft`)·상세 공통 정보 수정 모드에서 동일 문구 사용.
 */
export const PROGRAM_REGISTRATION_GENERAL_SECTION_META = {
  educationCurriculum: {
    title: '교육 진행 (커리큘럼)',
    /** 단일 회차 — 수정 모드·등록 폼 카드 설명 */
    editDescription: '차시 별 정보를 입력해 주세요',
    /** 복수 회차 */
    editDescriptionMultiRound: '회차 별 정보를 입력해 주세요',
  },
  educationScheduleSettings: {
    title: '교육 진행 일정 설정',
    editDescription: '교육이 실행되는 일정을 설정해 주세요.',
  },
} as const
