import { type Page, expect } from '@playwright/test'
import {
  checkCheckboxIfVisible,
  checkRadioIfVisible,
  clickRegistrationTabIfVisible,
  clickSectionNavIfVisible,
  fillAllByPlaceholder,
  fillAllParagraphDatesByPlaceholder,
  fillByPlaceholder,
  fillByPlaceholderIfVisible,
  fillParagraphDateByPlaceholder,
  fillParagraphTimeIfVisible,
  fillVisibleFreeTextFields,
  selectByPlaceholder,
  selectByPlaceholderIfVisible,
  selectNearLabel,
  selectNearLabelIfVisible,
  uploadTinyPngIfPresent,
} from './form-helpers'

/** 등록 폼 8종 — 대분류(audience) × 중분류(structure) × 소분류(session) */
export type RegistrationCase = {
  audience: 'organization' | 'individual'
  structure: 'curriculum' | 'schedule'
  session: 'single' | 'multi'
  /** 제목·테스트명용 짧은 라벨 */
  label: string
}

export const REGISTRATION_CASES: readonly RegistrationCase[] = [
  {
    audience: 'organization',
    structure: 'curriculum',
    session: 'single',
    label: '기관_커리큘럼형_단일',
  },
  {
    audience: 'organization',
    structure: 'curriculum',
    session: 'multi',
    label: '기관_커리큘럼형_복수',
  },
  {
    audience: 'individual',
    structure: 'curriculum',
    session: 'single',
    label: '개인_커리큘럼형_단일',
  },
  {
    audience: 'individual',
    structure: 'curriculum',
    session: 'multi',
    label: '개인_커리큘럼형_복수',
  },
  {
    audience: 'organization',
    structure: 'schedule',
    session: 'single',
    label: '기관_일정형_단일',
  },
  {
    audience: 'organization',
    structure: 'schedule',
    session: 'multi',
    label: '기관_일정형_복수',
  },
  {
    audience: 'individual',
    structure: 'schedule',
    session: 'single',
    label: '개인_일정형_단일',
  },
  {
    audience: 'individual',
    structure: 'schedule',
    session: 'multi',
    label: '개인_일정형_복수',
  },
] as const

function createUniqueProgramTitle(caseLabel: string) {
  const hash = Date.now().toString(36)
  return `Playwright 테스트(${caseLabel})·${hash}`
}

const PROGRAM_EN_NAME = 'JA Entrepreneurship Classroom 2026 E2E'
const PROGRAM_PUBLIC_NAME = 'JA 기업가정신 교실 참여자 모집'
const EDUCATION_PLACE = '서울시 중구 JA Korea 교육장'
const KPI_VALUE = '30'
const WAGE_VALUE = '150000'
const CONTACT_NAME = 'JA Korea 프로그램 운영팀'
const CONTACT_TEL = '02-1234-5678'
const CONTACT_EMAIL = 'program-e2e@jakorea.org'
const REMARK = 'E2E 자동 등록 테스트용 비고'
const EDUCATION_TARGET_DETAIL = '초·중·고 학생 대상 기업가정신 체험 교육'
const ANNOUNCE_METHOD = '이메일 및 CMS 알림으로 개별 안내'
const CURRICULUM_UNIT = 'E2E 1차시 단원 — 기업가정신 기초'
const CURRICULUM_CONTENT = 'E2E 교육 내용 — 창업 마인드셋과 경제 기초를 학습합니다.'
const SCHEDULE_DETAIL_NAME = 'E2E 세부 일정 — 오리엔테이션'

export type RegistrationCompleteResult = {
  programId: string
  programTitle: string
  caseLabel: string
}

async function clickButtonIfVisible(page: Page, name: string | RegExp) {
  const button = page.getByRole('button', { name }).first()
  if ((await button.count()) === 0) return
  if (!(await button.isVisible().catch(() => false))) return
  if (await button.isDisabled().catch(() => true)) return
  await button.click()
}

