import { test, expect } from '../../fixtures/test'
import {
  EDITABLE_DUMMY_TITLE,
  GeneralProgramEditPage,
  type EditableDummyOpenResult,
} from '../../pages/general-program-edit.page'
import { expectAuthenticatedShell } from '../../helpers/authenticated-shell'

/**
 * 일반 프로그램 수정 E2E — 공통정보 / 모집정보 단계 분리
 *
 * 대상: BE 시드 `[수정 가능] 일반 프로그램 더미` (신규 등록 없음)
 * 1) 더미 열기
 * 2) 공통 정보 수정·저장 (대표명 국문 유지)
 * 3) 모집 정보(참여자·강사·봉사자) 수정·저장
 * 4) 상세·목록 검증
 *
 * `serial` — 이후 단계가 programId에 의존합니다.
 *
 * 전제: auth.setup 세션 · programs 실 API · 더미가 lifecycle scheduled + 사업 시작일 이전
 */
test.describe.serial('일반 프로그램 수정', () => {
  let opened: EditableDummyOpenResult | undefined
  let editPage: GeneralProgramEditPage | undefined

  test('1) 수정 가능 더미 프로그램 열기', async ({ page }) => {
    test.setTimeout(180_000)

    await page.goto('/programs/general')
    await expectAuthenticatedShell(page)

    editPage = new GeneralProgramEditPage(page)
    opened = await editPage.openEditableDummy()
    expect(opened.programId.length).toBeGreaterThan(0)
    expect(opened.programTitle).toBe(EDITABLE_DUMMY_TITLE)
  })

  test('2) 공통 정보 수정', async ({ page }) => {
    test.setTimeout(180_000)

    expect(opened, '1) 더미 열기 결과가 필요합니다').toBeDefined()
    const { programId } = opened!

    editPage = new GeneralProgramEditPage(page)
    if (!page.url().includes(`programId=${programId}`)) {
      await page.goto(`/programs/general?programId=${programId}&lnb=info&tab=info`)
      await expectAuthenticatedShell(page)
      await expect(page.getByRole('button', { name: '정보 수정' }).first()).toBeVisible({
        timeout: 60_000,
      })
    }

    await editPage.enterCommonInfoEdit()
    await editPage.updateCommonInfo()
    await editPage.saveCommonInfo(programId)
  })

  test('3) 모집 정보 수정', async ({ page }) => {
    test.setTimeout(180_000)

    expect(opened, '1) 더미 열기 결과가 필요합니다').toBeDefined()
    const { programId } = opened!

    editPage = new GeneralProgramEditPage(page)
    if (!page.url().includes(`programId=${programId}`)) {
      await page.goto(`/programs/general?programId=${programId}&lnb=info&tab=recruitment`)
      await expectAuthenticatedShell(page)
    }

    await editPage.goToRecruitmentTab()
    await editPage.updateAllRecruitmentTabs(programId)
  })

  test('4) 수정 결과 상세·목록 확인', async ({ page }) => {
    test.setTimeout(180_000)

    expect(opened, '1) 더미 열기 결과가 필요합니다').toBeDefined()
    const { programId } = opened!

    editPage = new GeneralProgramEditPage(page)
    await page.goto(`/programs/general?programId=${programId}&lnb=info&tab=info`)
    await expectAuthenticatedShell(page)
    await expect(page.getByRole('button', { name: '정보 수정' }).first()).toBeVisible({
      timeout: 60_000,
    })

    await editPage.expectCommonInfoUpdated()
    await editPage.expectDummyVisibleInList()
  })
})
