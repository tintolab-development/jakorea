import type { SettlementWriteDraft } from '../model/write-draft.ts'
import { parseSettlementAmount } from './format-write-draft.ts'

/** 개인·봉사자 영수증 항목 금액이 정산 항목 설정 한도(maxLimitWon)를 넘을 때 서버 400 코드 */
export const PAYMENT_ITEM_LIMIT_EXCEEDED_CODE = 'PAYMENT_ITEM_LIMIT_EXCEEDED'

/** 서버 메시지에 금액이 없어 FE가 maxLimitWon으로 문구를 만든다. */
export function paymentItemLimitExceededMessage(maxLimitWon: number): string {
  return `최대 ${maxLimitWon.toLocaleString('ko-KR')}원까지 신청할 수 있어요.`
}

/** 한도를 알 수 없을 때(서버 설정이 바뀐 경우 등) 쓰는 문구 */
export const PAYMENT_ITEM_LIMIT_EXCEEDED_FALLBACK_MESSAGE =
  '신청 한도를 넘는 항목이 있습니다. 금액을 확인해 주세요.'

/** 한도는 정산 신청 1건(일정 1건) 기준이고, 한도와 같은 금액은 통과한다. null이면 한도 없음. */
export function isOverPaymentItemLimit(
  amount: number,
  maxLimitWon: number | null | undefined,
): boolean {
  return maxLimitWon != null && maxLimitWon > 0 && amount > maxLimitWon
}

/** 한도를 넘으면 오류 문구, 아니면 null */
export function paymentItemLimitError(
  amount: number,
  maxLimitWon: number | null | undefined,
): string | null {
  return isOverPaymentItemLimit(amount, maxLimitWon)
    ? paymentItemLimitExceededMessage(maxLimitWon as number)
    : null
}

/** 영수증 draft에서 처음으로 한도를 넘는 금액 항목의 한도. 없으면 null. 교통비는 한도가 없다. */
export function findExceededReceiptItemLimit(draft: SettlementWriteDraft): number | null {
  if (draft.meta.documentKind !== 'receipt') return null
  for (const item of draft.extraItems) {
    if (isOverPaymentItemLimit(parseSettlementAmount(item.amount), item.maxLimitWon)) {
      return item.maxLimitWon ?? null
    }
  }
  return null
}
