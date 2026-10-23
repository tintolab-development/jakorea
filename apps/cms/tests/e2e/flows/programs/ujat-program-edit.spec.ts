import { test, expect } from '../../fixtures/test'
import {
  EDITABLE_UJAT_DUMMY_TITLE,
  UjatProgramEditPage,
  type UjatCommonInfoEditedSnapshot,
  type UjatEditableDummyOpenResult,
  type UjatMutationCapture,
  type UjatRecruitmentEditedSnapshot,
} from '../../pages/ujat-program-edit.page'
import { expectAuthenticatedShell } from '../../helpers/authenticated-shell'

/**
 * UJAT 프로그램 상세 풀페이지 수정 E2E — 공통/모집 + 신청 목록 셸 + 진행 셸
 *
 * 대상: BE 시드 `[수정 가능] UJAT 프로그램 더미` (신규 등록 없음)
 * 1) 더미 열기
 * 2) 공통 정보 수정·저장 → 조회 필드 일치 확인
 * 3) 모집 정보(참여자·상/하반기 봉사자) 수정·저장 → 탭별 필드 일치 확인
 * 4) 신청 목록 셸(기관·상반기 봉사자) — UJAT는 상세에 양식 수정 탭 없음
 * 5) 상세·목록 재검증
 * 6) 진행 현황 상반기 참여 기관 셸 (remote 빈 시드면 0건 허용)
 *
 * `serial` — 이후 단계가 programId·수정 스냅샷에 의존합니다.
 *
 * 전제: auth.setup 세션 · `programs`+`ujatPrograms` 실 API · 더미가 정보 수정 가능 상태
 */
