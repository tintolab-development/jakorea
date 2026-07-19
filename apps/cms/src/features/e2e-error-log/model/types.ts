/**
 * E2E / 로컬 디버그용 백엔드 에러 로그 엔트리.
 * DEV Mock API(`/__dev__/e2e-error-logs`) · localStorage 에 저장되며 실 백엔드로 전송하지 않습니다.
 */

export type E2eErrorLogEntry = {
  id: string
  /** ISO-8601 */
  occurredAt: string
  /** 화면·플로우 맥락 (경로 기반 라벨) */
  situation: string
  /** 발생 시점 pathname + search */
  route: string
  method: string
  /** 요청 경로 (query 제외 가능) */
  requestPath: string
  httpStatus: number | null
  /** BE `error.code` 또는 HTTP status 문자열 */
  errorCode: string
  message: string
  traceId?: string
  /** 요청 body 요약 (민감정보 제외·길이 제한) */
  requestBodyPreview?: string
  /** 응답 body 요약 */
  responseBodyPreview?: string
}

export type E2eErrorLogListResponse = {
  success: true
  data: {
    items: E2eErrorLogEntry[]
    total: number
    /** 에러 코드별 건수 */
    byErrorCode: Record<string, number>
  }
}

export type E2eErrorLogCreateRequest = Omit<E2eErrorLogEntry, 'id' | 'occurredAt'> & {
  id?: string
  occurredAt?: string
}

export type E2eErrorCodeSummary = {
  errorCode: string
  count: number
}
