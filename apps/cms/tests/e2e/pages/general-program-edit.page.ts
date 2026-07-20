import { type Page, expect } from '@playwright/test'
import {
  checkCheckboxIfVisible,
  checkRadioIfVisible,
  clickRegistrationTabIfVisible,
  clickSectionNavIfVisible,
  fillAllByPlaceholder,
  fillByPlaceholderIfVisible,
  fillParagraphDateByPlaceholder,
  fillVisibleFreeTextFields,
  selectByPlaceholderIfVisible,
  selectNearLabelIfVisible,
} from './form-helpers'

/** BE 시드 — 수정 E2E 전용 공유 더미 (대표명 국문은 변경하지 않음) */
export const EDITABLE_DUMMY_TITLE = '[수정 가능] 일반 프로그램 더미'

const EDIT_EN_NAME = 'JA Editable Dummy Program E2E'
const EDIT_PUBLIC_NAME = 'E2E 수정용 공고 프로그램명'
const EDIT_EDUCATION_PLACE = '서울시 중구 JA Korea E2E 수정 교육장'
const EDIT_KPI_VALUE = '41'
const EDIT_WAGE_VALUE = '160000'
const EDIT_CONTACT_NAME = 'JA Korea E2E 수정 운영팀'
const EDIT_CONTACT_TEL = '02-9876-5432'
const EDIT_CONTACT_EMAIL = 'program-edit-e2e@jakorea.org'
const EDIT_REMARK = 'E2E 자동 수정 테스트용 비고'
const EDIT_TARGET_DETAIL = 'E2E 수정 — 초·중·고 학생 대상'
const EDIT_ANNOUNCE_METHOD = 'E2E 수정 — 이메일 및 CMS 알림'
const EDIT_CURRICULUM_UNIT = 'E2E 수정 1차시 단원'
const EDIT_CURRICULUM_CONTENT = 'E2E 수정 교육 내용 — 창업 마인드셋'
const EDIT_DESCRIPTION = 'E2E 수정 프로그램 설명입니다.'
const EDIT_RECRUIT_GUIDE = 'E2E 수정 모집 안내입니다.'
const EDIT_APPLICATION_METHOD = 'E2E 수정 — CMS에서 신청해 주세요.'
const EDIT_LEARNING_SUPPORT = 'E2E 수정 학습 지원 내용입니다.'

export type EditableDummyOpenResult = {
  programId: string
  programTitle: string
}

/**
 * 일반 프로그램 상세 — `[수정 가능] 일반 프로그램 더미` 공통/모집 정보 수정 플로우
 */
export class GeneralProgramEditPage {
  constructor(private readonly page: Page) {}

  /** 목록에서 더미 프로그램 필터·행 클릭 → 상세 진입 */
  async openEditableDummy(): Promise<EditableDummyOpenResult> {
    await this.page.goto('/programs/general')
    await expect(this.page.getByRole('button', { name: '프로그램 신규 등록' })).toBeVisible({
      timeout: 30_000,
    })

    const titleFilter = this.page.getByPlaceholder('프로그램명을 입력하세요')
    await expect(titleFilter).toBeVisible({ timeout: 15_000 })
    await titleFilter.fill(EDITABLE_DUMMY_TITLE)
    await this.page.getByRole('button', { name: '조회' }).click()
    await this.page
      .waitForResponse(
        res =>
          res.request().method() === 'GET' &&
          /\/api\/admin\/programs/.test(new URL(res.url()).pathname) &&
          res.ok(),
        { timeout: 30_000 }
      )
      .catch(() => undefined)

    const row = this.page
      .locator('tbody.ant-table-tbody tr.ant-table-row')
      .filter({ hasText: EDITABLE_DUMMY_TITLE })
      .first()

    try {
      await expect(async () => {
        await expect(row).toBeVisible({ timeout: 5_000 })
      }).toPass({ timeout: 90_000 })
    } catch {
      throw new Error(
        `시드 프로그램이 목록에 없습니다: "${EDITABLE_DUMMY_TITLE}". BE에 수정 가능 더미가 시드되어 있는지 확인하세요.`
      )
    }

    await row.click()
    await expect(this.page).toHaveURL(/programId=/, { timeout: 60_000 })
    await expect(this.page.getByRole('button', { name: '정보 수정' }).first()).toBeVisible({
      timeout: 60_000,
    })

    const programId = new URL(this.page.url()).searchParams.get('programId')
    if (!programId) {
      throw new Error('상세 URL에 programId 가 없습니다.')
    }

    return { programId, programTitle: EDITABLE_DUMMY_TITLE }
  }