test.describe.serial('UJAT 프로그램 상세 풀페이지 수정', () => {
  let opened: UjatEditableDummyOpenResult | undefined
  let editPage: UjatProgramEditPage | undefined
  let commonEdited: UjatCommonInfoEditedSnapshot | null = null
  let recruitmentEdited: UjatRecruitmentEditedSnapshot[] = []
  let commonMutation: UjatMutationCapture | undefined
  let recruitmentMutations: readonly UjatMutationCapture[] = []
  let seedMissing = false

  function requireOpened(): UjatEditableDummyOpenResult {
    test.skip(seedMissing, `시드 프로그램이 목록에 없습니다: "${EDITABLE_UJAT_DUMMY_TITLE}"`)
    expect(opened, '1) 더미 열기 결과가 필요합니다').toBeDefined()
    return opened!
  }

  test('1) 수정 가능 더미 프로그램 열기', async ({ page }, testInfo) => {
    test.setTimeout(180_000)

    await page.goto('/programs/ujat')
    await expectAuthenticatedShell(page)

    editPage = new UjatProgramEditPage(page)
    const once = await editPage.tryOpenEditableDummyOnce()
    if (!once) {
      seedMissing = true
      testInfo.annotations.push({
        type: 'skip',
        description: `시드 없음: ${EDITABLE_UJAT_DUMMY_TITLE}`,
      })
      test.skip(true, `시드 프로그램이 목록에 없습니다: "${EDITABLE_UJAT_DUMMY_TITLE}"`)
      return
    }

    opened = once
    expect(opened.programId.length).toBeGreaterThan(0)
    expect(opened.programTitle).toBeTruthy()
  })

  test('2) 공통 정보 수정', async ({ page }) => {
    test.setTimeout(180_000)

    const { programId } = requireOpened()

    editPage = new UjatProgramEditPage(page)
    if (!page.url().includes(`programId=${programId}`)) {
      await page.goto(`/programs/ujat?programId=${programId}&lnb=info&tab=info`)
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
    commonMutation = editPage.getMutationHistory().at(-1)
    await editPage.expectCommonInfoUpdated(commonEdited, opened?.programTitle)
  })

  test('3) 모집 정보 수정', async ({ page }) => {
    test.setTimeout(240_000)

    const { programId } = requireOpened()

    editPage = new UjatProgramEditPage(page)
    if (!page.url().includes(`programId=${programId}`)) {
      await page.goto(
        `/programs/ujat?programId=${programId}&lnb=info&tab=recruit_participant`
      )
      await expectAuthenticatedShell(page)
    }

    await editPage.goToRecruitmentTab('recruit_participant')
    await editPage.updateAllRecruitmentTabs(programId)
    recruitmentEdited = [...editPage.getRecruitmentEditedSnapshots()]
    recruitmentMutations = editPage.getMutationHistory()
  })

  test('4) 신청 목록 셸 확인', async ({ page }) => {
    test.setTimeout(180_000)

    const { programId } = requireOpened()

    editPage = new UjatProgramEditPage(page)
    await editPage.expectApplicationListShells(programId)
  })

  test('5) 수정 결과 상세·목록 확인', async ({ page }) => {
    test.setTimeout(180_000)

    const { programId } = requireOpened()

    editPage = new UjatProgramEditPage(page)
    await page.goto(`/programs/ujat?programId=${programId}&lnb=info&tab=info`)
    await expectAuthenticatedShell(page)
    await expect(page.getByRole('button', { name: '정보 수정' }).first()).toBeVisible({
      timeout: 60_000,
    })

    await editPage.expectCommonInfoUpdated(commonEdited, opened?.programTitle)
    if (recruitmentEdited.length > 0) {
      await editPage.expectAllRecruitmentInfoUpdated(recruitmentEdited)
    }

    const canonical = await editPage.readCanonicalDetail(programId)
    expect(canonical.titleEn).toBe(commonEdited?.titleEn)
    expect(commonMutation?.programPatchBody).toBeTruthy()

    const rows = Array.isArray(canonical.recruitments)
      ? (canonical.recruitments as Array<Record<string, unknown>>)
      : []
    for (const snapshot of recruitmentEdited) {
      const recruitTerm =
        snapshot.tabKey === 'recruit_volunteer_h1'
          ? 'FIRST_HALF'
          : snapshot.tabKey === 'recruit_volunteer_h2'
            ? 'SECOND_HALF'
            : undefined
      const row = rows.find(candidate => {
        if (snapshot.tabKey === 'recruit_participant') {
          return String(candidate.recruitmentType ?? '').toUpperCase() === 'PARTICIPANT'
        }
        return (
          String(candidate.recruitmentType ?? '').toUpperCase() === 'VOLUNTEER' &&
          candidate.recruitTerm === recruitTerm
        )
      })
      expect(row, `${snapshot.tabKey} canonical recruitment row`).toBeTruthy()
      expect(row?.contactPhone).toBe(snapshot.contactTel)
      if (snapshot.contactEmail) {
        expect(row?.contactEmail).toBe(snapshot.contactEmail)
      } else {
        expect(row?.contactEmail == null || row?.contactEmail === '').toBe(true)
      }
    }

    const recruitmentBodies = recruitmentMutations.flatMap(item => item.recruitmentPatchBodies)
    expect(recruitmentBodies.length).toBeGreaterThanOrEqual(recruitmentEdited.length)
    for (const snapshot of recruitmentEdited) {
      const recruitTerm =
        snapshot.tabKey === 'recruit_volunteer_h1'
          ? 'FIRST_HALF'
          : snapshot.tabKey === 'recruit_volunteer_h2'
            ? 'SECOND_HALF'
            : undefined
      const body = recruitmentBodies.find(candidate => {
        if (!candidate || typeof candidate !== 'object') return false
        const record = candidate as Record<string, unknown>
        return recruitTerm == null
          ? String(record.recruitmentType ?? '').toUpperCase() === 'PARTICIPANT'
          : record.recruitTerm === recruitTerm
      }) as Record<string, unknown> | undefined
      expect(body, `${snapshot.tabKey} row PATCH body`).toBeTruthy()
      expect(body?.contactPhone).toBe(snapshot.contactTel)
      if (!snapshot.contactEmail) expect(body?.contactEmail).toBe('')
    }
    await editPage.expectDummyVisibleInList(programId, opened?.programTitle)
  })

  test('6) 진행 현황 상반기 참여 기관 셸', async ({ page }) => {
    test.setTimeout(180_000)

    const { programId } = requireOpened()

    editPage = new UjatProgramEditPage(page)
    await editPage.expectProgressInstitutionsShell(programId)
  })
})
