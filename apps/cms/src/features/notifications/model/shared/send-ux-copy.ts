/**
 * 알림 발송 UX 카피 — 「선택 가능 ≠ 발송 성공」(BE 2026-09-11)
 * enabled=스코프 허용 ≠ DB enrich 값 존재. 비활성(enabled=false) 안내와 문장을 섞지 말 것.
 */

/** NOTIFICATION_TEMPLATE_REQUIRED_VARIABLE_MISSING 토스트 보조 */
export const NOTIFICATION_REQUIRED_VARIABLE_MISSING_HINT =
  '본문 #{키} 값이 비어 발송이 중단되었습니다. 수신자·프로그램 데이터 또는 템플릿 본문을 확인하세요.'

/**
 * 직접 입력(DIRECT) 수신자 — 회원 전용 변수(회원 유형·참여 유형·강사 등급 등)는 서버가 채우지 않는다 (BE 2026-11-10).
 * 프로그램 변수는 선택한 프로그램으로 채워진다.
 */
export const NOTIFICATION_DIRECT_MEMBER_VARIABLE_HINT =
  '직접 입력 수신자에게는 회원 정보 변수를 채울 수 없습니다.'

/** 발송 이력/상세 — 실패는 배치 스냅샷 */
export const NOTIFICATION_SEND_FAILURE_SNAPSHOT_HINT =
  '이 오류는 발송 당시 기준입니다. 데이터·템플릿 변경 후 재발송으로 확인하세요.'
