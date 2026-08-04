import { type Page, expect } from '@playwright/test'
import {
  checkRadioIfVisible,
  clickRegistrationTabIfVisible,
  clickSectionNavIfVisible,
  expectDetailInfoFieldContains,
  fillAllByPlaceholder,
  fillByPlaceholderIfVisible,
  selectByPlaceholderIfVisible,
} from './form-helpers'
import { EDITABLE_UJAT_DUMMY_TITLE } from './ujat-program-seed-titles'

export { EDITABLE_UJAT_DUMMY_TITLE }

const EDIT_MARKER = '(수정이력)'

const EDIT_EN_NAME = `JA UJAT Editable Dummy E2E ${EDIT_MARKER}`
const EDIT_MANAGEMENT_NAME = `E2E UJAT 관리명 ${EDIT_MARKER}`
const EDIT_KPI_VALUE = '41'
const EDIT_TARGET_DETAIL = `E2E UJAT 수정 — 학교 대상 ${EDIT_MARKER}`
const EDIT_CONTACT_TEL = '02-9876-5432'
const EDIT_CONTACT_EMAIL = 'ujat-edit-e2e@jakorea.org'

export type UjatCommonInfoEditedSnapshot = {
  titleEn: string
  managementName: string
  kpiValue: string
}

export type UjatRecruitmentEditedSnapshot = {
  tabLabel: string
  tabKey: string
  targetDetail: string
  contactTel: string
  contactEmail: string
}

export type UjatEditableDummyOpenResult = {
  programId: string
  programTitle: string
}

const RECRUIT_TABS = [
  { key: 'recruit_participant', label: '참여자 모집 정보' },
  { key: 'recruit_volunteer_h1', label: '상반기 봉사자 모집 정보' },
  { key: 'recruit_volunteer_h2', label: '하반기 봉사자 모집 정보' },
] as const

/**
 * UJAT 프로그램 상세 풀페이지 — `[수정 가능] UJAT 프로그램 더미` 공통/모집 수정
 *
 * 일반 `GeneralProgramEditPage`를 extend하지 않습니다 (유형 격리).
 * UJAT 상세에는 신청 양식「양식 수정」탭이 없어 4단계는 신청 목록 셸만 검증합니다.
 */
export class UjatProgramEditPage {
  private commonEdited: UjatCommonInfoEditedSnapshot | null = null
  private recruitmentEdited: UjatRecruitmentEditedSnapshot[] = []

  constructor(private readonly page: Page) {}

  getCommonEditedSnapshot(): UjatCommonInfoEditedSnapshot | null {
    return this.commonEdited
  }

  getRecruitmentEditedSnapshots(): readonly UjatRecruitmentEditedSnapshot[] {
    return this.recruitmentEdited
  }

  private lnb() {
    return this.page.getByRole('navigation', { name: 'UJAT 프로그램 상세 메뉴' })
  }

  private async expectDetailShellReady() {
    await expect(this.lnb()).toBeVisible({ timeout: 60_000 })
    await expect(this.page.getByRole('button', { name: '정보 수정' }).first()).toBeVisible({
      timeout: 60_000,
    })
  }

  /** 목록에서 시드 행을 찾아 상세 진입. 없으면 null */
  async tryOpenEditableDummyOnce(): Promise<UjatEditableDummyOpenResult | null> {
    await this.page.goto('/programs/ujat')
    await expect(this.page.getByRole('button', { name: '프로그램 신규 등록' })).toBeVisible({
      timeout: 30_000,
    })

    const row = this.page
      .locator('tbody.ant-table-tbody tr.ant-table-row')
      .filter({ hasText: EDITABLE_UJAT_DUMMY_TITLE })
      .first()

    try {
      await expect(row).toBeVisible({ timeout: 12_000 })
    } catch {
      return null
    }

    await row.click()
    await expect(this.page).toHaveURL(/programId=/, { timeout: 60_000 })
    await this.expectDetailShellReady()

    const programId = new URL(this.page.url()).searchParams.get('programId')
    if (!programId) {
      throw new Error('상세 URL에 programId 가 없습니다.')
    }

    return { programId, programTitle: EDITABLE_UJAT_DUMMY_TITLE }
  }

