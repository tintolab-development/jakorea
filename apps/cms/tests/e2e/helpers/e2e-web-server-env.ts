/**
 * Playwright webServer용 env.
 * E2E_MOCK_AUTH=1 이면 setup이 localStorage에 mock 세션을 심는다 (`seedMockAdminSession`).
 * 모듈 allowlist는 사용하지 않는다 — remote URL 있으면 전 모듈 실 API.
 */
export function buildE2eWebServerEnv(): NodeJS.ProcessEnv {
  return { ...process.env }
}
