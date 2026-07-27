import { test, expect } from '../../fixtures/test'
import {
  CompanySchoolRegistrationPage,
  type CompanySchoolRegistrationCompleteResult,
} from '../../pages/company-school-registration.page'
import { expectAuthenticatedShell } from '../../helpers/authenticated-shell'

/**
 * 1사1교 프로그램 신규 등록 E2E
 *
 * 고정: 학교/기관 × 커리큘럼형 × 단일 회차 · 봉사자 없음
 * 제목: `Playwright 1사1교 테스트·{hash}`
 *
 * 1) 등록 완료 → 2) 목록 확인 (`serial`)
 *
 * 전제: auth.setup 세션 · programs 실 API · 후원사 목록
 * 스텁 없음 — 등록 API 실패 시 테스트 실패
 */
test.describe.configure({ mode: 'serial' })

test.describe('1사1교 프로그램 신규 등록', () => {
  let registration: CompanySchoolRegistrationPage | undefined
  let created: CompanySchoolRegistrationCompleteResult | undefined

  test('1) 등록 완료', async ({ page }) => {
    test.setTimeout(360_000)

    await page.goto('/programs/company-school')
    await expectAuthenticatedShell(page)

    registration = new CompanySchoolRegistrationPage(page)
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
    expect(created.programTitle).toContain('Playwright 1사1교 테스트')
  })

  test('2) 목록 확인', async ({ page }) => {
    test.setTimeout(180_000)

    expect(created, '1) 등록 완료 결과가 필요합니다').toBeDefined()
    registration = new CompanySchoolRegistrationPage(page)
    // 제목은 1)에서 생성한 고유 title을 써야 하므로 complete 결과만 사용
    await registration.expectProgramVisibleInList(created!)
  })
})
