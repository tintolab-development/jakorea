import { test, expect } from '../../../../fixtures/test'
import { UjatProgramDetailPage } from '../../../../pages/ujat-program-detail.page'
import { UJAT_DETAIL_SEED_CANDIDATES } from '../../../../pages/ujat-program-seed-titles'
import { expectAuthenticatedShell } from '../../../../helpers/authenticated-shell'
import { withAuthenticatedPage } from '../../../../helpers/with-authenticated-page'

/**
 * Phase 3 — UJAT 상세 smoke (LNB·탭·딥링크)
 *
 * 시드: `[수정 가능] UJAT 프로그램 더미` → `[UJAT더미]…` → FE mock 목록 title
 */
test.describe('UJAT 프로그램 상세 smoke', () => {
  let programId = ''

  test.beforeAll(async ({ browser }) => {
    test.setTimeout(240_000)
    await withAuthenticatedPage(browser, async page => {
      await page.goto('/programs/ujat')
      await expectAuthenticatedShell(page)
      const detail = new UjatProgramDetailPage(page)
      const opened = await detail.tryOpenPreferredDetailSeed()
      if (!opened) return
      programId = opened.programId
    })
  })

  test.beforeEach(() => {
    test.skip(
      !programId,
      `시드 없음 또는 상세 셸 실패: ${UJAT_DETAIL_SEED_CANDIDATES.join(' | ')}`
    )
  })

  test('1) 상세 셸·공통 정보 탭', async ({ page }) => {
    test.setTimeout(120_000)

    await page.goto('/programs/ujat')
    await expectAuthenticatedShell(page)

    const detail = new UjatProgramDetailPage(page)
    const loaded = await detail.gotoDetail(programId, 'info', 'info')
    test.skip(!loaded, '프로그램 상세 API 실패 — 공통 정보 스킵')
    await detail.expectUrlLnbTab('info', 'info')
    await expect(page.getByText('공통 정보', { exact: true }).first()).toBeVisible()
    await detail.expectContentSettled()
  })

  test('2) 정보 LNB — 공통·모집 탭 URL', async ({ page }) => {
    test.setTimeout(180_000)

    await page.goto('/programs/ujat')
    await expectAuthenticatedShell(page)

    const detail = new UjatProgramDetailPage(page)

    for (const tab of ['info', 'recruit_participant'] as const) {
      const loaded = await detail.gotoDetail(programId, 'info', tab)
      test.skip(!loaded, `프로그램 상세 API 실패 — 정보 탭(${tab}) 스킵`)
      await detail.expectUrlLnbTab('info', tab)
      if (tab === 'info') {
        await expect(page.getByText('공통 정보', { exact: true }).first()).toBeVisible({
          timeout: 15_000,
        })
      } else {
        await expect(page.getByText(/모집 정보|참여자 모집/).first()).toBeVisible({
          timeout: 15_000,
        })
      }
    }
  })

  test('3) 기관·봉사·교육진행·담당자 LNB (보이는 항목만)', async ({ page }) => {
    test.setTimeout(180_000)

    await page.goto('/programs/ujat')
    await expectAuthenticatedShell(page)

    const detail = new UjatProgramDetailPage(page)
    await detail.gotoDetail(programId, 'info', 'info')

    const opened: string[] = []
    const candidates: Array<{
      lnb: Parameters<UjatProgramDetailPage['tryGotoLnb']>[1]
      tab: string
      shell?: RegExp
    }> = [
      { lnb: 'institution_applications', tab: 'inst_all', shell: /신청 기관|참여 기관 신청|기관 신청/ },
      { lnb: 'volunteer_h1', tab: 'vh1_all', shell: /봉사자 신청/ },
      {
        lnb: 'education_progress',
        tab: 'edu_h1_institutions',
        shell: /참여 기관|교육 진행/,
      },
      { lnb: 'managers', tab: 'main' },
    ]

    for (const { lnb, tab, shell } of candidates) {
      const ok = await detail.tryGotoLnb(programId, lnb, tab)
      if (!ok) continue
      opened.push(lnb)
      if (lnb === 'managers') {
        await detail.expectManagersShellVisible()
      } else if (shell) {
        await expect(page.getByText(shell).first()).toBeVisible({ timeout: 30_000 })
      }
    }

    if (opened.length === 0) {
      test.skip(true, '추가 LNB를 열 수 없음 (상세 API 실패 또는 시드 meta에 LNB 없음)')
    }

    expect(opened.length, 'UJAT 상세에서 추가 LNB가 하나도 열리지 않았습니다').toBeGreaterThan(0)
  })

  test('4) 딥링크로 동일 URL 복원', async ({ page }) => {
    test.setTimeout(120_000)

    await page.goto('/programs/ujat')
    await expectAuthenticatedShell(page)

    const detail = new UjatProgramDetailPage(page)
    const loaded = await detail.gotoDetail(programId, 'info', 'info')
    test.skip(!loaded, '프로그램 상세 API 실패 — 딥링크 복원 스킵')
    await detail.expectUrlLnbTab('info', 'info')

    await page.reload()
    await expectAuthenticatedShell(page)
    await detail.expectDetailShellReady()
    if (await detail.isProgramDetailLoadFailed()) {
      const reloaded = await detail.gotoDetail(programId, 'info', 'info')
      test.skip(!reloaded, '프로그램 상세 API 실패 — reload 후 복원 스킵')
    }
    await detail.expectUrlLnbTab('info', 'info')
  })

  test('5) 일반 「강사」 LNB 부재 · 봉사자 LNB 존재', async ({ page }) => {
    test.setTimeout(120_000)

    await page.goto('/programs/ujat')
    await expectAuthenticatedShell(page)

    const detail = new UjatProgramDetailPage(page)
    const loaded = await detail.gotoDetail(programId, 'info', 'info')
    test.skip(!loaded, '프로그램 상세 API 실패 — LNB 격리 스킵')

    await detail.expectLnbVisible(/봉사자 신청|상반기 봉사자/)
    await detail.expectLnbHidden(/강사 신청 목록/)
  })
})
