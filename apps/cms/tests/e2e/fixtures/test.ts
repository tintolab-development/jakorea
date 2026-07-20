/**
 * CMS Playwright E2E 공통 fixture
 *
 * - 모든 테스트에서 `/api/*` 4xx/5xx 응답을 자동 수집 (에러 로깅)
 * - mutation POST payload·테스트 진행 지표를 테스트 로깅에 기록
 * - 테스트 실패 시 또는 백엔드 에러가 1건 이상이면 터미널·attachment·json 파일로 덤프
 *
 * 스펙에서는 `@playwright/test` 대신 이 모듈의 `test` / `expect` 를 import 하세요.
 */

import { test as base, expect } from '@playwright/test'
import {
  dumpE2eErrorLogs,
  installApiErrorCapture,
  type CapturedApiError,
} from '../helpers/attach-e2e-error-logs'
import {
  dumpE2eTestLogs,
  installApiCallCapture,
} from '../helpers/attach-e2e-test-logs'

type ApiErrorCapture = {
  getErrors: () => Promise<CapturedApiError[]>
  dispose: () => void
}

export const test = base.extend<{
  _backendErrorCapture: ApiErrorCapture
  _testProgressCapture: void
}>({
  // auto: true → 스펙에서 참조하지 않아도 모든 테스트에 적용
  _backendErrorCapture: [
    async ({ page }, use, testInfo) => {
      const capture = installApiErrorCapture(page)
      await use(capture)

      // body 파싱 in-flight 를 기다린 뒤 덤프 (아니면 로그 누락)
      const errors = await capture.getErrors()
      const failed = testInfo.status !== 'passed' && testInfo.status !== 'skipped'
      if (failed || errors.length > 0) {
        await dumpE2eErrorLogs({
          page,
          testInfo,
          captured: errors,
        })
      }
      capture.dispose()
    },
    { auto: true },
  ],
  _testProgressCapture: [
    async ({ page }, use, testInfo) => {
      const startedAtIso = new Date().toISOString()
      const capture = installApiCallCapture(page)
      await use()
      const calls = await capture.getCalls()
      capture.dispose()
      await dumpE2eTestLogs({
        testInfo,
        calls,
        startedAtIso,
      })
    },
    { auto: true },
  ],
})

export { expect }