  async ensureCommonInfoTab() {
    await this.page.getByText('공통 정보', { exact: true }).first().click()
    await expect(this.page).toHaveURL(/tab=info|lnb=info/, { timeout: 15_000 }).catch(() => undefined)
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
   * 사업 운영 기간은 미래로 맞춰 수정 정책(시작일 이전)을 유지한다.
   */
  async updateCommonInfo() {
    await clickSectionNavIfVisible(this.page, '기본 정보')

    // 대표명(국문)은 시드 식별용 — 변경하지 않음
    await fillByPlaceholderIfVisible(
      this.page,
      '대표 프로그램명(영문)을 입력하세요',
      EDIT_EN_NAME
    )
    await fillByPlaceholderIfVisible(
      this.page,
      '모집 시 노출될 프로그램명을 입력하세요',
      EDIT_PUBLIC_NAME
    )

    await selectByPlaceholderIfVisible(this.page, '세부 프로그램명을 선택하세요')
    await this.fillDateNearLabel('사업 운영 기간', 'range', { preferFutureMonth: true })

    await checkCheckboxIfVisible(this.page, /개인/)
    await checkCheckboxIfVisible(this.page, /교사|강사/)
    await checkCheckboxIfVisible(this.page, /봉사자/)

    await selectNearLabelIfVisible(this.page, '사업 분야', '기업가정신')
    await selectByPlaceholderIfVisible(this.page, '사업 분야를 선택하세요', '기업가정신')
    await selectNearLabelIfVisible(this.page, '후원사')
    await selectByPlaceholderIfVisible(this.page, '후원사를 선택하세요')
    await this.page
      .waitForResponse(
        res => /sponsor/i.test(res.url()) && /contact/i.test(res.url()) && res.ok(),
        { timeout: 15_000 }
      )
      .catch(() => undefined)
    await selectNearLabelIfVisible(this.page, '후원사 담당자')
    await selectByPlaceholderIfVisible(this.page, '후원사 담당자를 선택하세요')

    await checkRadioIfVisible(this.page, '기관 밖')
    await fillByPlaceholderIfVisible(
      this.page,
      '교육이 진행될 상세 장소를 입력해 주세요',
      EDIT_EDUCATION_PLACE
    )

    await checkCheckboxIfVisible(this.page, '설문조사')
    await checkCheckboxIfVisible(this.page, '만족도조사')
    await checkCheckboxIfVisible(this.page, '강의평가')

    await selectNearLabelIfVisible(this.page, '교육 과정')
    await selectNearLabelIfVisible(this.page, 'IP Owned')
    await selectNearLabelIfVisible(this.page, 'Course Delivered By')
    await checkRadioIfVisible(this.page, 'Yes')

    await clickSectionNavIfVisible(this.page, '프로그램 유형 설정')
    await checkRadioIfVisible(this.page, '커리큘럼형')
    await checkRadioIfVisible(this.page, '단일 회차')
    await checkRadioIfVisible(this.page, '온라인')
    await checkRadioIfVisible(this.page, /^개인$/)
    await selectNearLabelIfVisible(this.page, 'IPS 유형', 'Inspire')
    await selectByPlaceholderIfVisible(this.page, '프로그램 채널을 선택하세요')
    await selectByPlaceholderIfVisible(this.page, '프로그램 종류를 선택하세요')
    await selectByPlaceholderIfVisible(this.page, 'IPS 유형', 'Inspire')

    await clickSectionNavIfVisible(this.page, '교육 진행 (커리큘럼)')
    await fillByPlaceholderIfVisible(this.page, '단원명을 입력하세요', EDIT_CURRICULUM_UNIT)
    await fillByPlaceholderIfVisible(this.page, '교육 내용을 작성하세요', EDIT_CURRICULUM_CONTENT)

    await clickSectionNavIfVisible(this.page, '사업 KPI 목표')
    await fillAllByPlaceholder(this.page, '목표값 입력', EDIT_KPI_VALUE)

    await clickSectionNavIfVisible(this.page, '임금 정보')
    await fillAllByPlaceholder(this.page, '직접 입력', EDIT_WAGE_VALUE)
    await selectByPlaceholderIfVisible(this.page, '지급 항목을 선택하세요')

    await clickSectionNavIfVisible(this.page, '기본 정보')
  }

  async saveCommonInfo(programId: string) {
    await this.clickInfoEditSave(programId)
    await expect(this.page).not.toHaveURL(/edit=info/, { timeout: 30_000 })
  }

  async goToRecruitmentTab() {
    await this.page.getByText('모집 정보', { exact: true }).first().click()
    await expect(this.page).toHaveURL(/tab=recruitment/, { timeout: 15_000 })
    await expect(this.page.getByRole('button', { name: '정보 수정' }).first()).toBeVisible({
      timeout: 30_000,
    })
  }

  /** 참여자·강사·봉사자 각 탭: 수정 진입 → 채움 → 저장 */
  async updateAllRecruitmentTabs(programId: string) {
    await this.updateRecruitmentTab(programId, '참여자 모집 정보', 'institutions', () =>
      this.fillRecruitParticipantFields()
    )
    await this.updateRecruitmentTab(programId, '강사 모집 정보', 'instructors', () =>
      this.fillRecruitInstructorFields()
    )
    await this.updateRecruitmentTab(programId, '봉사자 모집 정보', 'volunteers', () =>
      this.fillRecruitVolunteerFields()
    )
  }

  private async updateRecruitmentTab(
    programId: string,
    tabLabel: string,
    editParam: 'institutions' | 'instructors' | 'volunteers',
    fill: () => Promise<void>
  ) {
    const tab = this.page.getByRole('tab', { name: tabLabel }).first()
    const tabButton = this.page.getByRole('button', { name: tabLabel }).first()
    const tabVisible =
      ((await tab.count()) > 0 && (await tab.isVisible().catch(() => false))) ||
      ((await tabButton.count()) > 0 && (await tabButton.isVisible().catch(() => false)))
    if (!tabVisible) {
      // 참여자 유형에 해당 탭이 없으면 skip (강사/봉사자 미체크 더미)
      return
    }

    await clickRegistrationTabIfVisible(this.page, tabLabel)
    await expect(this.page.getByRole('button', { name: '정보 수정' }).first()).toBeVisible({
      timeout: 15_000,
    })

    const editButton = this.page.getByRole('button', { name: '정보 수정' }).first()
    await editButton.click()

    const blocked = this.page.getByRole('dialog').filter({ hasText: /수정할 수 없습니다/ })
    if (await blocked.isVisible().catch(() => false)) {
      const message = (
        await blocked.locator('.ant-modal-body, p, [class*="content"]').first().innerText()
      ).trim()
      throw new Error(`${tabLabel} 수정 불가: ${message || '(메시지 없음)'}`)
    }

    await expect(this.page).toHaveURL(new RegExp(`edit=${editParam}`), { timeout: 15_000 })
    await fill()
    await this.clickInfoEditSave(programId)
    await expect(this.page).not.toHaveURL(new RegExp(`edit=${editParam}`), { timeout: 30_000 })
  }

  private async fillRecruitSharedFields(options?: { interviewYes?: boolean }) {
    if (options?.interviewYes) {
      await checkRadioIfVisible(this.page, '면접 있음')
    } else {
      await checkRadioIfVisible(this.page, '면접 없음')
    }
    await checkRadioIfVisible(this.page, '게시')

    await this.fillDateNearLabel('프로그램 운영 기간', 'range', { preferFutureMonth: true })
    await fillParagraphDateByPlaceholder(this.page, '운영 시작일', 'range')

    await selectByPlaceholderIfVisible(this.page, '교육 대상을 선택하세요')
    await selectByPlaceholderIfVisible(this.page, '모집 대상을 선택하세요')
    await fillByPlaceholderIfVisible(this.page, '상세 교육 대상을 입력하세요', EDIT_TARGET_DETAIL)
    await fillByPlaceholderIfVisible(this.page, '상세 모집 대상을 입력하세요', EDIT_TARGET_DETAIL)

    await this.fillDateNearLabel('참여자 모집 기간', 'range', { preferFutureMonth: true })
    await this.fillDateNearLabel('강사 모집 기간', 'range', { preferFutureMonth: true })
    await this.fillDateNearLabel('봉사자 모집 기간', 'range', { preferFutureMonth: true })
    await fillParagraphDateByPlaceholder(this.page, '모집 시작일', 'range')
    await fillParagraphDateByPlaceholder(this.page, '합격자 발표일', 'single')
    await fillParagraphDateByPlaceholder(this.page, '발표일', 'single')
    await fillByPlaceholderIfVisible(this.page, '발표 방법 안내', EDIT_ANNOUNCE_METHOD)
    await fillByPlaceholderIfVisible(this.page, '담당 문의처', EDIT_CONTACT_NAME)
    await fillByPlaceholderIfVisible(this.page, '문의처 전화번호', EDIT_CONTACT_TEL)
    await fillByPlaceholderIfVisible(this.page, '문의처 이메일', EDIT_CONTACT_EMAIL)
    await fillByPlaceholderIfVisible(
      this.page,
      '비고란을 작성하세요 (없으면 -로 입력)',
      EDIT_REMARK
    )

    await fillByPlaceholderIfVisible(this.page, '프로그램 설명을 작성하세요', EDIT_DESCRIPTION)
    await fillByPlaceholderIfVisible(this.page, '모집 안내를 작성하세요', EDIT_RECRUIT_GUIDE)
    await fillByPlaceholderIfVisible(
      this.page,
      '지원 방법을 작성하세요',
      EDIT_APPLICATION_METHOD
    )
    await fillByPlaceholderIfVisible(
      this.page,
      '학습 지원 내용을 작성하세요',
      EDIT_LEARNING_SUPPORT
    )
    await fillByPlaceholderIfVisible(
      this.page,
      '기타 안내 사항을 작성하세요',
      'E2E 수정 기타 안내입니다.'
    )
    await fillVisibleFreeTextFields(this.page, 'E2E 수정 모집')
  }

  private async fillRecruitParticipantFields() {
    await fillAllByPlaceholder(this.page, '최대값 입력', '5')
    await this.fillRecruitSharedFields({ interviewYes: false })
  }

  private async fillRecruitInstructorFields() {
    await this.fillRecruitSharedFields({ interviewYes: false })
  }

  private async fillRecruitVolunteerFields() {
    await this.fillRecruitSharedFields({ interviewYes: false })
    await checkRadioIfVisible(this.page, '면접 있음')
    await fillParagraphDateByPlaceholder(this.page, '모집 시작일', 'range')
    await fillParagraphDateByPlaceholder(this.page, '발표일', 'single')
    await fillParagraphDateByPlaceholder(this.page, '면접 시작일', 'range')
    await fillByPlaceholderIfVisible(this.page, '면접 유형', '대면 면접')
    await fillParagraphDateByPlaceholder(this.page, '합격자 발표일', 'single')
    await fillAllByPlaceholder(this.page, '발표 방법 안내', EDIT_ANNOUNCE_METHOD)
  }

  async expectCommonInfoUpdated() {
    await this.ensureCommonInfoTab()
    await expect(this.page.getByText(EDITABLE_DUMMY_TITLE).first()).toBeVisible({
      timeout: 15_000,
    })
    await expect(this.page.getByText(EDIT_EDUCATION_PLACE).first()).toBeVisible({
      timeout: 15_000,
    })
    await expect(this.page.getByText(EDIT_PUBLIC_NAME).first()).toBeVisible({
      timeout: 15_000,
    })
  }

  async expectDummyVisibleInList() {
    const closeButton = this.page.getByRole('button', { name: '닫기' }).first()
    if (await closeButton.isVisible().catch(() => false)) {
      await closeButton.click()
    }

    await this.page.goto('/programs/general')
    await expect(this.page.getByRole('button', { name: '프로그램 신규 등록' })).toBeVisible({
      timeout: 30_000,
    })

    const titleFilter = this.page.getByPlaceholder('프로그램명을 입력하세요')
    await expect(titleFilter).toBeVisible({ timeout: 15_000 })
    await titleFilter.fill(EDITABLE_DUMMY_TITLE)
    await this.page.getByRole('button', { name: '조회' }).click()
    await this.page
      .waitForResponse(
        res =>
          res.request().method() === 'GET' &&
          /\/api\/admin\/programs/.test(new URL(res.url()).pathname) &&
          res.ok(),
        { timeout: 30_000 }
      )
      .catch(() => undefined)

    await expect(async () => {
      const byTitle = this.page
        .locator('tbody.ant-table-tbody tr.ant-table-row')
        .filter({ hasText: EDITABLE_DUMMY_TITLE })
        .first()
      await expect(byTitle).toBeVisible({ timeout: 5_000 })
    }).toPass({ timeout: 90_000 })
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

  /**
   * 라벨 근처 ParagraphDatePicker — 이미 값이 있어도 다시 열어 미래 날짜를 고른다.
   * (placeholder 기반 헬퍼는 값이 채워지면 트리거를 못 찾음)
   */
  private async fillDateNearLabel(
    label: string,
    mode: 'single' | 'range',
    options?: { preferFutureMonth?: boolean }
  ) {
    const field = this.page
      .locator('.detail-info-form__field')
      .filter({
        has: this.page.locator('.detail-info-form__field-label-text', {
          hasText: new RegExp(`^${label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`),
        }),
      })
      .first()

    if ((await field.count()) === 0) return
    if (!(await field.isVisible().catch(() => false))) return

    const trigger = field.locator('.paragraph-date-picker__trigger').first()
    if ((await trigger.count()) === 0) return
    if (!(await trigger.isVisible().catch(() => false))) return

    await trigger.scrollIntoViewIfNeeded()
    await trigger.click()

    const dialog = this.page.getByRole('dialog', { name: '날짜 선택' })
    await expect(dialog).toBeVisible({ timeout: 10_000 })

    if (options?.preferFutureMonth) {
      const nextBtn = dialog.locator('button.ant-picker-header-next-btn').first()
      if ((await nextBtn.count()) > 0) {
        await nextBtn.click()
        await nextBtn.click().catch(() => undefined)
      }
    }

    const days = dialog.locator(
      '.ant-picker-cell-in-view:not(.ant-picker-cell-disabled) .calendar-mini-cell'
    )
    await expect(days.first()).toBeVisible({ timeout: 5_000 })
    const dayCount = await days.count()
    // 당일 잠금 회피: 가능하면 중후반 일자 선택
    const startIdx = Math.min(Math.max(dayCount - 8, 0), Math.max(dayCount - 2, 0))
    await days.nth(startIdx).click()
    if (mode === 'range' && dayCount > 1) {
      await days.nth(Math.min(startIdx + 3, dayCount - 1)).click()
    }

    await dialog.getByRole('button', { name: '설정' }).click()
    await expect(dialog).toBeHidden({ timeout: 10_000 })
  }
}
