/**
 * 서버 export 발급 응답.
 *
 * 현재 생성된 OpenAPI에는 tax-report 200 response schema가 없어 history 목록
 * DTO와 분리해 둔다. 백엔드 OpenAPI가 갱신되면 이 타입을 generated DTO로
 * 교체한다.
 */
export interface SettlementExportResponse {
  exportHistoryId?: number
  exportType?: string
  exportStatus?: string
  totalCount?: number
  totalAmount?: number
  fileObjectId?: number | null
  clientExportEventId?: number | null
  privacyExportFileId?: number | null
  deliveryMethod?: string
  exportPolicy?: string | null
  rawPrivacyIncluded?: boolean | null
  downloadUrl?: string | null
  pollingStatus?: string
  /** history polling에서 실패 사유가 제공될 수 있다. */
  failureReason?: string
}
