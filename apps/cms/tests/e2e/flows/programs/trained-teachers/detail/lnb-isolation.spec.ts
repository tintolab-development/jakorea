import { test } from '../../../../fixtures/test'
import { TrainedTeachersDetailPage } from '../../../../pages/trained-teachers-detail.page'
import { TRAINED_TEACHERS_DETAIL_SEED_CANDIDATES } from '../../../../pages/trained-teachers-seed-titles'
import { expectAuthenticatedShell } from '../../../../helpers/authenticated-shell'

/**
 * Phase 7 — 교육받은 교사 LNB 격리
 *
 * 있음: 기관 신청 · 진행
 * 없음: 강사 신청 · 봉사자
 *
 * @see apps/cms/docs/api/be-handoff-program-dummy-seeds/04-trained-teachers-dummy-seed.md
 */
test.describe('교육받은 교사 LNB 격리', () => {
  test('7.6) 기관·진행 있음 · 강사·봉사 없음', async ({ page }) => {
    test.setTimeout(180_000)

    await page.goto('/programs/trained-teachers')
    await expectAuthenticatedShell(page)

    const detail = new TrainedTeachersDetailPage(page)
    const opened = await detail.tryOpenPreferredDetailSeed()
    test.skip(
      !opened,
      `시드 없음: ${TRAINED_TEACHERS_DETAIL_SEED_CANDIDATES.slice(0, 2).join(' | ')}`
    )

    await detail.expectLnbVisible(/기관 신청/)
    await detail.expectLnbVisible(/프로그램 진행 현황|진행 현황/)
    await detail.expectLnbVisible(/담당자/)
    await detail.expectLnbHidden(/강사 신청 목록/)
    await detail.expectLnbHidden(/봉사자/)
    await detail.expectLnbHidden(/참여자 신청/)
  })
})
