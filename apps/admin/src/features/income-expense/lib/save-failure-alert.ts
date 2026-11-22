/**
 * 수입·지출 등록·일괄 수정 — 서버 VALIDATION_ERROR의 field 기준 한글 안내.
 * 서버 message는 영어("field: 사유")라 그대로 노출하지 않는다.
 * 일괄 수정은 field가 `items[n].amount`처럼 오므로 마지막 이름만 본다.
 */

import { readApiErrorCode, readApiErrorField } from '@/shared/lib/api-error-message'

export type FinanceFailureAlert = { title: string; content: string }

const FIELD_ALERTS: Record<string, FinanceFailureAlert> = {
  amount: { title: '입력 확인', content: '금액은 0 이상의 원 단위 정수로 입력해 주세요.' },
  ratio: { title: '입력 확인', content: '비율은 0~100, 소수 4자리까지 입력해 주세요.' },
  itemName: { title: '입력 확인', content: '항목명을 확인해 주세요.' },
}

/** `items[0].amount` → `amount`, `amount` → `amount` */
export function financeFieldName(field: string): string {
  return field.replace(/^items\[\d+\]\./, '').split('.').pop() ?? field
}

/** VALIDATION_ERROR + 알려진 field면 한글 안내, 아니면 null(호출부 기존 문구 사용) */
export function financeValidationFailureAlert(error: unknown): FinanceFailureAlert | null {
  if (readApiErrorCode(error) !== 'VALIDATION_ERROR') return null
  const field = readApiErrorField(error)
  if (!field) return null
  return FIELD_ALERTS[financeFieldName(field)] ?? null
}