/**
 * 일반 프로그램 목록 → 신규 등록 풀페이지 모달 플로우
 * `REGISTRATION_CASES` 8종(기관/개인 × 커리큘럼/일정 × 단일/복수)을 variant로 채운다.
 */
export class GeneralProgramRegistrationPage {
  readonly programTitle: string
  readonly regCase: RegistrationCase

  constructor(
    private readonly page: Page,
    regCase: RegistrationCase
  ) {
    this.regCase = regCase
    this.programTitle = createUniqueProgramTitle(regCase.label)
  }

  /** 대시보드에서 LNB: 프로그램 관리 → 일반 프로그램 */
  async goToGeneralProgramsViaMenu() {
    const programMenu = this.page.getByRole('menuitem', { name: '프로그램 관리' })
    await expect(programMenu).toBeVisible()
    const expanded = await programMenu.getAttribute('aria-expanded')
    if (expanded !== 'true') {
      await programMenu.click()
    }
    await this.page.getByRole('menuitem', { name: '일반 프로그램' }).click()
    await expect(this.page).toHaveURL(/\/programs\/general/)
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

    await expect(this.page).toHaveURL(/\/programs\/general\?.*new=1/)
    await expect(this.page.getByText('일반 프로그램 등록', { exact: true })).toBeVisible()
    await expect(this.page.getByRole('button', { name: '모집 정보 작성하기' })).toBeVisible({
      timeout: 30_000,
    })
    await this.page
      .waitForResponse(res => /sponsor/i.test(res.url()) && res.ok(), { timeout: 20_000 })
      .catch(() => undefined)
  }

  /** 공통 정보 — 케이스별 대·중·소분류 + 보이는 입력 채움 */
  async fillCommonInfo() {
    const { audience, structure, session } = this.regCase

    await clickSectionNavIfVisible(this.page, '기본 정보')

    await fillByPlaceholder(this.page, '대표 프로그램명을 입력하세요', this.programTitle)
    await fillByPlaceholder(this.page, '상세 프로그램명을 입력하세요', PROGRAM_EN_NAME)
    await fillByPlaceholder(this.page, '모집 시 노출될 프로그램명을 입력하세요', PROGRAM_PUBLIC_NAME)

    await selectByPlaceholder(this.page, '세부 프로그램명을 선택하세요')
    await fillParagraphDateByPlaceholder(this.page, '사업 운영 기간을 선택하세요', 'range')

    // 대분류 — 개인/학교·기관 상호 배타 + 강사·봉사자
    if (audience === 'organization') {
      await checkCheckboxIfVisible(this.page, '학교/기관')
    } else {
      await checkCheckboxIfVisible(this.page, /^개인$/)
    }
    await checkCheckboxIfVisible(this.page, '교사/강사')
    await checkCheckboxIfVisible(this.page, '봉사자')

    await selectByPlaceholder(this.page, '사업 분야를 선택하세요', '기업가정신')
    await selectNearLabelIfVisible(this.page, '사업 분야', '기업가정신')
    // draft UI에만 후원사가 보이고 editor sponsorId가 비어 있는 경우 대비 — 항상 강제 재선택
    await selectNearLabel(this.page, '후원사', undefined, { force: true })
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

    await this.page
      .waitForResponse(
        res => /sponsor/i.test(res.url()) && /contact/i.test(res.url()) && res.ok(),
        { timeout: 15_000 }
      )
      .catch(() => undefined)
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

    // 중·소분류 — 프로그램 유형 설정
    await clickSectionNavIfVisible(this.page, '프로그램 유형 설정')
    await checkRadioIfVisible(
      this.page,
      structure === 'curriculum' ? '커리큘럼형' : '일정형'
    )
    await checkRadioIfVisible(this.page, session === 'single' ? '단일 회차' : '복수 회차')

    // 유형 전환 후 교육 진행 섹션이 바뀔 때까지 대기
    const educationSectionTitle =
      structure === 'curriculum' ? '교육 진행 (커리큘럼)' : '교육 진행 (일정형)'
    await expect(this.page.getByText(educationSectionTitle, { exact: true }).first()).toBeVisible({
      timeout: 15_000,
    })

    if (session === 'single') {
      await checkRadioIfVisible(this.page, '온라인')
      // 참여 방식 — 개인 대분류일 때만 노출
      await checkRadioIfVisible(this.page, /^개인$/)
    } else {
      await checkRadioIfVisible(this.page, '일정 공통')
      await selectByPlaceholderIfVisible(this.page, '교육 형태', '온라인')
      await selectByPlaceholderIfVisible(this.page, '참여 방식', '개인')
    }
    await selectNearLabelIfVisible(this.page, 'IPS 유형', 'Inspire')
    await selectByPlaceholderIfVisible(this.page, '프로그램 채널을 선택하세요')
    await selectByPlaceholderIfVisible(this.page, '프로그램 종류를 선택하세요')
    await selectByPlaceholderIfVisible(this.page, 'IPS 유형', 'Inspire')

    await this.fillEducationProgress()

    await clickSectionNavIfVisible(this.page, '교육 진행 일정 설정')
    await checkRadioIfVisible(this.page, '날짜 지정')
    await fillParagraphDateByPlaceholder(this.page, '일정을 선택하세요', 'single')
    await fillParagraphDateByPlaceholder(this.page, '날짜를 선택하세요', 'single')
    await fillParagraphDateByPlaceholder(this.page, '기간을 선택하세요', 'range')

    await clickSectionNavIfVisible(this.page, '사업 KPI 목표')
    await fillAllByPlaceholder(this.page, '목표값 입력', KPI_VALUE)

    await clickSectionNavIfVisible(this.page, '임금 정보')
    await fillAllByPlaceholder(this.page, '직접 입력', WAGE_VALUE)
    await selectByPlaceholderIfVisible(this.page, '지급 항목을 선택하세요')

    await clickSectionNavIfVisible(this.page, '기본 정보')
  }

