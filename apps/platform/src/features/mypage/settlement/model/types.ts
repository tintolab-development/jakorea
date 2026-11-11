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
  /** 정산 신청 금액. 0과 없음(null)을 구분한다. */
  appliedAmount: number | null
  /**
   * 다음 revision으로 대체된 이전 재신청 이력. 금액 취소선, 합계 제외.
   * 원래 결과(반려·정정 요청)를 구분할 서버 필드가 없어 상태 라벨은 표시하지 않는다.
   */
  superseded?: boolean
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
