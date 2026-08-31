import { type Page, expect } from '@playwright/test'
import {
  checkCheckboxIfVisible,
  checkRadioIfVisible,
  clickRegistrationTabIfVisible,
  clickSectionNavIfVisible,
  fillAllByPlaceholder,
  fillByPlaceholder,
  fillByPlaceholderIfVisible,
  fillParagraphDateByPlaceholder,
  fillVisibleFreeTextFields,
  selectByPlaceholder,
  selectByPlaceholderIfVisible,
  selectNearLabel,
  selectNearLabelIfVisible,
  uploadTinyPngIfPresent,
} from './form-helpers'

const LIST_PATH = '/programs/company-school'

function createUniqueProgramTitle() {
  const hash = Date.now().toString(36)
  return `Playwright 1사1교 테스트·${hash}`
}

const PROGRAM_EN_NAME = 'JA Company School Classroom 2026 E2E'
const PROGRAM_PUBLIC_NAME = 'JA 1사1교 참여자 모집'
const EDUCATION_PLACE = '서울시 중구 JA Korea 1사1교 교육장'
const KPI_VALUE = '30'
const WAGE_VALUE = '150000'
const CONTACT_NAME = 'JA Korea 1사1교 운영팀'
const CONTACT_TEL = '02-1234-5678'
const CONTACT_EMAIL = 'company-school-e2e@jakorea.org'
const REMARK = 'E2E 1사1교 자동 등록 테스트용 비고'
const EDUCATION_TARGET_DETAIL = '초·중·고 학교 대상 경제금융 교육'
const ANNOUNCE_METHOD = '이메일 및 CMS 알림으로 개별 안내'
const CURRICULUM_UNIT = 'E2E 1차시 단원 — 경제금융 기초'
const CURRICULUM_CONTENT = 'E2E 교육 내용 — 경제금융 기초를 학습합니다.'

const OPERATION_MONTH_OFFSET = 2
const RECRUIT_MONTH_OFFSET = 1
const OPERATION_DATE_OPTS = { futureMonthClicks: OPERATION_MONTH_OFFSET } as const
const RECRUIT_DATE_OPTS = { futureMonthClicks: RECRUIT_MONTH_OFFSET } as const
const ANNOUNCE_DATE_OPTS = {
  futureMonthClicks: RECRUIT_MONTH_OFFSET,
  preferLaterDays: true,
} as const

export type CompanySchoolRegistrationCompleteResult = {
  programId: string
  programTitle: string
}

/**
 * 1사1교 목록 → 신규 등록 풀페이지 모달
 * 고정: 학교/기관 × 커리큘럼형 × 단일 회차 · 봉사자 없음
 */
export class CompanySchoolRegistrationPage {
  readonly programTitle: string

  constructor(private readonly page: Page) {
    this.programTitle = createUniqueProgramTitle()
  }

  async goToCompanySchoolProgramsViaMenu() {
    const programMenu = this.page.getByRole('menuitem', { name: '프로그램 관리' })
    await expect(programMenu).toBeVisible()
    const expanded = await programMenu.getAttribute('aria-expanded')
    if (expanded !== 'true') {
      await programMenu.click()
    }
    await this.page.getByRole('menuitem', { name: '1사1교 프로그램' }).click()
    await expect(this.page).toHaveURL(/\/programs\/company-school/)
    await expect(this.page.getByRole('button', { name: '프로그램 신규 등록' })).toBeVisible({
      timeout: 30_000,
    })
  }

  async openNewRegistration() {
    await this.page.getByRole('button', { name: '프로그램 신규 등록' }).click()

    const draftDialog = this.page.getByRole('dialog').filter({ hasText: '임시저장 이력 안내' })
    if (await draftDialog.isVisible().catch(() => false)) {
      await draftDialog.getByRole('radio', { name: '신규 등록' }).check()
      await draftDialog.getByRole('button', { name: '프로그램 등록' }).click()
    }

    await expect(this.page).toHaveURL(/\/programs\/company-school\?.*new=1/)
    await expect(this.page.getByText('1사1교 프로그램 등록', { exact: true })).toBeVisible()
    await expect(this.page.getByRole('button', { name: '모집 정보 작성하기' })).toBeVisible({
      timeout: 30_000,
    })
    await this.page
      .waitForResponse(res => /sponsor/i.test(res.url()) && res.ok(), { timeout: 20_000 })
      .catch(() => undefined)
  }

