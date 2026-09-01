import { type Page, expect } from '@playwright/test'

/** DEV 전용 — 로그인 페이지 「어드민 계정정보 자동 입력」 버튼 */
export const ADMIN_AUTO_FILL_BUTTON = '어드민 계정정보 자동 입력'

/** 백엔드 `LOCAL_TEST_CODE` MFA — `ADMIN_MFA_LOCAL_TEST_CODE` 와 동일 */
export const LOCAL_TEST_MFA_CODE = '000000'

export class LoginPage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto('/login')
    await expect(this.page.getByRole('button', { name: '로그인하기' })).toBeVisible()
  }

  /** DEV 자동 입력 → API 로그인 → MFA LOCAL_TEST_CODE → `/` 대시보드 */
  async loginWithAdminAutoFillAndMfa(mfaCode: string = LOCAL_TEST_MFA_CODE) {
    await this.page.getByRole('button', { name: ADMIN_AUTO_FILL_BUTTON }).click()

    await expect(this.page.getByLabel('이메일')).not.toHaveValue('')
    await expect(this.page.getByLabel('비밀번호')).not.toHaveValue('')

    await this.page.getByRole('button', { name: '로그인하기' }).click()
    await this.submitMfa(mfaCode)
    await this.page.waitForURL(url => {
      const { pathname } = new URL(url)
      return pathname === '/' || pathname === ''
    })
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