  private async fillEducationProgress() {
    const { structure, session } = this.regCase

    if (structure === 'curriculum') {
      await clickSectionNavIfVisible(this.page, '교육 진행 (커리큘럼)')
      if (session === 'multi') {
        await clickButtonIfVisible(this.page, '강의 진행 회차 추가')
      }
      await fillAllByPlaceholder(this.page, '단원명을 입력하세요', CURRICULUM_UNIT)
      await fillAllByPlaceholder(this.page, '교육 내용을 작성하세요', CURRICULUM_CONTENT)
      return
    }

    await clickSectionNavIfVisible(this.page, '교육 진행 (일정형)')
    if (session === 'multi') {
      await clickButtonIfVisible(this.page, /강의 세부 일정 추가|강의 행사 일정 추가/)
    }
    await fillAllByPlaceholder(this.page, '세부 일정명을 작성하세요', SCHEDULE_DETAIL_NAME)
    await fillAllByPlaceholder(this.page, '행사 일정명을 작성하세요', SCHEDULE_DETAIL_NAME)
    await fillParagraphDateByPlaceholder(this.page, '일정을 선택하세요', 'single')
    // 진행 시간 — ParagraphTimePicker(버튼 트리거)
    const timeTriggers = this.page
      .locator('.paragraph-time-picker__trigger:visible')
      .filter({ hasText: '시간 선택' })
    const timeCount = await timeTriggers.count()
    for (let i = 0; i < Math.min(timeCount, 4); i += 1) {
      await fillParagraphTimeIfVisible(this.page, '시간 선택')
    }
  }

  async goToRecruitment() {
    await this.page.getByRole('button', { name: '모집 정보 작성하기' }).scrollIntoViewIfNeeded()
    await this.page.getByRole('button', { name: '모집 정보 작성하기' }).click()
    await expect(this.page).toHaveURL(/generalStep=recruit-/)
    await expect(this.page.getByRole('button', { name: '신청 정보 작성하기' })).toBeVisible({
      timeout: 30_000,
    })
  }