  /** 공통 정보 — 학교/기관·강사만 (봉사자 미체크) · 커리큘럼·단일 고정 */
  async fillCommonInfo() {
    await clickSectionNavIfVisible(this.page, '기본 정보')

    await fillByPlaceholder(this.page, '대표 프로그램명을 입력하세요', this.programTitle)
    await fillByPlaceholder(this.page, '상세 프로그램명을 입력하세요', PROGRAM_EN_NAME)
    await fillByPlaceholder(this.page, '모집 시 노출될 프로그램명을 입력하세요', PROGRAM_PUBLIC_NAME)

    await selectByPlaceholder(this.page, '세부 프로그램명을 선택하세요')
    await fillParagraphDateByPlaceholder(
      this.page,
      '사업 운영 기간을 선택하세요',
      'range',
      OPERATION_DATE_OPTS
    )

    await checkCheckboxIfVisible(this.page, '학교/기관')
    await checkCheckboxIfVisible(this.page, '교사/강사')
    // 봉사자 — 1사1교에서는 숨김·미선택

    await selectByPlaceholderIfVisible(this.page, '사업 분야를 선택하세요', '경제금융')
    await selectNearLabelIfVisible(this.page, '사업 분야', '경제금융')
    await selectNearLabel(this.page, '후원사')
    const sponsorField = this.page
      .locator('.detail-info-form__field')
      .filter({
        has: this.page.locator('.detail-info-form__field-label-text', {
          hasText: /^후원사$/,
        }),
      })
      .first()
    await expect(sponsorField.locator('.ant-select-selection-item')).toBeVisible({
      timeout: 10_000,
    })
    const sponsorSelected = (
      await sponsorField.locator('.ant-select-selection-item').innerText()
    ).trim()
    expect(sponsorSelected.length).toBeGreaterThan(0)
    expect(sponsorSelected).not.toContain('선택하세요')
    expect(sponsorSelected).not.toBe('전체')

    await selectNearLabelIfVisible(this.page, '후원사 담당자')

    await checkRadioIfVisible(this.page, '기관 안')
    await fillByPlaceholder(
      this.page,
      '교육이 진행될 상세 장소를 입력해 주세요',
      EDUCATION_PLACE
    )

    await checkCheckboxIfVisible(this.page, '설문조사')
    await checkCheckboxIfVisible(this.page, '만족도조사')
    await checkCheckboxIfVisible(this.page, '강의평가')

    await selectNearLabelIfVisible(this.page, '교육 과정', 'Traditional (Paper)')
    await selectNearLabelIfVisible(this.page, 'IP Owned', 'JA')
    await selectNearLabelIfVisible(this.page, 'Course Delivered By', 'JA')
    await checkRadioIfVisible(this.page, 'Yes')

    // 유형 설정 UI가 있으면 커리큘럼·단일만 (고정값 — 없으면 skip)
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
    await fillAllByPlaceholder(this.page, '단원명을 입력하세요', CURRICULUM_UNIT)
    await fillAllByPlaceholder(this.page, '교육 내용을 작성하세요', CURRICULUM_CONTENT)

    await clickSectionNavIfVisible(this.page, '교육 진행 일정 설정')
    await fillParagraphDateByPlaceholder(
      this.page,
      '진행 기간을 선택하세요',
      'range',
      OPERATION_DATE_OPTS
    )

    await clickSectionNavIfVisible(this.page, '사업 KPI 목표')
    await fillAllByPlaceholder(this.page, '목표값 입력', KPI_VALUE)

    await clickSectionNavIfVisible(this.page, '임금 정보')
    await fillAllByPlaceholder(this.page, '직접 입력', WAGE_VALUE)
    await selectByPlaceholderIfVisible(this.page, '지급 항목을 선택하세요')

    await clickSectionNavIfVisible(this.page, '기본 정보')
  }

  async goToRecruitment() {
    await this.page.getByRole('button', { name: '모집 정보 작성하기' }).scrollIntoViewIfNeeded()
    await this.page.getByRole('button', { name: '모집 정보 작성하기' }).click()
    await expect(this.page).toHaveURL(/generalStep=recruit-/)
    await expect(this.page.getByRole('button', { name: '신청 정보 작성하기' })).toBeVisible({
      timeout: 30_000,
    })
  }

  /** 모집 — 학교(참여자)·강사만 · 봉사자 탭 부재 assert */
  async fillRecruitmentInfo() {
    await this.fillRecruitSharedFields()
    await clickRegistrationTabIfVisible(this.page, '강사 모집 정보')
    await this.fillRecruitSharedFields()
    await this.expectVolunteerRecruitTabAbsent()
    await clickRegistrationTabIfVisible(this.page, '참여자 모집 정보')
  }

