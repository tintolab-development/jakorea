/**
 * E2E — 세션 확인 후 대상 화면으로 바로 이동 (대시보드 홈 우회)
 *
 * `/` 대시보드는 shortcuts·charts·schedules 등 API를 한꺼번에 호출합니다.
 * BE가 느리면 전부 30s 타임아웃 → NETWORK_ERROR 로그 폭주.
 */

import { type Page, expect } from '@playwright/test'

/** 로그인 세션이 있으면 /login 이 아님 · LNB 노출로 확인 */
export async function expectAuthenticatedShell(page: Page) {
  await expect(page.getByRole('menuitem', { name: '대시보드 홈' })).toBeVisible({
    timeout: 30_000,
  })
  await expect(page).not.toHaveURL(/\/login/)
}
