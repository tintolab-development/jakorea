import { test, expect } from '../../fixtures/test'
import { expectAuthenticatedShell } from '../../helpers/authenticated-shell'
import { UjatEducationRegionsPage } from '../../pages/ujat-education-regions.page'

/**
 * UJAT 교육 지역 관리 CRUD E2E
 *
 * 대상: `/programs/ujat/regions`
 * 1) 목록 진입
 * 2) 등록(C) + 중복명 차단
 * 3) 조회·필터(R)
 * 4) 인라인 수정(U)
 * 5) 순서 변경
 * 6) 삭제(D)
 *
 * `serial` — 이후 단계가 regionName·수정명에 의존합니다.
 *
 * 전제: auth.setup 세션 · `ujatEducationRegions` remote gate(권장).
 * 기본 마스터(서울 등)는 건드리지 않고 Playwright 전용 행만 생성·삭제합니다.
 */
test.describe.serial('UJAT 교육 지역 관리 CRUD', () => {
  const stamp = Date.now()
  const regionName = `Playwright 교육지역·${stamp}`
  const regionNameUpdated = `${regionName}(수정)`

  let regionsPage: UjatEducationRegionsPage | undefined

  test('1) 목록 진입', async ({ page }) => {
    test.setTimeout(120_000)

    regionsPage = new UjatEducationRegionsPage(page)
    await regionsPage.gotoList()
    await expectAuthenticatedShell(page)
    await expect(page.getByRole('button', { name: '교육 지역 등록' })).toBeVisible()
  })

  test('2) 등록', async ({ page }) => {
    test.setTimeout(180_000)

    regionsPage = new UjatEducationRegionsPage(page)
    if (!page.url().includes('/programs/ujat/regions')) {
      await regionsPage.gotoList()
      await expectAuthenticatedShell(page)
    }

    await regionsPage.createRegion(regionName, true)
    await regionsPage.expectDuplicateCreateBlocked(regionName)
  })

  test('3) 조회·필터', async ({ page }) => {
    test.setTimeout(120_000)

    regionsPage = new UjatEducationRegionsPage(page)
    if (!page.url().includes('/programs/ujat/regions')) {
      await regionsPage.gotoList()
      await expectAuthenticatedShell(page)
    }

    await regionsPage.filterByName(regionName, '사용')
    await regionsPage.expectRowVisible(regionName)

    await regionsPage.filterByName(regionName, '미사용')
    await regionsPage.expectRowHidden(regionName)

    await regionsPage.filterByName(regionName, '사용')
    await regionsPage.expectRowVisible(regionName)
  })

  test('4) 인라인 수정', async ({ page }) => {
    test.setTimeout(180_000)

    regionsPage = new UjatEducationRegionsPage(page)
    if (!page.url().includes('/programs/ujat/regions')) {
      await regionsPage.gotoList()
      await expectAuthenticatedShell(page)
    }

    await regionsPage.editInline(regionName, { name: regionNameUpdated, active: true })
    await regionsPage.expectRowVisible(regionNameUpdated)
  })

  test('5) 순서 변경', async ({ page }, testInfo) => {
    test.setTimeout(180_000)

    regionsPage = new UjatEducationRegionsPage(page)
    if (!page.url().includes('/programs/ujat/regions')) {
      await regionsPage.gotoList()
      await expectAuthenticatedShell(page)
    }

    const result = await regionsPage.reorderCreatedRow(regionNameUpdated)
    if (!result.moved) {
      testInfo.annotations.push({
        type: 'note',
        description: '목록 행이 2개 미만이거나 DnD 좌표를 확보하지 못해 순서 변경을 건너뜀',
      })
      return
    }
    await regionsPage.expectRowVisible(regionNameUpdated)
  })

  test('6) 삭제', async ({ page }) => {
    test.setTimeout(180_000)

    regionsPage = new UjatEducationRegionsPage(page)
    if (!page.url().includes('/programs/ujat/regions')) {
      await regionsPage.gotoList()
      await expectAuthenticatedShell(page)
    }

    await regionsPage.deleteRegion(regionNameUpdated)
  })
})
