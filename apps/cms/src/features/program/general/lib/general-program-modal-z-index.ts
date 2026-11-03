/** 일반 프로그램 상세 풀페이지 모달 — ant 기본(1000)보다 위, 미리보기보다 아래 */
export const GENERAL_PROGRAM_DETAIL_FULLPAGE_MODAL_Z_INDEX = 1100

/**
 * 교육구조 변경 ConfirmModal.
 * TealHeaderModal은 body 포털이므로 상세 풀페이지(1100)·날짜 피커(1200)보다 위여야 한다.
 * 참여자 미리보기(1500)·Alert(10000)보다는 아래. 공통 ConfirmModal 기본값(1001)은 바꾸지 않는다.
 */
export const GENERAL_PROGRAM_DETAIL_STRUCTURE_CONFIRM_Z_INDEX =
  GENERAL_PROGRAM_DETAIL_FULLPAGE_MODAL_Z_INDEX + 200

/** 참여자 모집 사용자 미리보기 — 상세 풀페이지 위 (양식 userPreview 1300과 동급 이상) */
export const PARTICIPANT_RECRUITMENT_PREVIEW_MODAL_Z_INDEX = 1500

/** 개인 정산 산출 내역서 — 상세 풀페이지(1100) 위 */
export const INDIVIDUAL_SETTLEMENT_REVIEW_STATEMENT_MODAL_Z_INDEX = 1400

/**
 * 산출 내역서 위 승인·반려·산정 기준 상세.
 * ConfirmModal 기본값(1001)은 풀페이지·산출 내역서에 가려진다.
 */
export const INDIVIDUAL_SETTLEMENT_REVIEW_NESTED_MODAL_Z_INDEX =
  PARTICIPANT_RECRUITMENT_PREVIEW_MODAL_Z_INDEX