  async expectVolunteerRecruitTabAbsent() {
    const volunteerTab = this.page.getByRole('tab', { name: '봉사자 모집 정보' })
    const volunteerBtn = this.page.getByRole('button', { name: '봉사자 모집 정보' })
    await expect(volunteerTab.or(volunteerBtn)).toHaveCount(0)
  }

  private async fillRecruitSharedFields() {
    await checkRadioIfVisible(this.page, '면접 없음')
    await checkRadioIfVisible(this.page, '게시')

    await fillParagraphDateByPlaceholder(
      this.page,
      '프로그램 운영 기간을 선택하세요',
      'range',
      OPERATION_DATE_OPTS
    )
    await selectByPlaceholderIfVisible(this.page, '교육 대상을 선택하세요')
    await selectByPlaceholderIfVisible(this.page, '모집 대상을 선택하세요')
    await fillByPlaceholderIfVisible(
      this.page,
      '상세 교육 대상을 입력하세요',
      EDUCATION_TARGET_DETAIL
    )
    await fillByPlaceholderIfVisible(
      this.page,
      '상세 모집 대상을 입력하세요',
      EDUCATION_TARGET_DETAIL
    )
    await fillParagraphDateByPlaceholder(
      this.page,
      '모집 기간을 선택하세요',
      'range',
      RECRUIT_DATE_OPTS
    )
    await fillParagraphDateByPlaceholder(
      this.page,
      '합격자 발표일',
      'single',
      ANNOUNCE_DATE_OPTS
    )
    await fillParagraphDateByPlaceholder(this.page, '발표일', 'single', ANNOUNCE_DATE_OPTS)
    await fillByPlaceholderIfVisible(this.page, '발표 방법 안내', ANNOUNCE_METHOD)
    await fillByPlaceholderIfVisible(this.page, '담당 문의처', CONTACT_NAME)
    await fillByPlaceholderIfVisible(this.page, '문의처 전화번호', CONTACT_TEL)
    await fillByPlaceholderIfVisible(this.page, '문의처 이메일', CONTACT_EMAIL)
    await fillByPlaceholderIfVisible(this.page, '비고란을 작성하세요 (없으면 -로 입력)', REMARK)

    await fillByPlaceholderIfVisible(
      this.page,
      '프로그램 설명을 작성하세요',
      'E2E 1사1교 프로그램 설명입니다.'
    )
    await fillByPlaceholderIfVisible(this.page, '프로그램명을 작성하세요', this.programTitle)
    await fillByPlaceholderIfVisible(this.page, '모집 안내를 작성하세요', 'E2E 1사1교 모집 안내입니다.')
    await fillByPlaceholderIfVisible(this.page, '지원 방법을 작성하세요', 'CMS에서 신청해 주세요.')
    await fillByPlaceholderIfVisible(
      this.page,
      '학습 지원 내용을 작성하세요',
      'E2E 1사1교 학습 지원 내용입니다.'
    )
    await fillByPlaceholderIfVisible(
      this.page,
      '기타 안내 사항을 작성하세요',
      'E2E 1사1교 기타 안내입니다.'
    )
    await fillVisibleFreeTextFields(this.page, 'E2E 1사1교 모집 상세')
    await uploadTinyPngIfPresent(this.page)
  }

  async goToApplication() {
    await this.page.getByRole('button', { name: '신청 정보 작성하기' }).click()
    await expect(this.page).toHaveURL(/generalStep=application-/)
    await expect(this.page.getByRole('button', { name: '프로그램 등록 완료' })).toBeVisible({
      timeout: 30_000,
    })
  }

  /** 신청 — 학교(참여자)·강사만 */
  async fillApplicationInfo() {
    await this.fillApplicationConsentIfPresent()
    await fillByPlaceholderIfVisible(this.page, '팀 명을 입력하세요', 'JA E2E 1사1교')
    await selectByPlaceholderIfVisible(this.page, '인원 수')
    await fillByPlaceholderIfVisible(this.page, '팀원 수를 입력해 주세요', '4')
    await fillByPlaceholderIfVisible(
      this.page,
      '자유롭게 작성해 주세요',
      'E2E 1사1교 자기소개 및 지원동기입니다.'
    )
    await fillVisibleFreeTextFields(this.page, 'E2E 1사1교 신청 정보')

    await clickRegistrationTabIfVisible(this.page, '강사 신청 정보')
    await this.fillApplicationConsentIfPresent()
    await fillVisibleFreeTextFields(this.page, 'E2E 1사1교 강사 신청')
    await uploadTinyPngIfPresent(this.page)
    await this.expectVolunteerApplicationTabAbsent()
    await clickRegistrationTabIfVisible(this.page, '참여자 신청 정보')
  }

