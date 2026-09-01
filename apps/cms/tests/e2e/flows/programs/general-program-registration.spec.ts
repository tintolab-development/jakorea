import { test, expect } from '../../fixtures/test'
import {
  GeneralProgramRegistrationPage,
  REGISTRATION_CASES,
} from '../../pages/general-program-registration.page'
import { expectAuthenticatedShell } from '../../helpers/authenticated-shell'

/**
 * 일반 프로그램 신규 등록 E2E — 유형 8종을 동일 스크립트로 등록
 *
 * 케이스: 기관/개인 × 커리큘럼형/일정형 × 단일/복수
 * 제목: `Playwright 테스트({라벨})·{hash}`
 *
 * 각 케이스: 목록 → 신규 등록 → 공통/모집/신청 → 실 API 등록 → 목록 확인
 *
 * `serial` — 실 API 등록 부하·후원사 충돌을 줄이기 위해 순차 실행
 *
 * 전제: `auth.setup.ts` 세션 · `programs` 실 API · 후원사 목록 사용 가능
 * 스텁 없음 — 등록 API 실패 시 테스트 실패
 */
test.describe.configure({ mode: 'serial' })

test.describe('일반 프로그램 신규 등록', () => {
  for (const regCase of REGISTRATION_CASES) {
    test(`등록·목록: ${regCase.label}`, async ({ page }) => {
      test.setTimeout(360_000)

      await page.goto('/programs/general')
      await expectAuthenticatedShell(page)

      const registration = new GeneralProgramRegistrationPage(page, regCase)
      await expect(page.getByRole('button', { name: '프로그램 신규 등록' })).toBeVisible({
        timeout: 30_000,
      })
      await registration.openNewRegistration()
      await registration.fillCommonInfo()
      await registration.goToRecruitment()
      await registration.fillRecruitmentInfo()
      await registration.goToApplication()
      await registration.fillApplicationInfo()

      const created = await registration.completeRegistration()
      await expect(page.getByRole('button', { name: '프로그램 등록 완료' })).toBeHidden()
      expect(created.programId.length).toBeGreaterThan(0)
      expect(created.programTitle).toContain(`Playwright 테스트(${regCase.label})`)
      expect(created.caseLabel).toBe(regCase.label)

      await registration.expectProgramVisibleInList(created)
    })
  }
})
