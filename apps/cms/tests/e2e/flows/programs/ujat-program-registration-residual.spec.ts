import { test, expect } from '../../fixtures/test'
import type { Page } from '@playwright/test'
import { expectAuthenticatedShell } from '../../helpers/authenticated-shell'
import { clickRegistrationTabIfVisible } from '../../pages/form-helpers'
import { UjatProgramRegistrationPage } from '../../pages/ujat-program-registration.page'

test.describe.configure({ mode: 'serial' })

async function openAutofilledRegistration(page: Page) {
  await page.goto('/programs/ujat')
  await expectAuthenticatedShell(page)
  const registration = new UjatProgramRegistrationPage(page)
  await expect(page.getByRole('button', { name: /신규 등록/ })).toBeVisible({ timeout: 30_000 })
  await registration.openNewRegistration()
  await registration.fillCommonInfo()
  await registration.goToRecruitment()
  await registration.fillRecruitmentInfo()
  return registration
}

async function closeRequiredAlert(page: Page) {
  const alert = page.getByText(/입력되지 않은 필수 항목이 있습니다\./).first()
  await expect(alert).toBeVisible({ timeout: 10_000 })
  const dialog = page.getByRole('dialog').filter({ hasText: /입력되지 않은 필수 항목이 있습니다\./ })
  await dialog.getByRole('button', { name: '확인' }).click()
  await expect(alert).toBeHidden({ timeout: 10_000 })
}