  /** 모집 정보 — 참여자·강사·봉사자 탭 전부 채움 */
  async fillRecruitmentInfo() {
    await this.fillRecruitParticipantTab()
    await clickRegistrationTabIfVisible(this.page, '강사 모집 정보')
    await this.fillRecruitInstructorTab()
    await clickRegistrationTabIfVisible(this.page, '봉사자 모집 정보')
    await this.fillRecruitVolunteerTab()
    await clickRegistrationTabIfVisible(this.page, '참여자 모집 정보')
  }

  private async fillRecruitSharedFields(options?: { interviewYes?: boolean }) {
    if (options?.interviewYes) {
      await checkRadioIfVisible(this.page, '면접 있음')
    } else {
      await checkRadioIfVisible(this.page, '면접 없음')
    }
    await checkRadioIfVisible(this.page, '게시')

    await fillParagraphDateByPlaceholder(this.page, '프로그램 운영 기간을 선택하세요', 'range')
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
    await fillParagraphDateByPlaceholder(this.page, '모집 기간을 선택하세요', 'range')
    await fillParagraphDateByPlaceholder(this.page, '합격자 발표일', 'single')
    await fillParagraphDateByPlaceholder(this.page, '발표일', 'single')
    await fillByPlaceholderIfVisible(this.page, '발표 방법 안내', ANNOUNCE_METHOD)
    await fillByPlaceholderIfVisible(this.page, '담당 문의처', CONTACT_NAME)
    await fillByPlaceholderIfVisible(this.page, '문의처 전화번호', CONTACT_TEL)
    await fillByPlaceholderIfVisible(this.page, '문의처 이메일', CONTACT_EMAIL)
    await fillByPlaceholderIfVisible(this.page, '비고란을 작성하세요 (없으면 -로 입력)', REMARK)

    await fillByPlaceholderIfVisible(
      this.page,
      '프로그램 설명을 작성하세요',
      'E2E 프로그램 설명입니다.'
    )
    await fillByPlaceholderIfVisible(this.page, '프로그램명을 작성하세요', this.programTitle)
    await fillByPlaceholderIfVisible(this.page, '모집 안내를 작성하세요', 'E2E 모집 안내입니다.')
    await fillByPlaceholderIfVisible(this.page, '지원 방법을 작성하세요', 'CMS에서 신청해 주세요.')
    await fillByPlaceholderIfVisible(
      this.page,
      '학습 지원 내용을 작성하세요',
      'E2E 학습 지원 내용입니다.'
    )
    await fillByPlaceholderIfVisible(
      this.page,
      '기타 안내 사항을 작성하세요',
      'E2E 기타 안내입니다.'
    )
    await fillVisibleFreeTextFields(this.page, 'E2E 모집 상세')
    await uploadTinyPngIfPresent(this.page)
  }

  private async fillRecruitParticipantTab() {
    await this.fillRecruitSharedFields({ interviewYes: false })
  }

  private async fillRecruitInstructorTab() {
    await this.fillRecruitSharedFields({ interviewYes: false })
  }

  private async fillRecruitVolunteerTab() {
    await this.fillRecruitSharedFields({ interviewYes: false })
    await checkRadioIfVisible(this.page, '면접 있음')
    await fillAllParagraphDatesByPlaceholder(this.page, '모집 기간을 선택하세요', 'range')
    await fillParagraphDateByPlaceholder(this.page, '발표일', 'single')
    await fillParagraphDateByPlaceholder(this.page, '면접 기간을 선택하세요', 'range')
    await fillByPlaceholderIfVisible(this.page, '면접 유형', '대면 면접')
    await fillParagraphDateByPlaceholder(this.page, '합격자 발표일', 'single')
    await fillAllByPlaceholder(this.page, '발표 방법 안내', ANNOUNCE_METHOD)
  }

