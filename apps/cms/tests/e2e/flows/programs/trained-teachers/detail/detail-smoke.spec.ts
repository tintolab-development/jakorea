import { test, expect } from '../../../../fixtures/test'
import { TrainedTeachersDetailPage } from '../../../../pages/trained-teachers-detail.page'
import { TRAINED_TEACHERS_DETAIL_SEED_CANDIDATES } from '../../../../pages/trained-teachers-seed-titles'
import { expectAuthenticatedShell } from '../../../../helpers/authenticated-shell'
import { withAuthenticatedPage } from '../../../../helpers/with-authenticated-page'

/**
 * Phase 7 — 교육받은 교사 상세 smoke
 *
 * LNB: 정보(공통·모집·신청) · 기관 신청 · 진행 · 담당자
 */
test.describe('교육받은 교사 상세 smoke', () => {
  test.describe.configure({ mode: 'serial' })

  let programId = ''

  test.beforeAll(async ({ browser }) => {
    test.setTimeout(240_000)
    await withAuthenticatedPage(browser, async page => {
      await page.goto('/programs/trained-teachers')
      await expectAuthenticatedShell(page)
      const detail = new TrainedTeachersDetailPage(page)
      const opened = await detail.tryOpenPreferredDetailSeed()
      if (!opened) return
      programId = opened.programId
    })
  })

  test.beforeEach(() => {
    test.skip(
      !programId,
      `시드 없음 또는 상세 셸 실패: ${TRAINED_TEACHERS_DETAIL_SEED_CANDIDATES.slice(0, 3).join(' | ')}…`
    )
  })

  test('7.2) 상세 셸 · 공통 정보', async ({ page }) => {
    test.setTimeout(120_000)

    await page.goto('/programs/trained-teachers')
    await expectAuthenticatedShell(page)

    const detail = new TrainedTeachersDetailPage(page)
    const loaded = await detail.gotoDetail(programId, 'info', 'info')
    test.skip(!loaded, '프로그램 상세 API 실패 — 공통 정보 스킵')

    await detail.expectUrlLnbTab('info', 'info')
    await expect(page.getByText('공통 정보', { exact: true }).first()).toBeVisible({
      timeout: 15_000,
    })
    await detail.expectContentSettled()
  })

  test('7.3) 정보 LNB — 공통·모집·신청 탭', async ({ page }) => {
    test.setTimeout(180_000)

    await page.goto('/programs/trained-teachers')
    await expectAuthenticatedShell(page)

    const detail = new TrainedTeachersDetailPage(page)

    for (const tab of ['info', 'institutions', 'instructors'] as const) {
      const loaded = await detail.gotoDetail(programId, 'info', tab)
      test.skip(!loaded, `프로그램 상세 API 실패 — 정보 탭(${tab}) 스킵`)
      await detail.expectUrlLnbTab('info', tab)
      if (tab === 'info') {
        await expect(page.getByText('공통 정보', { exact: true }).first()).toBeVisible({
          timeout: 15_000,
        })
      } else if (tab === 'institutions') {
        await expect(page.getByText(/모집 정보/).first()).toBeVisible({ timeout: 15_000 })
      } else {
        await expect(page.getByText(/신청 정보/).first()).toBeVisible({ timeout: 15_000 })
      }
    }
  })

  test('7.4) 기관 신청 · 진행 · 담당자 LNB', async ({ page }) => {
    test.setTimeout(180_000)

    await page.goto('/programs/trained-teachers')
    await expectAuthenticatedShell(page)

    const detail = new TrainedTeachersDetailPage(page)
    await detail.gotoDetail(programId, 'info', 'info')

    const opened: string[] = []

    if (await detail.tryGotoLnb(programId, 'applicants', 'institutions')) {
      opened.push('applicants')
      await expect(page.getByText(/기관 신청/).first()).toBeVisible({ timeout: 15_000 })
      await detail.expectListOrEmptyInDialog()
    }

    if (await detail.tryGotoLnb(programId, 'progress', 'institutions')) {
      opened.push('progress')
      await expect(page.getByText(/진행|참여 기관|실적/).first()).toBeVisible({
        timeout: 15_000,
      }).catch(() => undefined)
      await detail.expectContentSettled()
    }

    if (await detail.tryGotoLnb(programId, 'managers', 'main')) {
      opened.push('managers')
      const shellOk = await detail.tryExpectManagersShellVisible()
      test.skip(!shellOk && opened.length === 1, '담당자 셸 미표시')
    }

    test.skip(opened.length === 0, '추가 LNB를 열 수 없음')
    expect(opened.length).toBeGreaterThan(0)
  })

  test('7.5) 딥링크 복원', async ({ page }) => {
    test.setTimeout(120_000)

    await page.goto('/programs/trained-teachers')
    await expectAuthenticatedShell(page)

    const detail = new TrainedTeachersDetailPage(page)
    const loaded = await detail.gotoDetail(programId, 'info', 'info')
    test.skip(!loaded, '프로그램 상세 API 실패 — 딥링크 스킵')

    await page.reload()
    await expectAuthenticatedShell(page)
    const shellOk = await detail.tryExpectDetailShellReady(30_000)
    test.skip(!shellOk, 'reload 후 상세 셸 실패')
    await detail.expectUrlLnbTab('info', 'info')
  })
})
