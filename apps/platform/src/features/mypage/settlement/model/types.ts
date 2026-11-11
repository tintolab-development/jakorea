export type SettlementOverviewView = 'list' | 'calendar'

export type SettlementOverviewStatus =
  | 'waiting_confirm'
  | 'confirmed'
  | 'paid'
  | 'rejected'
  | 'correction_requested'
  | 'reapplied'

export type SettlementOverviewStatusFilter = 'all' | SettlementOverviewStatus

export type SettlementOverviewParams = {
  view: SettlementOverviewView
  month: string
  date: string
  q: string
  status: SettlementOverviewStatusFilter
  fixture: boolean
}

/** 강사 정산 현황 한 건 — 서버 표시값을 그대로 담는 화면 모델 */
export type SettlementOverviewItem = {
  id: string
  programName: string
  organizationName: string
  startsAt: string
  endsAt: string
  sessionLabel: string
  status: SettlementOverviewStatus
  /** receipt = 개인·봉사자 영수증 행(라벨이 지급조서와 다르다, R17). 없으면 강사 지급조서 */
  documentKind?: 'receipt' | 'payment_statement'
  /** 정산 신청 금액. 0과 없음(null)을 구분한다. */
  appliedAmount: number | null
  /**
   * 다음 revision으로 대체된 이전 재신청 이력. 금액 취소선, 합계 제외.
   * status는 원래 결과(신청 반려·지급 정정 요청)다. 원래 결과를 모르면 supersededStatusUnknown.
   */
  superseded?: boolean
  /** 대체된 이전 신청인데 서버 supersededReason이 없는 옛 데이터 — 상태 라벨을 '-'로 둔다 */
  supersededStatusUnknown?: boolean
}

export type SettlementOverviewSummary = {
  /** 총 정산 완료금 — 계좌 지급 완료 기준 서버 실지급액 */
  totalPaidAmount: number | null
  /** 해당 월 정산 완료금 — 계좌 지급 완료 기준 서버 실지급액 */
  monthPaidAmount: number | null
  /** 해당 월 정산 예정금 — 지급조서 확인 완료 기준 서버 실지급액 */
  monthExpectedAmount: number | null
}

export type SettlementOverviewPageData = {
  items: SettlementOverviewItem[]
  summary: SettlementOverviewSummary
}
