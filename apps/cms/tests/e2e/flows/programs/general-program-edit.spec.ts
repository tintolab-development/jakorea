import { test, expect } from '../../fixtures/test'
import {
  EDITABLE_DUMMY_TITLE,
  GeneralProgramEditPage,
  type CommonInfoEditedSnapshot,
  type EditableDummyOpenResult,
  type RecruitmentEditedSnapshot,
} from '../../pages/general-program-edit.page'
import { expectAuthenticatedShell } from '../../helpers/authenticated-shell'

/**
 * 일반 프로그램 수정 E2E — 공통/모집/신청 정보 + 진행 현황 mock 목록
 *
 * 대상: BE 시드 `[수정 가능] 일반 프로그램 더미` (신규 등록 없음)
 * 1) 더미 열기
 * 2) 공통 정보 수정·저장 → 조회 필드 일치 확인
 * 3) 모집 정보(참여자·강사·봉사자) 수정·저장 → 탭별 필드 일치 확인
 * 4) 신청 정보 양식 수정·저장 (form-template PUT)
 * 5) 상세·목록 재검증 (공통·모집 필드 재대조)
 * 6) 진행 현황 참여 기관·강사·봉사자 목록(API 빈 응답 시 FE mock 폴백)
 *
 * `serial` — 이후 단계가 programId·수정 스냅샷에 의존합니다.
 *
 * 전제: auth.setup 세션 · programs 실 API · 더미가 lifecycle scheduled + 사업 시작일 이전
 */
test.describe.serial('일반 프로그램 수정', () => {
  let opened: EditableDummyOpenResult | undefined
  let editPage: GeneralProgramEditPage | undefined
  let commonEdited: CommonInfoEditedSnapshot | null = null
  let recruitmentEdited: RecruitmentEditedSnapshot[] = []

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
    commonEdited = editPage.getCommonEditedSnapshot()
    expect(commonEdited, '공통 정보 수정 스냅샷이 필요합니다').toBeTruthy()
    await editPage.saveCommonInfo(programId)
    await editPage.expectCommonInfoUpdated(commonEdited)
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
    recruitmentEdited = [...editPage.getRecruitmentEditedSnapshots()]
  })

  test('4) 신청 정보 양식 수정', async ({ page }) => {
    test.setTimeout(180_000)

    expect(opened, '1) 더미 열기 결과가 필요합니다').toBeDefined()
    const { programId } = opened!

    editPage = new GeneralProgramEditPage(page)
    if (!page.url().includes(`programId=${programId}`)) {
      await page.goto(`/programs/general?programId=${programId}&lnb=info&tab=application`)
      await expectAuthenticatedShell(page)
    }

    await editPage.goToApplicationTab()
    await editPage.updateAllApplicationTabs()
    await editPage.expectApplicationPreviewVisible()
  })

  test('5) 수정 결과 상세·목록 확인', async ({ page }) => {
    test.setTimeout(180_000)

    expect(opened, '1) 더미 열기 결과가 필요합니다').toBeDefined()
    const { programId } = opened!

    editPage = new GeneralProgramEditPage(page)
    await page.goto(`/programs/general?programId=${programId}&lnb=info&tab=info`)
    await expectAuthenticatedShell(page)
    await expect(page.getByRole('button', { name: '정보 수정' }).first()).toBeVisible({
      timeout: 60_000,
    })

    await editPage.expectCommonInfoUpdated(commonEdited)
    if (recruitmentEdited.length > 0) {
      await editPage.expectAllRecruitmentInfoUpdated(recruitmentEdited)
    }
    await editPage.expectApplicationPreviewVisible()
    await editPage.expectDummyVisibleInList(programId)
  })

  test('6) 진행 현황 참여 기관·강사·봉사자 mock 목록', async ({ page }) => {
    test.setTimeout(180_000)

    expect(opened, '1) 더미 열기 결과가 필요합니다').toBeDefined()
    const { programId } = opened!

    editPage = new GeneralProgramEditPage(page)
    await page.goto(`/programs/general?programId=${programId}&lnb=progress&tab=progress_participants`)
    await expectAuthenticatedShell(page)

    await editPage.expectProgressParticipantMockLists(programId)
  })
})
