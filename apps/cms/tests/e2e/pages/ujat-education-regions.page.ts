import { type Locator, type Page, expect } from '@playwright/test'

const LIST_PATH = '/programs/ujat/regions'
const DUPLICATE_NAME_MESSAGE = '이미 등록된 교육 지역명입니다.'

function isEducationRegionsApi(
  res: { request: () => { method: () => string }; url: () => string },
  method: string,
  pathSuffix?: RegExp
): boolean {
  if (res.request().method() !== method) return false
  let pathname: string
  try {
    pathname = new URL(res.url()).pathname.replace(/\/$/, '')
  } catch {
    return false
  }
  if (!pathname.includes('/api/admin/ujat/education-regions')) return false
  if (pathSuffix && !pathSuffix.test(pathname)) return false
  return true
}

/**
 * UJAT 교육 지역 관리 — `/programs/ujat/regions` CRUD
 *
 * 기본 마스터(서울 등)는 수정·삭제하지 않고, Playwright 전용 행만 생성·정리합니다.
 */
export class UjatEducationRegionsPage {
  constructor(private readonly page: Page) {}

  async gotoList() {
    await this.page.goto(LIST_PATH)
    await expect(this.page.getByRole('button', { name: '교육 지역 등록' })).toBeVisible({
      timeout: 30_000,
    })
    await expect(this.page.getByText('교육 지역', { exact: true }).first()).toBeVisible({
      timeout: 15_000,
    })
  }

  private table(): Locator {
    return this.page.locator('.cms-data-table, .ant-table').first()
  }

  rowByName(name: string): Locator {
    return this.table()
      .locator('tbody.ant-table-tbody tr.ant-table-row')
      .filter({ hasText: name })
      .first()
  }

  async expectRowVisible(name: string) {
    await expect(this.rowByName(name)).toBeVisible({ timeout: 30_000 })
  }

  async expectRowHidden(name: string) {
    await expect(this.rowByName(name)).toHaveCount(0, { timeout: 30_000 })
  }

  async setUsageFilter(status: '사용' | '미사용') {
    const filterCard = this.page.locator('.filter-table-layout, .table-filter-group').first()
    const radio = filterCard.getByRole('radio', { name: status }).first()
    if ((await radio.count()) > 0) {
      await radio.check({ force: true }).catch(async () => {
        await filterCard.getByText(status, { exact: true }).first().click()
      })
      return
    }
    await filterCard.getByText(status, { exact: true }).first().click()
  }

  async setNameFilter(name: string) {
    const input = this.page.getByPlaceholder('교육 지역명을 입력하세요')
    await expect(input).toBeVisible({ timeout: 15_000 })
    await input.fill(name)
  }

  async clickSearch() {
    const searchBtn = this.page.getByRole('button', { name: '조회' })
    await expect(searchBtn).toBeEnabled({ timeout: 15_000 })
    await searchBtn.click()
  }

  async filterByName(name: string, usage: '사용' | '미사용' = '사용') {
    await this.setUsageFilter(usage)
    await this.setNameFilter(name)
    await this.clickSearch()
  }

  /**
   * 등록 모달 → POST( remote 시 ) → 목록 행 확인.
   * API 응답이 없거나 실패해도 UI 성공이면 annotation으로 넘길 수 있게 ok 여부를 반환합니다.
   */
  async createRegion(name: string, active = true): Promise<{ remoteOk: boolean }> {
    await this.page.getByRole('button', { name: '교육 지역 등록' }).click()

    const dialog = this.page.getByRole('dialog').filter({ hasText: 'UJAT 교육 지역 신규 등록' })
    await expect(dialog).toBeVisible({ timeout: 15_000 })

    const activeLabel = active ? '사용' : '미사용'
    const activeRadio = dialog.getByRole('radio', { name: activeLabel }).first()
    if ((await activeRadio.count()) > 0) {
      await activeRadio.check({ force: true }).catch(async () => {
        await dialog.getByText(activeLabel, { exact: true }).first().click()
      })
    } else {
      await dialog.getByText(activeLabel, { exact: true }).first().click()
    }

    const nameInput = dialog.getByPlaceholder('교육 지역명을 입력해 주세요')
    await expect(nameInput).toBeVisible({ timeout: 10_000 })
    await nameInput.fill(name)

    const postWait = this.page
      .waitForResponse(res => isEducationRegionsApi(res, 'POST'), { timeout: 30_000 })
      .catch(() => null)

    await dialog.getByRole('button', { name: '등록' }).click()

    const postRes = await postWait
    let remoteOk = true
    if (postRes) {
      remoteOk = postRes.ok()
      if (!remoteOk) {
        const body = await postRes.text().catch(() => '')
        throw new Error(
          `교육 지역 등록 API 실패: HTTP ${postRes.status()} ${body.slice(0, 300)}`
        )
      }
    }

    const failAlert = this.page.getByRole('dialog').filter({ hasText: /등록 실패|등록 불가/ })
    if (await failAlert.isVisible().catch(() => false)) {
      const message = (
        await failAlert.locator('.ant-modal-body, p, [class*="content"]').first().innerText()
      ).trim()
      throw new Error(`교육 지역 등록 실패: ${message || '(메시지 없음)'}`)
    }

    await expect(dialog).toBeHidden({ timeout: 30_000 })
    await this.filterByName(name, active ? '사용' : '미사용')
    await this.expectRowVisible(name)
    return { remoteOk: remoteOk && postRes != null }
  }

