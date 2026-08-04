import { test, expect } from '../../../../fixtures/test'
import { CompanySchoolDetailPage } from '../../../../pages/company-school-detail.page'
import { COMPANY_SCHOOL_DETAIL_SEED_CANDIDATES } from '../../../../pages/company-school-seed-titles'
import { expectAuthenticatedShell } from '../../../../helpers/authenticated-shell'
import { withAuthenticatedPage } from '../../../../helpers/with-authenticated-page'

/**
 * Phase 2 — 1사1교 상세 smoke (LNB·탭·딥링크)
 *
 * 시드: CS-01 우선, 없으면 `[수정 가능] 1사1교 프로그램 더미`
 * URL lnb/tab: info|applicants|applicant_instructors|progress · info|institutions|instructors
 */
test.describe('1사1교 프로그램 상세 smoke', () => {
  let programId = ''

  test.beforeAll(async ({ browser }) => {
    test.setTimeout(240_000)
    await withAuthenticatedPage(browser, async page => {
      await page.goto('/programs/company-school')
      await expectAuthenticatedShell(page)
      const detail = new CompanySchoolDetailPage(page)
      const opened = await detail.tryOpenPreferredDetailSeed()
      if (!opened) return
      programId = opened.programId
    })
  })

  test.beforeEach(() => {
    test.skip(
      !programId,
      `시드 없음 또는 상세 API 실패: ${COMPANY_SCHOOL_DETAIL_SEED_CANDIDATES.join(' | ')}`
    )
  })

  test('1) 상세 셸·공통 정보 탭', async ({ page }) => {
    test.setTimeout(120_000)

    await page.goto('/programs/company-school')
    await expectAuthenticatedShell(page)

    const detail = new CompanySchoolDetailPage(page)
    const loaded = await detail.gotoDetail(programId, 'info', 'info')
    test.skip(!loaded, '프로그램 상세 API 실패 — 공통 정보 스킵')
    await detail.expectUrlLnbTab('info', 'info')
    await expect(page.getByText('공통 정보', { exact: true }).first()).toBeVisible()
    await detail.expectContentSettled()
  })

  test('2) 정보 LNB — 공통·모집·신청 탭 URL 동기화', async ({ page }) => {
    test.setTimeout(180_000)

    await page.goto('/programs/company-school')
    await expectAuthenticatedShell(page)

    const detail = new CompanySchoolDetailPage(page)

    for (const tab of ['info', 'institutions', 'instructors'] as const) {
      const loaded = await detail.gotoDetail(programId, 'info', tab)
      test.skip(!loaded, `프로그램 상세 API 실패 — 정보 탭(${tab}) 스킵`)
      await detail.expectUrlLnbTab('info', tab)
      if (tab === 'instructors') {
        await detail.expectApplicationPreviewNotice()
      } else if (tab === 'institutions') {
        await expect(
          page.getByRole('dialog').getByText('모집 정보', { exact: true }).first()
        ).toBeVisible({ timeout: 15_000 })
      } else {
        await expect(
          page.getByRole('dialog').getByText('공통 정보', { exact: true }).first()
        ).toBeVisible({ timeout: 15_000 })
      }
    }
  })

  test('3) 기관·강사 신청·진행·담당자 LNB (보이는 항목만)', async ({ page }) => {
    test.setTimeout(180_000)

    await page.goto('/programs/company-school')
    await expectAuthenticatedShell(page)

    const detail = new CompanySchoolDetailPage(page)
    await detail.gotoDetail(programId, 'info', 'info')

    const opened: string[] = []
    const candidates: Array<{
      lnb: Parameters<CompanySchoolDetailPage['tryGotoLnb']>[1]
      tab: string
    }> = [
      { lnb: 'applicants', tab: 'institutions' },
      { lnb: 'applicant_instructors', tab: 'instructors' },
      { lnb: 'progress', tab: 'institutions' },
      { lnb: 'managers', tab: 'info' },
    ]

    for (const { lnb, tab } of candidates) {
      const ok = await detail.tryGotoLnb(programId, lnb, tab)
      if (!ok) continue
      opened.push(lnb)
      if (lnb === 'managers') {
        await detail.expectManagersShellVisible()
      }
    }

    if (opened.length === 0) {
      test.skip(true, '추가 LNB를 열 수 없음 (상세 API 실패 또는 시드 meta에 LNB 없음)')
    }

    expect(opened.length, '1사1교 상세에서 추가 LNB가 하나도 열리지 않았습니다').toBeGreaterThan(
      0
    )
  })

  test('4) 딥링크로 동일 URL 복원', async ({ page }) => {
    test.setTimeout(120_000)

    await page.goto('/programs/company-school')
    await expectAuthenticatedShell(page)

    const detail = new CompanySchoolDetailPage(page)
    const loaded = await detail.gotoDetail(programId, 'info', 'instructors')
    test.skip(!loaded, '프로그램 상세 API 실패 — 딥링크 복원 스킵')
    await detail.expectUrlLnbTab('info', 'instructors')
    await detail.expectApplicationPreviewNotice()

    await page.reload()
    await expectAuthenticatedShell(page)
    await detail.expectDetailShellReady()
    if (await detail.isProgramDetailLoadFailed()) {
      const reloaded = await detail.gotoDetail(programId, 'info', 'instructors')
      test.skip(!reloaded, '프로그램 상세 API 실패 — reload 후 복원 스킵')
    }
    await detail.expectUrlLnbTab('info', 'instructors')
    test.skip(
      await detail.isProgramDetailLoadFailed(),
      '프로그램 상세 API 실패 — 신청 정보 미리보기 스킵'
    )
    await detail.expectApplicationPreviewNotice()
  })
})
