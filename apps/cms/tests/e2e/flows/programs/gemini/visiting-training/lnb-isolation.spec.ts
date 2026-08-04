import { test } from '../../../../fixtures/test'
import { GeminiVisitingTrainingPage } from '../../../../pages/gemini-visiting-training.page'
import {
  GEMINI_APPROVED_INSTITUTION_CANDIDATES,
  GEMINI_VISITING_FEATURED_CANDIDATES,
} from '../../../../pages/gemini-seed-titles'
import { expectAuthenticatedShell } from '../../../../helpers/authenticated-shell'

/**
 * Phase 5 — Gemini 찾아가는 연수 LNB 격리
 *
 * 모집 상세: 기관 신청 있음 · 봉사자/교육진행/설문/UJAT 전용 없음
 * 승인 상세: 강사 신청 있음 · 기관 신청·봉사자 없음
 */
test.describe('Gemini 찾아가는 연수 LNB 격리', () => {
  test('5.11) 모집 상세 — 기관 있음 · 봉사·교육진행·설문 없음', async ({ page }) => {
    test.setTimeout(180_000)

    await page.goto('/programs/gemini/visiting-training')
    await expectAuthenticatedShell(page)

    const vt = new GeminiVisitingTrainingPage(page)
    const opened = await vt.tryOpenPreferredRecruitmentSeed()
    test.skip(
      !opened,
      `모집 시드 없음: ${GEMINI_VISITING_FEATURED_CANDIDATES.join(' | ')}`
    )

    await vt.expectRecruitmentLnbVisible(/프로그램 모집 정보|모집 정보/)
    await vt.expectRecruitmentLnbVisible(/기관 신청/)
    await vt.expectRecruitmentLnbVisible(/담당자/)
    await vt.expectRecruitmentLnbHidden(/봉사자/)
    await vt.expectRecruitmentLnbHidden(/교육 진행/)
    await vt.expectRecruitmentLnbHidden(/설문/)
    await vt.expectRecruitmentLnbHidden(/참여자 신청/)
  })

  test('5.12) 승인 상세 — 강사 있음 · 기관·봉사 없음', async ({ page }) => {
    test.setTimeout(180_000)

    await page.goto('/programs/gemini/visiting-training?tab=approved')
    await expectAuthenticatedShell(page)

    const vt = new GeminiVisitingTrainingPage(page)
    const opened = await vt.tryOpenPreferredApprovedSeed()
    test.skip(
      !opened,
      `승인 시드 없음: ${GEMINI_APPROVED_INSTITUTION_CANDIDATES.join(' | ')}`
    )

    await vt.expectApprovedLnbVisible(/프로그램 정보/)
    await vt.expectApprovedLnbVisible(/강사 신청/)
    await vt.expectApprovedLnbVisible(/담당자/)
    await vt.expectApprovedLnbHidden(/기관 신청/)
    await vt.expectApprovedLnbHidden(/봉사자/)
    await vt.expectApprovedLnbHidden(/교육 진행/)
  })
})
