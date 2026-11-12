import { REQUIRED_FIELDS_INCOMPLETE_ALERT_MESSAGE } from '@/shared/constants/required-fields-incomplete-alert-message'
import type { GeneralRegistrationIncompleteItem } from '@/features/program/general/lib/registration-incomplete-summary'
import './registration-incomplete-alert-content.css'

/**
 * 일반 프로그램 등록 — 필수 미입력 팝업 본문 (QA-0042).
 * 「탭 이름 > 항목명」을 나열하고, 누르면 해당 탭으로 이동해 항목 단락으로 스크롤한다.
 */
export function RegistrationIncompleteAlertContent({
  items,
  onNavigate,
}: {
  items: readonly GeneralRegistrationIncompleteItem[]
  onNavigate: (item: GeneralRegistrationIncompleteItem) => void
}) {
  if (items.length === 0) return <>{REQUIRED_FIELDS_INCOMPLETE_ALERT_MESSAGE}</>
  return (
    <>
      {REQUIRED_FIELDS_INCOMPLETE_ALERT_MESSAGE}
      <ul className="registration-incomplete-alert__list" aria-label="미입력 필수 항목">
        {items.map(item => (
          <li key={item.text}>
            <button
              type="button"
              className="registration-incomplete-alert__item"
              onClick={() => onNavigate(item)}
            >
              {item.text}
            </button>
          </li>
        ))}
      </ul>
    </>
  )
}