  async goToApplication() {
    await this.page.getByRole('button', { name: '신청 정보 작성하기' }).click()
    await expect(this.page).toHaveURL(/generalStep=application-/)
    await expect(this.page.getByRole('button', { name: '프로그램 등록 완료' })).toBeVisible({
      timeout: 30_000,
    })
  }

  /** 신청 정보 — 참여자·강사·봉사자 탭 전부 채움 */
  async fillApplicationInfo() {
    await this.fillApplicationParticipantTab()
    await clickRegistrationTabIfVisible(this.page, '강사 신청 정보')
    await this.fillApplicationInstructorTab()
    await clickRegistrationTabIfVisible(this.page, '봉사자 신청 정보')
    await this.fillApplicationVolunteerTab()
    await clickRegistrationTabIfVisible(this.page, '참여자 신청 정보')
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

  private async fillApplicationParticipantTab() {
    await this.fillApplicationConsentIfPresent()
    await fillByPlaceholderIfVisible(this.page, '팀 명을 입력하세요', 'JA E2E 탐험대')
    await selectByPlaceholderIfVisible(this.page, '인원 수')
    await fillByPlaceholderIfVisible(this.page, '팀원 수를 입력해 주세요', '4')
    await checkRadioIfVisible(this.page, '팀장')
    await fillByPlaceholderIfVisible(
      this.page,
      '자유롭게 작성해 주세요',
      'E2E 자기소개 및 지원동기입니다.'
    )
    await fillVisibleFreeTextFields(this.page, 'E2E 신청 정보')
    const scheduleChecks = this.page.locator(
      '.ant-checkbox-wrapper:visible, [role="checkbox"]:visible'
    )
    const sc = await scheduleChecks.count()
    for (let i = 0; i < Math.min(sc, 3); i += 1) {
      await scheduleChecks
        .nth(i)
        .click({ force: true })
        .catch(() => undefined)
    }
  }

  private async fillApplicationInstructorTab() {
    await this.fillApplicationConsentIfPresent()
    await fillVisibleFreeTextFields(this.page, 'E2E 강사 신청')
    await uploadTinyPngIfPresent(this.page)
  }

  private async fillApplicationVolunteerTab() {
    await this.fillApplicationConsentIfPresent()
    await checkRadioIfVisible(this.page, '있음')
    await fillByPlaceholderIfVisible(this.page, '진행년도', '2025')
    await fillByPlaceholderIfVisible(this.page, '프로그램명', 'E2E 이전 JA 프로그램')
    await fillAllByPlaceholder(
      this.page,
      '자유롭게 작성해 주세요',
      'E2E 봉사자 자유 작성 답변입니다.'
    )
    await fillParagraphDateByPlaceholder(this.page, '날짜를 선택하세요', 'single')
    await fillByPlaceholderIfVisible(this.page, '시간을 선택해 주세요', '10:00')
    await fillVisibleFreeTextFields(this.page, 'E2E 봉사자 신청')
    await uploadTinyPngIfPresent(this.page)
  }

  /** 실 API 등록 완료 → programId 반환. 실패 모달이면 에러 */
  async completeRegistration(): Promise<RegistrationCompleteResult> {
    const failDialog = this.page.getByRole('dialog').filter({ hasText: /등록 실패/ })
    // 풀페이지 모달 footer 「프로그램 등록 완료」 버튼과 구분
    const successDialog = this.page
      .getByRole('dialog')
      .filter({ hasText: '신규 프로그램 등록이 완료되었습니다.' })

    // POST가 안 나가고 실패 모달만 뜨는 경우(템플릿 draft 500 등)도 잡기 위해 race
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
      caseLabel: this.regCase.label,
    }
  }

  /** 상세 모달 닫고 목록으로 — 작성한 프로그램 행 존재 확인 */
  async expectProgramVisibleInList(result: RegistrationCompleteResult) {
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
