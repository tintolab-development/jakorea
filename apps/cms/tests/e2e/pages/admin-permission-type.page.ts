/**
 * 관리자 회원 목록 — 권한 유형(뷰어/중간/마스터) 드롭다운 변경
 */

import { type Locator, type Page, expect } from '@playwright/test'

export type AdminPermissionTagVariant = 'manager' | 'partner' | 'viewer'

export const ADMIN_PERMISSION_LABELS: Record<AdminPermissionTagVariant, string> = {
  manager: '마스터 관리자',
  partner: '중간 관리자',
  viewer: '뷰어',
}

export class AdminPermissionTypePage {
  constructor(private readonly page: Page) {}

  async gotoAdminsList() {
    await this.page.goto('/users/list?kind=admins')
    await expect(this.page.getByRole('button', { name: '관리자 등록' })).toBeVisible({
      timeout: 30_000,
    })
  }

  private dataRows(): Locator {
    return this.page.locator('.ant-table-tbody tr.ant-table-row')
  }

  /** 권한 유형 트리거가 있는 첫 행 (드롭다운 가능) */
  async firstPermissionRow(): Promise<Locator> {
    const row = this.dataRows()
      .filter({ has: this.page.locator('.status-dropdown-cell__status-trigger') })
      .first()
    await expect(row).toBeVisible({ timeout: 30_000 })
    return row
  }

  permissionTrigger(row: Locator): Locator {
    return row.locator('.status-dropdown-cell__status-trigger')
  }

  async readPermissionLabel(row: Locator): Promise<string> {
    const text = (await this.permissionTrigger(row).innerText()).trim()
    return text.replace(/\s*…\s*$/, '').trim()
  }

  private labelToVariant(label: string): AdminPermissionTagVariant {
    const entry = (
      Object.entries(ADMIN_PERMISSION_LABELS) as [AdminPermissionTagVariant, string][]
    ).find(([, v]) => v === label)
    if (!entry) {
      throw new Error(`알 수 없는 권한 유형 라벨: ${label}`)
    }
    return entry[0]
  }

  /** 현재와 다른 대상 (viewer↔partner 우선) */
  pickNextVariant(currentLabel: string): AdminPermissionTagVariant {
    const current = this.labelToVariant(currentLabel)
    if (current === 'viewer') return 'partner'
    if (current === 'partner') return 'viewer'
    return 'partner'
  }

  async changePermissionOnRow(row: Locator, next: AdminPermissionTagVariant) {
    const nextLabel = ADMIN_PERMISSION_LABELS[next]
    const patchPromise = this.page.waitForResponse(
      res =>
        res.request().method() === 'PATCH' &&
        /\/api\/admin\/admin-accounts\/[^/]+\/role\/?$/.test(new URL(res.url()).pathname),
      { timeout: 60_000 }
    )

    await this.permissionTrigger(row).click()
    const menu = this.page.locator('.status-dropdown-cell__dropdown-overlay:visible')
    await expect(menu).toBeVisible({ timeout: 10_000 })
    await menu.getByRole('menuitem', { name: nextLabel }).click()

    const response = await patchPromise
    expect(
      response.ok(),
      `권한 유형 변경 실패 HTTP ${response.status()}: ${await response.text().catch(() => '')}`
    ).toBeTruthy()

    await expect(this.permissionTrigger(row)).toContainText(nextLabel, { timeout: 15_000 })
  }
}