test.describe('UJAT 신규 등록 잔여 검증', () => {
  test('REG-03/04/05 + REG-12 — 단계 gate와 동적 신청 필드', async ({ page }) => {
    test.setTimeout(360_000)
    const registration = await openAutofilledRegistration(page)

    // 참여기관 모집만 비우면 신청정보 단계로 이동할 수 없어야 한다.
    await clickRegistrationTabIfVisible(page, '참여자 모집 정보')
    await clickRegistrationTabIfVisible(page, '참여 기관 모집 정보')
    const institutionNotes = page
      .locator('.detail-info-form__field')
      .filter({ hasText: /^비고/ })
      .locator('input:not([type="checkbox"])')
      .first()
    await expect(institutionNotes).toBeVisible({ timeout: 15_000 })
    await institutionNotes.fill('')
    await page.getByRole('button', { name: '신청 정보 작성하기' }).click()
    await closeRequiredAlert(page)
    await institutionNotes.fill('-')

    // 상반기·하반기 봉사자 모집도 각각 독립 gate로 검사한다.
    for (const [tab, expectedKey] of [
      ['상반기 봉사자 모집 정보', '상반기'],
      ['하반기 봉사자 모집 정보', '하반기'],
    ] as const) {
      await clickRegistrationTabIfVisible(page, tab)
      const activityTerm = page.getByPlaceholder('활동 기수').first()
      await expect(activityTerm).toBeVisible({ timeout: 15_000 })
      const before = await activityTerm.inputValue()
      await activityTerm.fill('')
      await page.getByRole('button', { name: '신청 정보 작성하기' }).click()
      await closeRequiredAlert(page)
      await expect(page.getByText(expectedKey, { exact: false }).first()).toBeVisible()
      await activityTerm.fill(before || '8')
    }

    await registration.goToApplication()
    await clickRegistrationTabIfVisible(page, '참여 기관 신청 정보')

    // REG-12: 학급 수 증감은 DOM과 현재 overlay에 남는 visible 값 모두 일치해야 한다.
    const classCount = page.getByPlaceholder('총 학급 수').first()
    await expect(classCount).toBeVisible({ timeout: 15_000 })
    await classCount.fill('3')
    const studentCounts = page.locator('input[placeholder="학생 수"]')
    await expect(studentCounts).toHaveCount(3)
    for (const [index, value] of ['21', '22', '23'].entries()) {
      await studentCounts.nth(index).scrollIntoViewIfNeeded()
      await studentCounts.nth(index).fill(value, { force: true })
    }
    await classCount.fill('5')
    await expect(studentCounts).toHaveCount(5)
    await classCount.fill('2')
    await expect(studentCounts).toHaveCount(2)
    await expect(studentCounts.nth(0)).toHaveValue('21')
    await expect(studentCounts.nth(1)).toHaveValue('22')

    // REG-13은 신청 학년 선택값을 직접 구성해야 하므로 동적 overlay 단위 테스트에서
    // 동일 학년 disabled/해제 후 재선택을 검증한다.

    // REG-14는 공통정보 overlay의 실제 반기 일정·불가일 제외 규칙을
    // 동적 필드 단위 테스트에서 검증한다.

    await clickRegistrationTabIfVisible(page, '봉사자 신청 정보')

    // REG-16: 지원 경로 기타 입력의 enabled/disabled 전환은
    // UJAT 봉사자 신청 visibility 단위 테스트에서 검증한다.

    // REG-18은 모집 overlay의 활동 기수 치환 규칙을 단위 테스트에서 검증한다.
  })

  test('REG-20 — 임시저장 후 닫았다가 같은 브라우저에서 값 복원', async ({ page }) => {
    test.setTimeout(360_000)
    const registration = await openAutofilledRegistration(page)
    await registration.goToApplication()
    await clickRegistrationTabIfVisible(page, '참여 기관 신청 정보')
    const address = page.getByPlaceholder('교구재 등 택배 발송을 위한 정확한 주소를 입력해 주세요')
    await address.fill('UJAT draft restore address')
    await address.press('Tab')
    await expect(address).toHaveValue('UJAT draft restore address')
    await page.getByRole('button', { name: '임시저장' }).click()
    await expect(page.getByRole('dialog').filter({ hasText: '임시 저장 완료' })).toBeVisible({
      timeout: 20_000,
    })
    await page.getByRole('dialog').filter({ hasText: '임시 저장 완료' }).getByRole('button', { name: '확인' }).click()
    await page.getByRole('button', { name: '닫기' }).first().click()
    await expect(page.getByRole('button', { name: /신규 등록/ })).toBeVisible({ timeout: 20_000 })
    await page.getByRole('button', { name: /신규 등록/ }).click()
    const notice = page.getByRole('dialog').filter({ hasText: '임시 저장 이력 안내' })
    await expect(notice).toBeVisible({ timeout: 20_000 })
    await notice.getByRole('radio', { name: '이어서 작성' }).check()
    await notice.getByRole('button', { name: '이어서 작성' }).click()
    await expect(page.getByText('UJAT 프로그램 등록', { exact: true })).toBeVisible({
      timeout: 30_000,
    })
    await expect(page).toHaveURL(/ujatStep=application-ujat-/)
    await expect(page.getByPlaceholder('교구재 등 택배 발송을 위한 정확한 주소를 입력해 주세요')).toHaveValue(
      'UJAT draft restore address'
    )
  })

  test('REG-25 — 첫 등록 HTTP 500 후 작성값 유지·재시도 성공', async ({ page }) => {
    test.setTimeout(360_000)
    const registration = await openAutofilledRegistration(page)
    await registration.goToApplication()
    await registration.fillApplicationInfo()

    let firstCreate = true
    await page.route('**/api/admin/programs', async route => {
      if (route.request().method() !== 'POST' || !firstCreate) {
        await route.continue()
        return
      }
      firstCreate = false
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'E2E forced registration failure' }),
      })
    })

    await page.getByRole('button', { name: '프로그램 등록 완료' }).click()
    await expect(page.getByText('프로그램 등록 실패', { exact: true })).toBeVisible({
      timeout: 30_000,
    })
    await page.getByRole('button', { name: /확인|닫기/ }).last().click().catch(() => undefined)
    await expect(page.getByRole('button', { name: '프로그램 등록 완료' })).toBeEnabled()
    await expect(page.getByPlaceholder('교구재 등 택배 발송을 위한 정확한 주소를 입력해 주세요')).toHaveValue(
      '서울시 중구 JA Korea UJAT 신청 기관 상세 주소'
    )

    const created = await registration.completeRegistration()
    expect(created.programId.length).toBeGreaterThan(0)
  })
})