  async openEditableDummy(): Promise<UjatEditableDummyOpenResult> {
    let opened: UjatEditableDummyOpenResult | null = null
    await expect(async () => {
      opened = await this.tryOpenEditableDummyOnce()
      if (!opened) {
        throw new Error(`시드 프로그램이 목록에 없습니다: "${EDITABLE_UJAT_DUMMY_TITLE}"`)
      }
    }).toPass({ timeout: 90_000 })
    return opened!
  }

  async gotoDetail(programId: string, tab = 'info') {
    await this.page.goto(`/programs/ujat?programId=${programId}&lnb=info&tab=${tab}`)
    await this.expectDetailShellReady()
  }

  async ensureCommonInfoTab() {
    const common = this.lnb().getByRole('button', { name: '공통 정보' })
    if (await common.isVisible().catch(() => false)) {
      await common.click()
    }
    await expect(this.page).toHaveURL(/tab=info/, { timeout: 15_000 })
    await expect(this.page.getByRole('button', { name: '정보 수정' }).first()).toBeVisible({
      timeout: 30_000,
    })
  }

  async enterCommonInfoEdit() {
    await this.ensureCommonInfoTab()
    const editButton = this.page.getByRole('button', { name: '정보 수정' }).first()
    await editButton.click()

    const blocked = this.page.getByRole('dialog').filter({ hasText: /수정할 수 없습니다/ })
    if (await blocked.isVisible().catch(() => false)) {
      const message = (
        await blocked.locator('.ant-modal-body, p, [class*="content"]').first().innerText()
      ).trim()
      throw new Error(`공통 정보 수정 불가: ${message || '(메시지 없음)'}`)
    }

    await expect(this.page).toHaveURL(/edit=info/, { timeout: 15_000 })
    await expect(
      this.page.getByPlaceholder('대표 프로그램명을 입력하세요').first()
    ).toBeVisible({ timeout: 15_000 })
  }

  /**
   * 공통 정보 — 대표명(국문) 제외하고 수정 가능 필드 갱신.
   */
  async updateCommonInfo() {
    await clickSectionNavIfVisible(this.page, '기본 정보')

    // 국문 대표명은 시드 식별용 — 변경하지 않음
    const titleInputs = this.page.getByPlaceholder('대표 프로그램명을 입력하세요')
    if ((await titleInputs.count()) >= 2) {
      await titleInputs.nth(1).fill(EDIT_EN_NAME)
    }

    await fillByPlaceholderIfVisible(
      this.page,
      '프로그램 관리명을 입력하세요',
      EDIT_MANAGEMENT_NAME
    )

    await selectByPlaceholderIfVisible(this.page, '세부 프로그램명을 선택하세요')
    await selectByPlaceholderIfVisible(this.page, '사업 분야를 선택하세요')
    await selectByPlaceholderIfVisible(this.page, '후원사를 선택하세요')
    await selectByPlaceholderIfVisible(this.page, '후원사 담당자를 선택하세요')
    await selectByPlaceholderIfVisible(this.page, '교육 과정을 선택하세요')
    await selectByPlaceholderIfVisible(this.page, 'IPS 유형을 선택하세요')

    await clickSectionNavIfVisible(this.page, '사업 KPI 목표')
    await fillAllByPlaceholder(this.page, '목표값 입력', EDIT_KPI_VALUE)

    await clickSectionNavIfVisible(this.page, '임금 정보')
    await selectByPlaceholderIfVisible(this.page, '지급 항목을 선택하세요')

    this.commonEdited = {
      titleEn: EDIT_EN_NAME,
      managementName: EDIT_MANAGEMENT_NAME,
      kpiValue: EDIT_KPI_VALUE,
    }
  }

  async saveCommonInfo(programId: string) {
    await this.clickInfoEditSave(programId)
    await expect(this.page).not.toHaveURL(/edit=info/, { timeout: 30_000 })
  }

  async expectCommonInfoUpdated(snapshot?: UjatCommonInfoEditedSnapshot | null) {
    const s = snapshot ?? this.commonEdited
    await this.ensureCommonInfoTab()

    await expectDetailInfoFieldContains(
      this.page,
      '대표 프로그램명 (국문)',
      EDITABLE_UJAT_DUMMY_TITLE
    )

    if (!s) {
      await expect(this.page.getByText(EDIT_MARKER).first()).toBeVisible({ timeout: 15_000 })
      return
    }

    await expectDetailInfoFieldContains(this.page, '대표 프로그램명 (영문)', s.titleEn, {
      required: false,
    })
    await expectDetailInfoFieldContains(this.page, '프로그램 관리명', s.managementName, {
      required: false,
    })
    await expectDetailInfoFieldContains(this.page, '참여자 최종 인원', s.kpiValue, {
      required: false,
    })
  }

