/**
 * E2E 테스트 진행 로그 엔트리.
 * DEV Mock API(`/__dev__/e2e-test-logs`) · localStorage 에 저장되며 실 백엔드로 전송하지 않습니다.
 */

export type E2eTestLogStatus =
  | 'started'
  | 'passed'
  | 'failed'
  | 'skipped'
  | 'timedOut'
  | 'interrupted'
  | 'api'

export type E2eTestLogMetrics = {
  /** 2xx/3xx API 응답 수 */
  apiOkCount?: number
  /** 4xx/5xx API 응답 수 */
  apiErrorCount?: number
  /** POST/PUT/PATCH/DELETE 수 */
  mutationCount?: number
  /** 수집된 에러 코드 (중복 제거) */
  errorCodes?: string[]
  /** 테스트 duration (ms) — 완료 엔트리와 동일할 수 있음 */
  durationMs?: number
}

export type E2eTestLogEntry = {
  id: string
  /** ISO-8601 */
  occurredAt: string
  status: E2eTestLogStatus
  /** 표시용 제목 (보통 titlePath join) */
  title: string
  titlePath: string[]
  file?: string
  project?: string
  retry?: number
  /** 완료 시 소요 시간 */
  durationMs?: number
  /** 단계/이벤트 라벨 (예: 프로그램 등록 POST) */
  phase?: string
  method?: string
  requestPath?: string
  httpStatus?: number | null
  /** 요청 body JSON/텍스트 미리보기 (길이 제한) */
  requestPayload?: string
  responsePreview?: string
  metrics?: E2eTestLogMetrics
  message?: string
  errorMessage?: string
}

export type E2eTestLogListResponse = {
  success: true
  data: {
    items: E2eTestLogEntry[]
    total: number
    /** 상태별 건수 */
    byStatus: Record<string, number>
    /** 최근 실행 요약 지표 */
    summary: {
      runCount: number
      passed: number
      failed: number
      skipped: number
      avgDurationMs: number | null
      apiCallTotal: number
      mutationTotal: number
    }
  }
}

export type E2eTestLogCreateRequest = Omit<E2eTestLogEntry, 'id' | 'occurredAt'> & {
  id?: string
  occurredAt?: string
}
