/**
 * 알림 발송 UX 카피 — 「선택 가능 ≠ 발송 성공」(BE 2026-09-11)
 * enabled=스코프 허용 ≠ DB enrich 값 존재. 비활성(enabled=false) 안내와 문장을 섞지 말 것.
 */

/** 템플릿 피커 안내 */
export const NOTIFICATION_SEND_SELECTABLE_NOT_SUCCESS_HINT =
  '템플릿을 선택할 수 있어도, 수신자·프로그램에 실제 값이 없으면 발송이 실패합니다. (활성 변수 ≠ 값 존재)'

/** NOTIFICATION_TEMPLATE_REQUIRED_VARIABLE_MISSING 토스트 보조 */
export const NOTIFICATION_REQUIRED_VARIABLE_MISSING_HINT =
  '본문 #{키} 값이 비어 발송이 중단되었습니다. 수신자·프로그램 데이터 또는 템플릿 본문을 확인하세요.'

/** 발송 이력/상세 — 실패는 배치 스냅샷 */
export const NOTIFICATION_SEND_FAILURE_SNAPSHOT_HINT =
  '이 오류는 발송 당시 기준입니다. 데이터·템플릿 변경 후 재발송으로 확인하세요.'
