/**
 * Playwright webServer용 env — E2E_MOCK_AUTH=1 이면 adminAuth 를 제외해 mock 로그인·TOTP MFA 사용.
 */
export function buildE2eWebServerEnv(): NodeJS.ProcessEnv {
  const env = { ...process.env }

  if (process.env.E2E_MOCK_AUTH === '1') {
    const modules = (env.VITE_REAL_API_MODULES ?? '')
      .split(',')
      .map(value => value.trim())
      .filter(Boolean)
      .filter(module => module !== 'adminAuth')

    env.VITE_REAL_API_MODULES = modules.join(',')
  }

  return env
}
