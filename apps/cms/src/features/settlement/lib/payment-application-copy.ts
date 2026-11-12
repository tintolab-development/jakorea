/**
 * 지급조서 확인·일괄 확인·반려 팝업 문구 — 신청 유형별 (노션 「지급조서 확인 안내 팝업」·「지급조서 반려 안내 팝업」, 기획 2026-11-12 3차 2번)
 * - instructor: 강사 지급조서(강의비)
 * - receipt: 참여자·봉사자 영수증(실비)
 */
export type PaymentApplicationKind = 'instructor' | 'receipt'

type PaymentApplicationCopy = {
  /** 확인·일괄 확인 문구의 신청 이름 */
  confirmSubject: string
  /** 반려 문구의 신청 이름 */
  rejectSubject: string
  /** 지급 안내 문구의 지급 대상 */
  payee: string
}

const PAYMENT_APPLICATION_COPY: Record<PaymentApplicationKind, PaymentApplicationCopy> = {
  instructor: { confirmSubject: '강의비 지급조서', rejectSubject: '지급조서', payee: '강의비' },
  receipt: { confirmSubject: '영수증', rejectSubject: '영수증', payee: '실비' },
}

export function getPaymentApplicationCopy(
  kind: PaymentApplicationKind | undefined
): PaymentApplicationCopy {
  return PAYMENT_APPLICATION_COPY[kind ?? 'instructor']
}