  /** 동일 이름으로 재등록 → 중복 메시지 */
  async expectDuplicateCreateBlocked(name: string) {
    await this.page.getByRole('button', { name: '교육 지역 등록' }).click()
    const dialog = this.page.getByRole('dialog').filter({ hasText: 'UJAT 교육 지역 신규 등록' })
    await expect(dialog).toBeVisible({ timeout: 15_000 })
    await dialog.getByPlaceholder('교육 지역명을 입력해 주세요').fill(name)
    await dialog.getByRole('button', { name: '등록' }).click()

    const alert = this.page.getByRole('dialog').filter({
      hasText: new RegExp(`등록 불가|${DUPLICATE_NAME_MESSAGE}`),
    })
    await expect(alert).toBeVisible({ timeout: 30_000 })
    await expect(alert.getByText(DUPLICATE_NAME_MESSAGE)).toBeVisible({ timeout: 10_000 })

    const confirm = alert.getByRole('button', { name: /확인|닫기|OK/i }).first()
    if (await confirm.isVisible().catch(() => false)) {
      await confirm.click()
    } else {
      await this.page.keyboard.press('Escape').catch(() => undefined)
    }

    const cancel = dialog.getByRole('button', { name: '취소' })
    if (await cancel.isVisible().catch(() => false)) {
      await cancel.click()
    }
    await expect(dialog).toBeHidden({ timeout: 15_000 }).catch(() => undefined)
  }

  async editInline(
    currentName: string,
    next: { name: string; active?: boolean }
  ): Promise<{ remoteOk: boolean }> {
    await this.filterByName(currentName, '사용')
    const row = this.rowByName(currentName)
    await expect(row).toBeVisible({ timeout: 30_000 })
    await row.getByRole('button', { name: '수정' }).click()

    const nameInput = row.getByPlaceholder('교육 지역명')
    await expect(nameInput).toBeVisible({ timeout: 10_000 })
    await nameInput.fill(next.name)

    if (next.active != null) {
      const label = next.active ? '사용' : '미사용'
      const radio = row.getByRole('radio', { name: label }).first()
      if ((await radio.count()) > 0) {
        await radio.check({ force: true }).catch(async () => {
          await row.getByText(label, { exact: true }).first().click()
        })
      } else {
        await row.getByText(label, { exact: true }).first().click()
      }
    }

    const patchWait = this.page
      .waitForResponse(res => isEducationRegionsApi(res, 'PATCH'), { timeout: 30_000 })
      .catch(() => null)

    await row.getByRole('button', { name: '저장' }).click()

    const patchRes = await patchWait
    let remoteOk = true
    if (patchRes) {
      remoteOk = patchRes.ok()
      if (!remoteOk) {
        const body = await patchRes.text().catch(() => '')
        throw new Error(
          `교육 지역 수정 API 실패: HTTP ${patchRes.status()} ${body.slice(0, 300)}`
        )
      }
    }

    const failAlert = this.page.getByRole('dialog').filter({ hasText: /저장 실패|등록 불가/ })
    if (await failAlert.isVisible().catch(() => false)) {
      const message = (
        await failAlert.locator('.ant-modal-body, p, [class*="content"]').first().innerText()
      ).trim()
      throw new Error(`교육 지역 수정 실패: ${message || '(메시지 없음)'}`)
    }

    const usage = next.active === false ? '미사용' : '사용'
    await this.filterByName(next.name, usage)
    await this.expectRowVisible(next.name)
    return { remoteOk: remoteOk && patchRes != null }
  }

