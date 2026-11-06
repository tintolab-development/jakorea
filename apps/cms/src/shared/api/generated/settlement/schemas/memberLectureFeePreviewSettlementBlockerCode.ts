/**
 * 정산 확정/신청 차단 코드. SETTLEMENT_ACTUAL_TRAINING_TIME_REQUIRED=실적 시작·종료 시간 없음. SETTLEMENT_WAGE_RATE_NOT_CONFIGURED=프로그램 등급 단가 없음.
 */
export type MemberLectureFeePreviewSettlementBlockerCode = typeof MemberLectureFeePreviewSettlementBlockerCode[keyof typeof MemberLectureFeePreviewSettlementBlockerCode] | null;


export const MemberLectureFeePreviewSettlementBlockerCode = {
  SETTLEMENT_ACTUAL_TRAINING_TIME_REQUIRED: 'SETTLEMENT_ACTUAL_TRAINING_TIME_REQUIRED',
  SETTLEMENT_WAGE_RATE_NOT_CONFIGURED: 'SETTLEMENT_WAGE_RATE_NOT_CONFIGURED',
} as const;
