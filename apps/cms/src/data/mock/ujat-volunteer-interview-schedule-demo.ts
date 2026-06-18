/**
 * UJAT 목록(`mockUjatElementaryListPrograms`) 행 ID — 면접 진행 가능 일정 mock 분기
 * @see `@/data/mock/ujat-volunteer-interview-schedule` · `/programs/ujat` 목록에서 행 클릭으로 확인
 */
/** 목록 「봉사자 모집 중」 — 예외 일정 1건 포함 */
export const UJAT_MOCK_PROGRAM_ID_VOLUNTEER_INTERVIEW_WITH_EXCEPTIONS =
  'ujat-progress-volunteer-recruiting' as const
/** 목록 「프로그램 진행 예정」 — 공통 일정만 */
export const UJAT_MOCK_PROGRAM_ID_VOLUNTEER_INTERVIEW_COMMON_ONLY =
  'ujat-progress-education-scheduled' as const