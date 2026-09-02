import { type Page, expect } from '@playwright/test'
import { generateSync } from 'otplib'

/** DEV 전용 — 로그인 페이지 「임시 로그인 (DEV)」 마스터 버튼 */
export const ADMIN_DEV_LOGIN_MASTER_BUTTON = '마스터'

/** @deprecated `ADMIN_DEV_LOGIN_MASTER_BUTTON` 사용 */
export const ADMIN_AUTO_FILL_BUTTON = ADMIN_DEV_LOGIN_MASTER_BUTTON

/** 백엔드 `LOCAL_TEST_CODE` MFA — `ADMIN_MFA_LOCAL_TEST_CODE` 와 동일 */
export const LOCAL_TEST_MFA_CODE = '000000'

/** mock admin1 TOTP secret — `src/data/mock/totp-secrets.ts` */
const ADMIN1_MOCK_TOTP_SECRET = 'YB6USKOPTY3O4XCOM55K26HWAJFCOYAW'

export class LoginPage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto('/login')
    await expect(this.page.getByRole('button', { name: '로그인하기' })).toBeVisible()
  }

  /** DEV 마스터 자동 입력 → 로그인 → MFA(LOCAL_TEST 또는 mock TOTP) → `/` 대시보드 */
  async loginWithAdminAutoFillAndMfa(mfaCode?: string) {
    await this.page.getByRole('button', { name: ADMIN_DEV_LOGIN_MASTER_BUTTON }).click()

    await expect(this.page.getByLabel('이메일')).not.toHaveValue('')
    await expect(this.page.getByLabel('비밀번호')).not.toHaveValue('')

    await this.page.getByRole('button', { name: '로그인하기' }).click()

    const dialog = this.page.getByRole('dialog')
    const mfaVisible = await dialog
      .waitFor({ state: 'visible', timeout: 20_000 })
      .then(() => true)
      .catch(() => false)

    if (mfaVisible) {
      const code = mfaCode ?? (await this.resolveMfaCode())
      await this.submitMfa(code)
    }

    await this.page.waitForURL(url => {
      const { pathname } = new URL(url)
      return pathname === '/' || pathname === ''
    })
  }

  private async resolveMfaCode(): Promise<string> {
    const localTestHint = this.page.getByText(/LOCAL_TEST_CODE/)
    if (await localTestHint.isVisible().catch(() => false)) {
      return LOCAL_TEST_MFA_CODE
    }

    return generateSync({ secret: ADMIN1_MOCK_TOTP_SECRET })
  }

  async submitMfa(code: string) {
    const dialog = this.page.getByRole('dialog')
    await expect(dialog).toBeVisible()

    const otpInputs = dialog.locator('.mfa-otp-input__boxes input')
    await expect(otpInputs.first()).toBeVisible()
    await otpInputs.first().click()
    await this.page.keyboard.type(code)
  }
}
