import { test, expect } from '../../fixtures/test'
import {
  EDITABLE_COMPANY_SCHOOL_DUMMY_TITLE,
  CompanySchoolEditPage,
  type CompanySchoolCommonInfoEditedSnapshot,
  type CompanySchoolEditableDummyOpenResult,
  type CompanySchoolRecruitmentEditedSnapshot,
} from '../../pages/company-school-edit.page'
import { expectAuthenticatedShell } from '../../helpers/authenticated-shell'

/**
 * 1사1교 프로그램 상세 풀페이지 수정 E2E
 *
 * 대상: BE 시드 `[수정 가능] 1사1교 프로그램 더미` (CS-EDIT · 신규 등록 없음)
 * 1) 더미 열기
 * 2) 공통 정보 수정
 * 3) 모집 — 학교/기관(참여자)
 * 4) 모집 — 강사 (+ 봉사자 탭 부재)
 * 5) 신청 양식 — 학교
 * 6) 신청 양식 — 강사
 * 7) 상세·목록 재검증
 * 8) 진행 현황 목록 셸 (학교·강사만)
 *
 * `serial` — 이후 단계가 programId·수정 스냅샷에 의존합니다.
 *
 * 전제: auth.setup 세션 · programs 실 API · 더미가 lifecycle planned + 사업 시작일 이전
 */
test.describe.serial('1사1교 프로그램 수정', () => {
  let opened: CompanySchoolEditableDummyOpenResult | undefined
  let editPage: CompanySchoolEditPage | undefined
  let commonEdited: CompanySchoolCommonInfoEditedSnapshot | null = null
  let recruitmentEdited: CompanySchoolRecruitmentEditedSnapshot[] = []

  test('1) 수정 가능 더미 프로그램 열기', async ({ page }) => {
    test.setTimeout(180_000)

    await page.goto('/programs/company-school')
    await expectAuthenticatedShell(page)

    editPage = new CompanySchoolEditPage(page)
    opened = await editPage.openEditableDummy()
    expect(opened.programId.length).toBeGreaterThan(0)
    expect(opened.programTitle).toBe(EDITABLE_COMPANY_SCHOOL_DUMMY_TITLE)
  })

  test('2) 공통 정보 수정', async ({ page }) => {
    test.setTimeout(180_000)

    expect(opened, '1) 더미 열기 결과가 필요합니다').toBeDefined()
    const { programId } = opened!

    editPage = new CompanySchoolEditPage(page)
    if (!page.url().includes(`programId=${programId}`)) {
      await page.goto(`/programs/company-school?programId=${programId}&lnb=info&tab=info`)
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

  test('3) 모집 정보 — 학교/기관', async ({ page }) => {
    test.setTimeout(180_000)

    expect(opened, '1) 더미 열기 결과가 필요합니다').toBeDefined()
    const { programId } = opened!

    editPage = new CompanySchoolEditPage(page)
    if (!page.url().includes(`programId=${programId}`)) {
      await page.goto(`/programs/company-school?programId=${programId}&lnb=info&tab=recruitment`)
      await expectAuthenticatedShell(page)
    }

    await editPage.goToRecruitmentTab()
    await editPage.updateSchoolRecruitmentTab(programId)
    recruitmentEdited = [...editPage.getRecruitmentEditedSnapshots()]
  })

  test('4) 모집 정보 — 강사', async ({ page }) => {
    test.setTimeout(180_000)

    expect(opened, '1) 더미 열기 결과가 필요합니다').toBeDefined()
    const { programId } = opened!

    editPage = new CompanySchoolEditPage(page)
    if (!page.url().includes(`programId=${programId}`)) {
      await page.goto(`/programs/company-school?programId=${programId}&lnb=info&tab=recruitment`)
      await expectAuthenticatedShell(page)
    }

    await editPage.goToRecruitmentTab()
    await editPage.updateInstructorRecruitmentTab(programId)
    recruitmentEdited = [...recruitmentEdited, ...editPage.getRecruitmentEditedSnapshots()]
  })

  test('5) 신청 정보 양식 — 학교', async ({ page }) => {
    test.setTimeout(180_000)

    expect(opened, '1) 더미 열기 결과가 필요합니다').toBeDefined()
    const { programId } = opened!

    editPage = new CompanySchoolEditPage(page)
    if (!page.url().includes(`programId=${programId}`)) {
      await page.goto(`/programs/company-school?programId=${programId}&lnb=info&tab=application`)
      await expectAuthenticatedShell(page)
    }

    await editPage.goToApplicationTab()
    await editPage.updateSchoolApplicationFormTab()
  })

  test('6) 신청 정보 양식 — 강사', async ({ page }) => {
    test.setTimeout(180_000)

    expect(opened, '1) 더미 열기 결과가 필요합니다').toBeDefined()
    const { programId } = opened!

    editPage = new CompanySchoolEditPage(page)
    if (!page.url().includes(`programId=${programId}`)) {
      await page.goto(`/programs/company-school?programId=${programId}&lnb=info&tab=application`)
      await expectAuthenticatedShell(page)
    }

    await editPage.goToApplicationTab()
    await editPage.updateInstructorApplicationFormTab()
    await editPage.expectApplicationPreviewVisible()
  })

  test('7) 수정 결과 상세·목록 확인', async ({ page }) => {
    test.setTimeout(180_000)

    expect(opened, '1) 더미 열기 결과가 필요합니다').toBeDefined()
    const { programId } = opened!

    editPage = new CompanySchoolEditPage(page)
    await page.goto(`/programs/company-school?programId=${programId}&lnb=info&tab=info`)
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

  test('8) 진행 현황 참여 기관·강사 목록', async ({ page }) => {
    test.setTimeout(180_000)

    expect(opened, '1) 더미 열기 결과가 필요합니다').toBeDefined()
    const { programId } = opened!

    editPage = new CompanySchoolEditPage(page)
    await page.goto(
      `/programs/company-school?programId=${programId}&lnb=progress&tab=progress_participants`
    )
    await expectAuthenticatedShell(page)

    await editPage.expectProgressParticipantMockLists(programId)
  })
})
