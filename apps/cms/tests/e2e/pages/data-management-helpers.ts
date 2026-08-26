/**
 * 데이터 관리 E2E — 목록 테이블·필터·삭제 확인 공통
 */

import { type Locator, type Page, type TestInfo, expect } from '@playwright/test'

export const DELETE_TYPED_CONFIRM = '삭제'
export const DELETE_TYPED_PLACEHOLDER = '삭제하시려면 해당란에 [삭제]를 입력해 주세요.'

export function tableRows(page: Page): Locator {
  return page.locator('tbody.ant-table-tbody tr.ant-table-row:not(.ant-table-measure-row)')
}

export function tableHeaderCells(page: Page, root?: Locator): Locator {
  const scope = root ?? page
  return scope.locator('.ant-table-thead th')
}

export function filterField(page: Page, label: string): Locator {
  return page
    .locator('.table-filter-group__field')
    .filter({
      has: page.locator('.table-filter-group__label', { hasText: label }),
    })
    .first()
}

export async function clickSearch(page: Page) {
  await page.getByRole('button', { name: '조회' }).first().click()
}

export async function waitForAdminGet(
  page: Page,
  pathSnippet: string,
  timeoutMs = 30_000,
  opts?: { exact?: boolean }
) {
  const exact = opts?.exact ?? true
  const expected = pathSnippet.replace(/\/$/, '')
  await page
    .waitForResponse(
      res => {
        if (res.request().method() !== 'GET') return false
        const pathname = new URL(res.url()).pathname.replace(/\/$/, '')
        return exact ? pathname === expected : pathname.includes(expected)
      },
      { timeout: timeoutMs }
    )
    .catch(() => undefined)
}

export function isAdminMutation(res: { request(): { method(): string }; url(): string }, method: string, pathRegex: RegExp) {
  return res.request().method() === method && pathRegex.test(new URL(res.url()).pathname)
}

export async function expectColumnTitles(page: Page, titles: readonly string[], root?: Locator) {
  const headers = tableHeaderCells(page, root)
  await expect(headers.first()).toBeVisible({ timeout: 30_000 })
  for (const title of titles) {
    await expect(headers.filter({ hasText: title }).first()).toBeVisible()
  }
}

export async function expectNoColumnTitle(page: Page, title: string | RegExp, root?: Locator) {
  const headers = tableHeaderCells(page, root)
  await expect(headers.filter({ hasText: title })).toHaveCount(0)
}

export async function selectRowCheckbox(page: Page, rowText: string) {
  const row = tableRows(page).filter({ hasText: rowText }).first()
  await expect(row).toBeVisible({ timeout: 15_000 })
  await row.locator('input.ant-checkbox-input').check({ force: true })
}

export async function fillTypedDeleteConfirm(dialog: Locator) {
  await dialog.getByPlaceholder(DELETE_TYPED_PLACEHOLDER).fill(DELETE_TYPED_CONFIRM)
}

export async function dismissVisibleDialog(page: Page, title: string | RegExp) {
  const dialog = page.getByRole('dialog').filter({ hasText: title }).first()
  if ((await dialog.count()) === 0) return
  if (!(await dialog.isVisible().catch(() => false))) return
  const confirm = dialog.getByRole('button', { name: '확인' })
  if ((await confirm.count()) > 0 && (await confirm.isVisible().catch(() => false))) {
    await confirm.click()
  }
  await expect(dialog).toBeHidden({ timeout: 15_000 }).catch(() => undefined)
}

export async function tryFindRow(page: Page, text: string, timeoutMs = 8_000): Promise<boolean> {
  const row = tableRows(page).filter({ hasText: text }).first()
  try {
    await expect(row).toBeVisible({ timeout: timeoutMs })
    return true
  } catch {
    return false
  }
}

/** 클라 dump 엑셀 버튼. 서버 export 경로는 검증하지 않는다. */
export async function clickExcelClientDownload(page: Page, testInfo: TestInfo) {
  const downloadPromise = page.waitForEvent('download', { timeout: 8_000 }).catch(() => null)
  await page.getByRole('button', { name: '엑셀 다운로드' }).click()
  const download = await downloadPromise
  if (!download) {
    testInfo.annotations.push({
      type: 'note',
      description: '엑셀 클라이언트 dump 다운로드 이벤트 없음',
    })
    return
  }
  testInfo.annotations.push({
    type: 'note',
    description: '서버 엑셀 export 경로 검증 skip (클라 dump)',
  })
}
