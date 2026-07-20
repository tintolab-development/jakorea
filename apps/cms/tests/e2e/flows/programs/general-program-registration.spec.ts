import { test, expect } from '../../fixtures/test'
import {
  GeneralProgramRegistrationPage,
  type RegistrationCompleteResult,
} from '../../pages/general-program-registration.page'
import { expectAuthenticatedShell } from '../../helpers/authenticated-shell'

/**
 * 일반 프로그램 신규 등록 E2E — 두 단계로 분리
 *
 * 1) 등록: 목록 → 신규 등록 → 공통/모집/신청 작성 → 실 API 등록 완료
 * 2) 목록 확인: 등록 결과(programId·제목)로 목록에서 행 존재 검증
 *
 * `serial` — 2단계가 1단계 결과에 의존합니다.
 *
 * 전제: `auth.setup.ts` 세션 · `programs` 실 API · 후원사 목록 사용 가능
 * 스텁 없음 — 등록 API 실패 시 테스트 실패
 *
 * 백엔드 에러는 fixtures/test 가 자동으로 터미널·e2e-error-log-latest.json 에 남깁니다.
 */
test.describe.serial('일반 프로그램 신규 등록', () => {
  let created: RegistrationCompleteResult | undefined

  test('1) 프로그램 등록 완료', async ({ page }) => {
    test.setTimeout(360_000)

    await page.goto('/programs/general')
    await expectAuthenticatedShell(page)

    const registration = new GeneralProgramRegistrationPage(page)
    await expect(page.getByRole('button', { name: '프로그램 신규 등록' })).toBeVisible({
      timeout: 30_000,
    })
    await registration.openNewRegistration()
    await registration.fillCommonInfo()
    await registration.goToRecruitment()
    await registration.fillRecruitmentInfo()
    await registration.goToApplication()
    await registration.fillApplicationInfo()

    created = await registration.completeRegistration()
    await expect(page.getByRole('button', { name: '프로그램 등록 완료' })).toBeHidden()
    expect(created.programId.length).toBeGreaterThan(0)
    expect(created.programTitle.length).toBeGreaterThan(0)
  })

  test('2) 등록한 프로그램이 목록에 보인다', async ({ page }) => {
    test.setTimeout(120_000)

    expect(created, '1) 프로그램 등록 완료 결과가 필요합니다').toBeDefined()
    const result = created!

    await page.goto('/programs/general')
    await expectAuthenticatedShell(page)

    const registration = new GeneralProgramRegistrationPage(page)
    await registration.expectProgramVisibleInList(result)
  })
})
