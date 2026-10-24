/**
 * 일반 프로그램 등록 폼 — 카드 헤더(제목·설명).
 * 기본 정보 설명은 일반 등록 폼만 사용. 1사1교·교육받은 교사·UJAT는 비움.
 */
export const PROGRAM_REGISTRATION_GENERAL_SECTION_META = {
  basicInfo: {
    title: '기본 정보',
    editDescription: '모집 등록 후 참여자 유형은 변경할 수 없습니다.',
  },
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
    /** 프로그램 등록 위저드·등록 폼 템플릿 카드 설명 */
    registrationDescription: '교육이 실행되는 일정을 설정해 주세요.',
    /** 프로그램 상세 공통정보 수정 모드 안내 */
    editDescription:
      '사업 운영 기간과 교육 일정 기간은 동시에 수정할 수 없습니다. 운영 기간을 먼저 수정하고 저장한 다음, 교육 일정 기간을 수정해 주세요.',
  },
} as const