  async goToRecruitmentTab(tabKey: string = 'recruit_participant') {
    const recruitNav = this.lnb().getByRole('button', { name: '모집 정보' })
    if (await recruitNav.isVisible().catch(() => false)) {
      await recruitNav.click()
    }
    await expect(this.page).toHaveURL(/tab=recruit_/, { timeout: 15_000 })

    const tabMeta = RECRUIT_TABS.find(t => t.key === tabKey)
    if (tabMeta) {
      await clickRegistrationTabIfVisible(this.page, tabMeta.label)
    }
    await expect(this.page.getByRole('button', { name: '정보 수정' }).first()).toBeVisible({
      timeout: 30_000,
    })
  }

  async updateAllRecruitmentTabs(programId: string) {
    this.recruitmentEdited = []
    for (const tab of RECRUIT_TABS) {
      await this.updateRecruitmentTab(programId, tab.key, tab.label)
    }
  }

  private async updateRecruitmentTab(programId: string, tabKey: string, tabLabel: string) {
    await this.goToRecruitmentTab(tabKey)

    const tab = this.page.getByRole('tab', { name: tabLabel }).first()
    const tabButton = this.page.getByRole('button', { name: tabLabel }).first()
    const tabVisible =
      ((await tab.count()) > 0 && (await tab.isVisible().catch(() => false))) ||
      ((await tabButton.count()) > 0 && (await tabButton.isVisible().catch(() => false)))
    if (!tabVisible) {
      return
    }

    await clickRegistrationTabIfVisible(this.page, tabLabel)
    await expect(this.page.getByRole('button', { name: '정보 수정' }).first()).toBeVisible({
      timeout: 15_000,
    })

    await this.page.getByRole('button', { name: '정보 수정' }).first().click()

    const blocked = this.page.getByRole('dialog').filter({ hasText: /수정할 수 없습니다/ })
    if (await blocked.isVisible().catch(() => false)) {
      const message = (
        await blocked.locator('.ant-modal-body, p, [class*="content"]').first().innerText()
      ).trim()
      throw new Error(`${tabLabel} 수정 불가: ${message || '(메시지 없음)'}`)
    }

    await expect(this.page).toHaveURL(new RegExp(`edit=${tabKey}`), { timeout: 15_000 })

    await fillByPlaceholderIfVisible(
      this.page,
      '프로그램명을 입력하세요',
      `E2E UJAT 공고 ${EDIT_MARKER}`
    )
    await fillByPlaceholderIfVisible(
      this.page,
      '상세 교육 대상을 입력하세요',
      EDIT_TARGET_DETAIL
    )
    await fillByPlaceholderIfVisible(
      this.page,
      '상세 모집 대상을 입력하세요',
      EDIT_TARGET_DETAIL
    )
    await selectByPlaceholderIfVisible(this.page, '교육 대상을 선택하세요')
    await selectByPlaceholderIfVisible(this.page, '모집 대상을 선택하세요')
    await fillByPlaceholderIfVisible(this.page, '문의처 전화번호', EDIT_CONTACT_TEL)
    await fillByPlaceholderIfVisible(this.page, '문의처 이메일', EDIT_CONTACT_EMAIL)
    await checkRadioIfVisible(this.page, '면접 없음')

    const snapshot: UjatRecruitmentEditedSnapshot = {
      tabLabel,
      tabKey,
      targetDetail: EDIT_TARGET_DETAIL,
      contactTel: EDIT_CONTACT_TEL,
      contactEmail: EDIT_CONTACT_EMAIL,
    }

    await this.clickInfoEditSave(programId)
    await expect(this.page).not.toHaveURL(new RegExp(`edit=${tabKey}`), { timeout: 30_000 })

    this.recruitmentEdited.push(snapshot)
    await this.expectRecruitmentTabFieldsMatch(snapshot)
  }

