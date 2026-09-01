import { test, expect } from '../../fixtures/test'

/**
 * 회귀 방지: 풀페이지 상세는 **모달 인스턴스 하나**로 열려야 한다.
 *
 * 과거 증상 — 상세 GET 대기 중 별도 `DetailFullPageModal`(로딩 셸)을 렌더하고 응답 후
 * `UserDetailFullPageModal`로 교체해, antd 포털이 갈리면서 오픈 애니메이션이 두 번 재생됐다
 * (모달이 두 번 열리는 것처럼 깜빡임).
 *
 * 같은 커밋에서 unmount+mount 되면 개수는 1로 유지되므로, 엘리먼트 **신원**을 스탬프로 추적한다.
 */

type PortalWindow = Window & { __modalRoots?: string[] }

async function trackModalPortals(page: import('@playwright/test').Page) {
  await page.addInitScript(() => {
    const w = window as PortalWindow
    w.__modalRoots = []
    let seq = 0
    const tick = () => {
      document.querySelectorAll('.ant-modal-root').forEach(node => {
        const root = node as HTMLElement
        if (root.dataset.portalStamp) return
        seq += 1
        root.dataset.portalStamp = String(seq)
        w.__modalRoots!.push(`modal-root#${seq}`)
      })
      requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  })
}

function readModalRoots(page: import('@playwright/test').Page) {
  return page.evaluate(() => (window as PortalWindow).__modalRoots ?? [])
}

test.describe('풀페이지 상세 — 모달 포털 1개', () => {
  test('권한 승인 목록 행 클릭 시 모달 포털이 한 번만 생성된다', async ({ page }) => {
    test.setTimeout(120_000)
    await trackModalPortals(page)

    await page.goto('/admin/permission-requests')
    await expect(page.locator('tr.ant-table-row').first()).toBeVisible({ timeout: 60_000 })

    await page.locator('tr.ant-table-row').first().click()
    const detail = page.getByRole('dialog').first()
    await expect(detail).toBeVisible({ timeout: 30_000 })
    await expect(page).toHaveURL(/pr_detail_user=/)

    // 상세 GET 응답 후 스피너가 같은 모달 안에서 사라진다
    await expect(page.locator('.detail-fullpage-modal__loading')).toHaveCount(0, {
      timeout: 30_000,
    })
    await expect(detail.getByText(/신청 상세/).first()).toBeVisible()

    expect(await readModalRoots(page)).toEqual(['modal-root#1'])
  })

  test('회원 목록 행 클릭 시 모달 포털이 한 번만 생성된다', async ({ page }) => {
    test.setTimeout(120_000)
    await trackModalPortals(page)

    await page.goto('/users/list?kind=all')
    await expect(page.locator('tr.ant-table-row').first()).toBeVisible({ timeout: 60_000 })

    await page.locator('tr.ant-table-row').first().click()
    await expect(page.getByRole('dialog').first()).toBeVisible({ timeout: 30_000 })
    await expect(page.locator('.detail-fullpage-modal__loading')).toHaveCount(0, {
      timeout: 30_000,
    })

    expect(await readModalRoots(page)).toEqual(['modal-root#1'])
  })
})