  /**
   * Playwright 행의 드래그 핸들을 위/아래 행으로 이동.
   * 목록에 행이 2개 미만이면 false.
   */
  async reorderCreatedRow(name: string): Promise<{ moved: boolean; remoteOk: boolean }> {
    await this.setUsageFilter('사용')
    await this.setNameFilter('')
    await this.clickSearch()

    const rows = this.table().locator('tbody.ant-table-tbody tr.ant-table-row')
    await expect(rows.first()).toBeVisible({ timeout: 30_000 })

    const target = this.rowByName(name)
    await expect(target).toBeVisible({ timeout: 30_000 })

    const count = await rows.count()
    if (count < 2) {
      return { moved: false, remoteOk: false }
    }

    const targetIndex = await target.evaluate(el => {
      const tr = el.closest('tr') ?? el
      const parent = tr.parentElement
      if (!parent) return -1
      return Array.from(parent.children).indexOf(tr)
    })
    if (targetIndex < 0) {
      return { moved: false, remoteOk: false }
    }

    const neighborIndex = targetIndex === 0 ? 1 : targetIndex - 1
    const neighbor = rows.nth(neighborIndex)
    const handle = target.getByRole('button', { name: '순서 변경' })
    await expect(handle).toBeVisible({ timeout: 10_000 })

    const reorderWait = this.page
      .waitForResponse(
        res =>
          isEducationRegionsApi(res, 'PUT', /\/reorder$/) ||
          isEducationRegionsApi(res, 'PUT'),
        { timeout: 30_000 }
      )
      .catch(() => null)

    const handleBox = await handle.boundingBox()
    const neighborBox = await neighbor.boundingBox()
    if (!handleBox || !neighborBox) {
      return { moved: false, remoteOk: false }
    }

    await this.page.mouse.move(
      handleBox.x + handleBox.width / 2,
      handleBox.y + handleBox.height / 2
    )
    await this.page.mouse.down()
    await this.page.mouse.move(
      neighborBox.x + neighborBox.width / 2,
      neighborBox.y + neighborBox.height / 2,
      { steps: 12 }
    )
    await this.page.mouse.up()

    const reorderRes = await reorderWait
    const remoteOk = reorderRes != null && reorderRes.ok()
    await this.expectRowVisible(name)
    return { moved: true, remoteOk }
  }

  async deleteRegion(name: string): Promise<{ remoteOk: boolean }> {
    await this.filterByName(name, '사용')
    let row = this.rowByName(name)
    if ((await row.count()) === 0) {
      await this.filterByName(name, '미사용')
      row = this.rowByName(name)
    }
    await expect(row).toBeVisible({ timeout: 30_000 })
    await row.getByRole('button', { name: '삭제' }).click()

    const confirm = this.page.getByRole('dialog').filter({ hasText: '교육 지역 삭제' })
    await expect(confirm).toBeVisible({ timeout: 15_000 })

    const deleteWait = this.page
      .waitForResponse(res => isEducationRegionsApi(res, 'DELETE'), { timeout: 30_000 })
      .catch(() => null)

    await confirm.getByRole('button', { name: '교육 지역 삭제' }).click()

    const deleteRes = await deleteWait
    let remoteOk = true
    if (deleteRes) {
      remoteOk = deleteRes.ok()
      if (!remoteOk) {
        const body = await deleteRes.text().catch(() => '')
        throw new Error(
          `교육 지역 삭제 API 실패: HTTP ${deleteRes.status()} ${body.slice(0, 300)}`
        )
      }
    }

    const failAlert = this.page.getByRole('dialog').filter({ hasText: /삭제 실패|삭제 불가/ })
    if (await failAlert.isVisible().catch(() => false)) {
      const title = (await failAlert.locator('.ant-modal-title, [class*="title"]').first().innerText()).trim()
      if (title.includes('삭제 불가')) {
        throw new Error('교육 지역 삭제 불가(사용 이력) — Playwright 전용 행이 아닙니다.')
      }
      const message = (
        await failAlert.locator('.ant-modal-body, p, [class*="content"]').first().innerText()
      ).trim()
      throw new Error(`교육 지역 삭제 실패: ${message || '(메시지 없음)'}`)
    }

    await expect(confirm).toBeHidden({ timeout: 30_000 })
    await this.filterByName(name, '사용')
    await this.expectRowHidden(name)
    await this.filterByName(name, '미사용')
    await this.expectRowHidden(name)
    return { remoteOk: remoteOk && deleteRes != null }
  }
}
