import { REQUIRED_FIELDS_INCOMPLETE_ALERT_MESSAGE } from '@/shared/constants/required-fields-incomplete-alert-message'
import type { GeneralRegistrationIncompleteItem } from '@/features/program/general/lib/registration-incomplete-summary'

/**
 * 일반 프로그램 등록 — 필수 미입력 팝업 본문.
 * 미입력 항목 목록(QA-0042 「탭 이름 > 항목명」 링크)은 보이지 않고 공통 안내 문구만 둔다(사용자 결정 2026-11-16).
 * 호출부 계약은 유지한다(항목·이동 콜백은 받되 쓰지 않음).
 */
export function RegistrationIncompleteAlertContent(_props: {
  items: readonly GeneralRegistrationIncompleteItem[]
  onNavigate: (item: GeneralRegistrationIncompleteItem) => void
}) {
  return <>{REQUIRED_FIELDS_INCOMPLETE_ALERT_MESSAGE}</>
}
