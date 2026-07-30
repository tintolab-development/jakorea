import { test } from '../../../../fixtures/test'
import { CompanySchoolDetailPage } from '../../../../pages/company-school-detail.page'
import { COMPANY_SCHOOL_DETAIL_SEED_CANDIDATES } from '../../../../pages/company-school-seed-titles'
import { expectAuthenticatedShell } from '../../../../helpers/authenticated-shell'

/**
 * Phase 2 — 1사1교 LNB 격리
 *
 * 봉사자·합반·과제·개인 progress(출석/게시글) LNB가 없어야 함.
 * 기관·강사 신청 · 진행(참여 기관/강사)는 노출.
 *
 * @see apps/cms/docs/api/be-handoff-program-dummy-seeds/02-company-school-dummy-seed.md §2
 */
test.describe('1사1교 프로그램 LNB 격리', () => {
  test('2.1) 기관·강사 LNB 있음 · 봉사자 LNB 없음', async ({ page }) => {
    test.setTimeout(180_000)
    await page.goto('/programs/company-school')
    await expectAuthenticatedShell(page)

    const detail = new CompanySchoolDetailPage(page)
    const opened = await detail.tryOpenPreferredDetailSeed()
    test.skip(!opened, `시드 없음 또는 상세 API 실패: ${COMPANY_SCHOOL_DETAIL_SEED_CANDIDATES.join(' | ')}`)

    await detail.expectLnbVisible(/기관 신청 목록/)
    await detail.expectLnbVisible(/강사 신청 목록/)
    await detail.expectLnbHidden(/봉사자 신청/)
    await detail.expectLnbHidden(/참여자 신청 목록/)
  })

  test('2.2) 진행 — 참여 기관·강사만 · 봉사·출석·과제·게시글 없음', async ({ page }) => {
    test.setTimeout(180_000)
    await page.goto('/programs/company-school')
    await expectAuthenticatedShell(page)

    const detail = new CompanySchoolDetailPage(page)
    const opened = await detail.tryOpenPreferredDetailSeed()
    test.skip(!opened, `시드 없음 또는 상세 API 실패: ${COMPANY_SCHOOL_DETAIL_SEED_CANDIDATES.join(' | ')}`)

    await detail.expectProgressTabLabels({
      mustHave: ['참여 기관', '참여 강사'],
      mustNotHave: ['참여 봉사자', '출석 관리', '과제 관리', '게시글', '참여자'],
    })
  })

  test('2.3) 합반·과제 UI 문구 상세 셸에 없음', async ({ page }) => {
    test.setTimeout(180_000)
    await page.goto('/programs/company-school')
    await expectAuthenticatedShell(page)

    const detail = new CompanySchoolDetailPage(page)
    const opened = await detail.tryOpenPreferredDetailSeed()
    test.skip(!opened, `시드 없음 또는 상세 API 실패: ${COMPANY_SCHOOL_DETAIL_SEED_CANDIDATES.join(' | ')}`)

    const loaded = await detail.gotoDetail(opened!.programId, 'progress', 'institutions')
    test.skip(!loaded, '프로그램 상세 API 실패 — 합반/과제 부재 스킵')

    await detail.expectLnbHidden(/합반/)
    await detail.expectLnbHidden(/과제 관리/)
    await detail.expectProgressTabLabels({
      mustNotHave: ['과제 관리', '합반'],
    })
  })
})