  async expectVolunteerApplicationTabAbsent() {
    const volunteerTab = this.page.getByRole('tab', { name: '봉사자 신청 정보' })
    const volunteerBtn = this.page.getByRole('button', { name: '봉사자 신청 정보' })
    await expect(volunteerTab.or(volunteerBtn)).toHaveCount(0)
  }

  private async fillApplicationConsentIfPresent() {
    const checkboxes = this.page.getByRole('checkbox')
    const count = await checkboxes.count()
    for (let i = 0; i < count; i += 1) {
      const box = checkboxes.nth(i)
      if (!(await box.isVisible().catch(() => false))) continue
      if (await box.isChecked().catch(() => false)) continue
      await box.check({ force: true }).catch(() => undefined)
    }
  }

  async completeRegistration(): Promise<CompanySchoolRegistrationCompleteResult> {
    const failDialog = this.page.getByRole('dialog').filter({ hasText: /등록 실패/ })
    const successDialog = this.page
      .getByRole('dialog')
      .filter({ hasText: '신규 프로그램 등록이 완료되었습니다.' })

    const outcomePromise = Promise.race([
      this.page
        .waitForResponse(
          res =>
            res.request().method() === 'POST' &&
            /\/api\/admin\/programs\/?$/.test(new URL(res.url()).pathname),
          { timeout: 90_000 }
        )
        .then(res => ({ kind: 'response' as const, res })),
      failDialog.waitFor({ state: 'visible', timeout: 90_000 }).then(async () => {
        const message = (
          await failDialog
            .locator('.alert-modal__content, .ant-modal-body p, .ant-modal-body')
            .first()
            .innerText()
        ).trim()
        return { kind: 'fail' as const, message }
      }),
    ])

    await this.page.getByRole('button', { name: '프로그램 등록 완료' }).click()

    const outcome = await outcomePromise
    if (outcome.kind === 'fail') {
      throw new Error(`프로그램 등록 실패(실 API): ${outcome.message || '(메시지 없음)'}`)
    }

    const createResponse = outcome.res
    if (!createResponse.ok()) {
      const body = await createResponse.text().catch(() => '')
      throw new Error(
        `프로그램 등록 API 실패: HTTP ${createResponse.status()} ${body.slice(0, 400)}`
      )
    }

    await expect(successDialog).toBeVisible({ timeout: 30_000 })
    await successDialog.getByRole('button', { name: '확인' }).click()

    await expect(this.page).toHaveURL(/programId=/, { timeout: 60_000 })
    await expect(this.page).not.toHaveURL(/new=1/)

    const programId = new URL(this.page.url()).searchParams.get('programId')
    if (!programId) {
      throw new Error('등록 후 URL에 programId 가 없습니다.')
    }

    return {
      programId,
      programTitle: this.programTitle,
    }
  }

  async expectProgramVisibleInList(result: CompanySchoolRegistrationCompleteResult) {
    const closeButton = this.page.getByRole('button', { name: '닫기' }).first()
    if (await closeButton.isVisible().catch(() => false)) {
      await closeButton.click()
    }

    await this.page.goto(LIST_PATH)
    await expect(this.page.getByRole('button', { name: '프로그램 신규 등록' })).toBeVisible({
      timeout: 30_000,
    })

    const titleFilter = this.page.getByPlaceholder('프로그램명을 입력하세요')
    await expect(titleFilter).toBeVisible({ timeout: 15_000 })
    await titleFilter.fill(result.programTitle)
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
      const byId = this.page.locator(`tr[data-row-key="${result.programId}"]`)
      if ((await byId.count()) > 0) {
        await expect(byId).toBeVisible({ timeout: 5_000 })
        await expect(byId).toContainText(result.programTitle)
        return
      }
      const byTitle = this.page
        .locator('tbody.ant-table-tbody tr.ant-table-row')
        .filter({ hasText: result.programTitle })
        .first()
      await expect(byTitle).toBeVisible({ timeout: 5_000 })
    }).toPass({ timeout: 90_000 })
  }
}
