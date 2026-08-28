/**
 * 일반 프로그램 등록 폼 — 카드 헤더(제목·설명).
 * 시드(`program-registration-draft`)·상세 공통 정보 수정 모드에서 동일 문구 사용.
 */
export const PROGRAM_REGISTRATION_GENERAL_SECTION_META = {
  typeSettings: {
    title: '프로그램 유형 설정',
    editDescription:
      '프로그램의 운영 방식과 진행 구조를 설정합니다. 해당 설정에 따라 교육 일정 작성 방식이 달라집니다.',
  },
  wageInfo: {
    title: '임금 정보',
    editDescription: '해당 프로그램 내에서 각 등급별로 지급할 강사비를 책정해 주세요.',
  },
  educationCurriculum: {
    title: '교육 진행 (커리큘럼)',
    /** 단일 회차 — 수정 모드·등록 폼 카드 설명 */
    editDescription: '차시 별 정보를 입력해 주세요',
    /** 복수 회차 */
    editDescriptionMultiRound: '회차 별 정보를 입력해 주세요',
  },
  educationScheduleCurriculum: {
    title: '교육 진행 (일정형)',
    editDescription: '세부 일정 별 정보를 입력해 주세요',
    editDescriptionMultiRound: '회차 별 정보를 입력해 주세요',
    /** 개인 + 복수 회차, 또는 기관 + 교육 형태·참여·IPS 모두 일정 별 상이 — 행사 일정 블록 */
    editDescriptionMultiRoundEvent: '행사 일정 별 정보를 입력해 주세요',
  },
  educationScheduleSettings: {
    title: '교육 진행 일정 설정',
    editDescription: '교육이 실행되는 일정을 설정해 주세요.',
  },
} as const