  async expectAllRecruitmentInfoUpdated(snapshots?: UjatRecruitmentEditedSnapshot[]) {
    const list = snapshots ?? this.recruitmentEdited
    for (const snapshot of list) {
      await this.expectRecruitmentTabFieldsMatch(snapshot)
    }
  }

  private async expectRecruitmentTabFieldsMatch(snapshot: UjatRecruitmentEditedSnapshot) {
    await this.goToRecruitmentTab(snapshot.tabKey)
    await clickRegistrationTabIfVisible(this.page, snapshot.tabLabel)
    await expectDetailInfoFieldContains(this.page, '교육 대상 상세', snapshot.targetDetail, {
      required: false,
    })
    await expectDetailInfoFieldContains(this.page, '문의처', snapshot.contactTel, {
      required: false,
    })
  }

  /**
   * UJAT 상세에는 일반 프로그램의 「신청 정보 양식 수정」탭이 없음.
   * 신청 관련 LNB 셸(기관·상반기 봉사자) 로드만 검증합니다.
   */
  async expectApplicationListShells(programId: string) {
    await this.page.goto(
      `/programs/ujat?programId=${programId}&lnb=institution_applications&tab=inst_all`
    )
    await expect(this.lnb()).toBeVisible({ timeout: 60_000 })
    await expect(
      this.page.getByText(/신청 기관|참여 기관 신청/).first()
    ).toBeVisible({ timeout: 30_000 })

    await this.page.goto(`/programs/ujat?programId=${programId}&lnb=volunteer_h1&tab=vh1_all`)
    await expect(this.lnb()).toBeVisible({ timeout: 60_000 })
    await expect(this.page.getByText(/봉사자 신청/).first()).toBeVisible({ timeout: 30_000 })
  }

  async expectDummyVisibleInList(programId: string) {
    await this.page.goto('/programs/ujat')
    await expect(this.page.getByRole('button', { name: '프로그램 신규 등록' })).toBeVisible({
      timeout: 30_000,
    })

    const row = this.page
      .locator('tbody.ant-table-tbody tr.ant-table-row')
      .filter({ hasText: EDITABLE_UJAT_DUMMY_TITLE })
      .first()
    await expect(row).toBeVisible({ timeout: 30_000 })

    // 딥링크로 다시 열 수 있는지 확인
    await this.page.goto(`/programs/ujat?programId=${programId}&lnb=info&tab=info`)
    await this.expectDetailShellReady()
  }

  /** 상반기 참여 기관 목록 셸 — remote 0건 허용 */
  async expectProgressInstitutionsShell(programId: string) {
    await this.page.goto(
      `/programs/ujat?programId=${programId}&lnb=education_progress&tab=edu_h1_institutions`
    )
    await expect(this.lnb()).toBeVisible({ timeout: 60_000 })
    await expect(
      this.page.getByText(/참여 기관|교육 진행/).first()
    ).toBeVisible({ timeout: 30_000 })
    await expect(this.page.locator('.cms-data-table, .ant-table, .filter-table-layout').first()).toBeVisible({
      timeout: 30_000,
    })
  }

  private async clickInfoEditSave(programId: string) {
    const failDialog = this.page
      .getByRole('dialog')
      .filter({ hasText: /저장 실패|입력 확인/ })
    const editButton = this.page.getByRole('button', { name: '정보 수정' }).first()

    const patchPromise = this.page.waitForResponse(
      res => {
        if (res.request().method() !== 'PATCH') return false
        const path = new URL(res.url()).pathname
        return new RegExp(`/api/admin/programs/${programId}/?$`).test(path)
      },
      { timeout: 60_000 }
    )

    await editButton.click()

    await Promise.race([
      patchPromise.then(async res => {
        if (!res.ok()) {
          const body = await res.text().catch(() => '')
          throw new Error(
            `프로그램 수정 API 실패: HTTP ${res.status()} ${body.slice(0, 400)}`
          )
        }
      }),
      failDialog.waitFor({ state: 'visible', timeout: 60_000 }).then(async () => {
        const message = (
          await failDialog.locator('.ant-modal-body, p, [class*="content"]').first().innerText()
        ).trim()
        throw new Error(`프로그램 수정 실패: ${message || '(메시지 없음)'}`)
      }),
    ])
  }
}
