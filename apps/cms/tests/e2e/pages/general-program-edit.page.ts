import { type Page, expect } from '@playwright/test'
import { recordE2eTestLogNotes } from '../helpers/attach-e2e-test-logs'
import {
  checkCheckboxIfVisible,
  checkRadioIfVisible,
  clickRegistrationTabIfVisible,
  clickSectionNavIfVisible,
  expectDetailInfoFieldContains,
  fillAllByPlaceholder,
  fillByPlaceholderIfVisible,
  fillParagraphDateByPlaceholder,
  fillVisibleFreeTextFields,
  readDateTriggerNearLabel,
  readSelectTextNearLabel,
  selectByPlaceholderIfVisible,
  selectNearLabelIfVisible,
} from './form-helpers'
import { GeneralProgramDetailPage } from './general-program-detail.page'
import { EDITABLE_DUMMY_TITLE } from './general-program-seed-titles'

export { EDITABLE_DUMMY_TITLE }

/** 상세에서 수정 여부를 눈으로 확인할 수 있도록 텍스트 값에 붙이는 표식 */
const EDIT_MARKER = '(수정이력)'

const EDIT_EN_NAME = `JA Editable Dummy Program E2E ${EDIT_MARKER}`
const EDIT_PUBLIC_NAME = `E2E 수정용 공고 프로그램명 ${EDIT_MARKER}`
const EDIT_EDUCATION_PLACE = `서울시 중구 JA Korea E2E 수정 교육장 ${EDIT_MARKER}`
const EDIT_KPI_VALUE = '41'
const EDIT_WAGE_VALUE = '160000'
const EDIT_CONTACT_NAME = `JA Korea E2E 수정 운영팀 ${EDIT_MARKER}`
const EDIT_CONTACT_TEL = '02-9876-5432'
const EDIT_CONTACT_EMAIL = 'program-edit-e2e@jakorea.org'
const EDIT_REMARK = `E2E 자동 수정 테스트용 비고 ${EDIT_MARKER}`
const EDIT_TARGET_DETAIL = `E2E 수정 — 초·중·고 학생 대상 ${EDIT_MARKER}`
const EDIT_ANNOUNCE_METHOD = `E2E 수정 — 이메일 및 CMS 알림 ${EDIT_MARKER}`
const EDIT_CURRICULUM_UNIT = `E2E 수정 1차시 단원 ${EDIT_MARKER}`
const EDIT_CURRICULUM_CONTENT = `E2E 수정 교육 내용 — 창업 마인드셋 ${EDIT_MARKER}`
const EDIT_DESCRIPTION = `E2E 수정 프로그램 설명입니다. ${EDIT_MARKER}`
const EDIT_RECRUIT_GUIDE = `E2E 수정 모집 안내입니다. ${EDIT_MARKER}`
const EDIT_APPLICATION_METHOD = `E2E 수정 — CMS에서 신청해 주세요. ${EDIT_MARKER}`
const EDIT_LEARNING_SUPPORT = `E2E 수정 학습 지원 내용입니다. ${EDIT_MARKER}`
const EDIT_ETC_GUIDE = `E2E 수정 기타 안내입니다. ${EDIT_MARKER}`
const EDIT_BUSINESS_AREA = '기업가정신'
const EDIT_IPS_TYPE = 'Inspire'

type FieldLogItem = {
  label: string
  reason?: string
  value?: string | null
}

const EDIT_LOG_TITLE_PREFIX = 'flows/programs/general-program-edit.spec.ts › 일반 프로그램 수정'

/** 공통 정보 — 테스트가 의도적으로 건드리지 않는 필드 */
const COMMON_INTENTIONALLY_UNCHANGED: FieldLogItem[] = [
  {
    label: '대표 프로그램명 (국문)',
    reason: '시드 식별용(`[수정 가능] 일반 프로그램 더미`) — 의도적 미수정',
    value: EDITABLE_DUMMY_TITLE,
  },
]

/** 모집 정보 — 의도적 미수정 / readOnly */
const RECRUIT_INTENTIONALLY_UNCHANGED: FieldLogItem[] = [
  {
    label: '담당 문의처',
    reason: '후원사명 파생 readOnly — Tel/E-mail만 수정',
  },
]

/** 공통 정보 수정 직후 캡처 — 조회 모드 필드 대조용 */
export type CommonInfoEditedSnapshot = {
  titleEn: string
  publicName: string
  educationPlace: string
  businessArea: string
  curriculumUnit: string
  curriculumContent: string
  kpiValue: string
  wageValue: string
  detailedProgramName: string | null
  sponsorName: string | null
  sponsorManager: string | null
  operationPeriod: string | null
  educationStructure: string
  sessionRound: string
  educationForm: string
  participationMethod: string
  ipsType: string
  venueKind: string
}

/** 모집 정보 탭 수정 직후 캡처 */
export type RecruitmentEditedSnapshot = {
  tabLabel: string
  targetDetail: string
  announceMethod: string
  contactName: string
  contactTel: string
  contactEmail: string
  remark: string
  description: string
  recruitGuide: string
  applicationMethod: string
  learningSupport: string
  etcGuide: string
  operationPeriod: string | null
}

export type EditableDummyOpenResult = {
  programId: string
  programTitle: string
}

/**
 * 일반 프로그램 상세 — `[수정 가능] 일반 프로그램 더미` 공통/모집/신청 정보 수정 플로우
 */
export class GeneralProgramEditPage {
  private readonly page: Page
  private readonly detail: GeneralProgramDetailPage
  private commonEdited: CommonInfoEditedSnapshot | null = null
  private recruitmentEdited: RecruitmentEditedSnapshot[] = []

  constructor(page: Page) {
    this.page = page
    this.detail = new GeneralProgramDetailPage(page)
  }

  getCommonEditedSnapshot(): CommonInfoEditedSnapshot | null {
    return this.commonEdited
  }

  getRecruitmentEditedSnapshots(): readonly RecruitmentEditedSnapshot[] {
    return this.recruitmentEdited
  }

  /** 목록에서 더미 프로그램 필터·행 클릭 → 상세 진입 */
  async openEditableDummy(): Promise<EditableDummyOpenResult> {
    const opened = await this.detail.openEditableDummy()
    await expect(this.page.getByRole('button', { name: '정보 수정' }).first()).toBeVisible({
      timeout: 60_000,
    })
    return opened
  }

  async ensureCommonInfoTab() {
    await this.detail.goToInfoTab('info')
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

    await selectNearLabelIfVisible(this.page, '사업 분야', EDIT_BUSINESS_AREA)
    await selectByPlaceholderIfVisible(this.page, '사업 분야를 선택하세요', EDIT_BUSINESS_AREA)
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
    await selectNearLabelIfVisible(this.page, 'IPS 유형', EDIT_IPS_TYPE)
    await selectByPlaceholderIfVisible(this.page, '프로그램 채널을 선택하세요')
    await selectByPlaceholderIfVisible(this.page, '프로그램 종류를 선택하세요')
    await selectByPlaceholderIfVisible(this.page, 'IPS 유형', EDIT_IPS_TYPE)

    await clickSectionNavIfVisible(this.page, '교육 진행 (커리큘럼)')
    await fillByPlaceholderIfVisible(this.page, '단원명을 입력하세요', EDIT_CURRICULUM_UNIT)
    await fillByPlaceholderIfVisible(this.page, '교육 내용을 작성하세요', EDIT_CURRICULUM_CONTENT)

    await clickSectionNavIfVisible(this.page, '사업 KPI 목표')
    await fillAllByPlaceholder(this.page, '목표값 입력', EDIT_KPI_VALUE)

    await clickSectionNavIfVisible(this.page, '임금 정보')
    await fillAllByPlaceholder(this.page, '직접 입력', EDIT_WAGE_VALUE)
    await selectByPlaceholderIfVisible(this.page, '지급 항목을 선택하세요')

    await clickSectionNavIfVisible(this.page, '기본 정보')

    this.commonEdited = {
      titleEn: EDIT_EN_NAME,
      publicName: EDIT_PUBLIC_NAME,
      educationPlace: EDIT_EDUCATION_PLACE,
      businessArea: EDIT_BUSINESS_AREA,
      curriculumUnit: EDIT_CURRICULUM_UNIT,
      curriculumContent: EDIT_CURRICULUM_CONTENT,
      kpiValue: EDIT_KPI_VALUE,
      wageValue: EDIT_WAGE_VALUE,
      detailedProgramName: await readSelectTextNearLabel(this.page, '세부 프로그램명'),
      sponsorName: await readSelectTextNearLabel(this.page, '후원사'),
      sponsorManager: await readSelectTextNearLabel(this.page, '후원사 담당자'),
      operationPeriod: await readDateTriggerNearLabel(this.page, '사업 운영 기간'),
      educationStructure: '커리큘럼형',
      sessionRound: '단일 회차',
      educationForm: '온라인',
      participationMethod: '개인',
      ipsType: EDIT_IPS_TYPE,
      venueKind: '기관 밖',
    }

    await this.logEditFieldNotes('2) 공통 정보 수정', {
      changed: this.snapshotToChangedFields(this.commonEdited),
      unchanged: await this.mergeUnchangedWithDomReadOnly(COMMON_INTENTIONALLY_UNCHANGED),
    })
  }

  async saveCommonInfo(programId: string) {
    await this.clickInfoEditSave(programId)
    await expect(this.page).not.toHaveURL(/edit=info/, { timeout: 30_000 })
  }

  async goToRecruitmentTab() {
    await this.detail.goToInfoTab('recruitment')
    await expect(this.page.getByRole('button', { name: '정보 수정' }).first()).toBeVisible({
      timeout: 30_000,
    })
  }

  async goToApplicationTab() {
    await this.detail.goToInfoTab('application')
    await expect(
      this.page.getByText('현재 화면은 양식 미리보기 화면입니다.').first()
    ).toBeVisible({ timeout: 30_000 })
    await expect(this.page.getByRole('button', { name: '양식 수정' }).first()).toBeVisible({
      timeout: 15_000,
    })
  }

  /**
   * 신청 정보 — 서브탭별 양식 수정 모달 열어 저장.
   * 저장은 form-template version PUT (PATCH programs 아님).
   */
  async updateAllApplicationTabs() {
    await this.updateApplicationFormTab(/참여(자| 기관) 신청 정보/)
    await this.updateApplicationFormTab('강사 신청 정보')
    await this.updateApplicationFormTab('봉사자 신청 정보')

    await this.logEditFieldNotes('4) 신청 정보 양식 수정', {
      changed: [
        {
          label: '양식 저장(PUT form-template)',
          reason: '양식 수정 모달을 열어 저장만 수행 — 문항/필드 값은 변경하지 않음',
        },
      ],
      unchanged: [
        {
          label: '신청 양식 문항·필드 전체',
          reason: '내용 미수정(열기→저장만). 참여자/강사/봉사자 탭 공통',
        },
      ],
    })
  }

  private async updateApplicationFormTab(tabLabel: string | RegExp) {
    const tab = this.page.getByRole('tab', { name: tabLabel }).first()
    const tabButton = this.page.getByRole('button', { name: tabLabel }).first()
    const tabVisible =
      ((await tab.count()) > 0 && (await tab.isVisible().catch(() => false))) ||
      ((await tabButton.count()) > 0 && (await tabButton.isVisible().catch(() => false)))
    if (!tabVisible) {
      return
    }

    if ((await tab.count()) > 0 && (await tab.isVisible().catch(() => false))) {
      await tab.click()
    } else {
      await tabButton.click()
    }

    const editButton = this.page.getByRole('button', { name: '양식 수정' }).first()
    await expect(editButton).toBeVisible({ timeout: 15_000 })
    await editButton.click()

    const modal = this.page
      .locator('.general-program-application-template-edit-modal, .full-page-modal')
      .last()
    await expect(modal).toBeVisible({ timeout: 30_000 })

    const loading = modal.locator('.form-draft-loading, [class*="FormDraftLoading"]')
    if ((await loading.count()) > 0) {
      await expect(loading.first()).toBeHidden({ timeout: 60_000 }).catch(() => undefined)
    }

    const saveButton = modal.getByRole('button', { name: '저장' }).first()
    await expect(saveButton).toBeVisible({ timeout: 30_000 })

    const putPromise = this.page
      .waitForResponse(
        res => {
          const method = res.request().method()
          if (method !== 'PUT' && method !== 'PATCH' && method !== 'POST') return false
          const path = new URL(res.url()).pathname
          return /form-template/i.test(path) && res.ok()
        },
        { timeout: 60_000 }
      )
      .catch(() => undefined)

    await saveButton.click()

    await putPromise

    const savedAlert = this.page.getByRole('dialog').filter({ hasText: '양식이 저장되었습니다.' })
    await expect(savedAlert).toBeVisible({ timeout: 30_000 })
    const confirm = savedAlert.getByRole('button', { name: /확인|닫기|OK/i }).first()
    if (await confirm.isVisible().catch(() => false)) {
      await confirm.click()
    } else {
      await this.page.keyboard.press('Escape').catch(() => undefined)
    }

    const closeModal = modal.getByRole('button', { name: '닫기' }).first()
    if (await closeModal.isVisible().catch(() => false)) {
      await closeModal.click()
    }
    await expect(modal).toBeHidden({ timeout: 30_000 }).catch(() => undefined)
  }

  async expectApplicationPreviewVisible() {
    await this.goToApplicationTab()
    await expect(
      this.page.getByText('현재 화면은 양식 미리보기 화면입니다.').first()
    ).toBeVisible({ timeout: 15_000 })
  }

  /** 참여자·강사·봉사자 각 탭: 수정 진입 → 채움 → 저장 → 조회 필드 대조 */
  async updateAllRecruitmentTabs(programId: string) {
    this.recruitmentEdited = []
    await this.updateRecruitmentTab(programId, '참여자 모집 정보', 'institutions', () =>
      this.fillRecruitParticipantFields()
    )
    await this.updateRecruitmentTab(programId, '참여 기관 모집 정보', 'institutions', () =>
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

    const snapshot: RecruitmentEditedSnapshot = {
      tabLabel,
      targetDetail: EDIT_TARGET_DETAIL,
      announceMethod: EDIT_ANNOUNCE_METHOD,
      contactName: EDIT_CONTACT_NAME,
      contactTel: EDIT_CONTACT_TEL,
      contactEmail: EDIT_CONTACT_EMAIL,
      remark: EDIT_REMARK,
      description: EDIT_DESCRIPTION,
      recruitGuide: EDIT_RECRUIT_GUIDE,
      applicationMethod: EDIT_APPLICATION_METHOD,
      learningSupport: EDIT_LEARNING_SUPPORT,
      etcGuide: EDIT_ETC_GUIDE,
      operationPeriod: await readDateTriggerNearLabel(this.page, '프로그램 운영 기간'),
    }

    await this.logEditFieldNotes(`3) 모집 정보 수정 › ${tabLabel}`, {
      changed: this.recruitmentSnapshotToChangedFields(snapshot),
      unchanged: await this.mergeUnchangedWithDomReadOnly(RECRUIT_INTENTIONALLY_UNCHANGED),
    })

    await this.clickInfoEditSave(programId)
    await expect(this.page).not.toHaveURL(new RegExp(`edit=${editParam}`), { timeout: 30_000 })

    this.recruitmentEdited.push(snapshot)
    await this.expectRecruitmentTabFieldsMatch(snapshot)
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
    // 발표일은 모집 기간보다 뒤여야 함 — 이미 값이 있어도 미래로 재설정
    await this.fillDateNearLabel('최종 합격자 발표', 'single', {
      preferFutureMonth: true,
      futureMonthClicks: 3,
    })
    await this.fillDateNearLabel('합격자 발표', 'single', {
      preferFutureMonth: true,
      futureMonthClicks: 3,
    })
    await fillParagraphDateByPlaceholder(this.page, '합격자 발표일', 'single')
    await fillParagraphDateByPlaceholder(this.page, '발표일', 'single')
    await fillByPlaceholderIfVisible(this.page, '발표 방법 안내', EDIT_ANNOUNCE_METHOD)
    // 「담당 문의처」는 후원사명 파생 readOnly — Tel/E-mail만 수정
    await fillByPlaceholderIfVisible(this.page, '문의처 전화번호', EDIT_CONTACT_TEL)
    await fillByPlaceholderIfVisible(this.page, '문의처 이메일', EDIT_CONTACT_EMAIL)
    await fillByPlaceholderIfVisible(
      this.page,
      '비고란을 작성하세요 (없으면 -로 입력)',
      EDIT_REMARK
    )
    await fillByPlaceholderIfVisible(this.page, '비고란을 작성하세요', EDIT_REMARK)

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
    await fillByPlaceholderIfVisible(this.page, '기타 안내 사항을 작성하세요', EDIT_ETC_GUIDE)
    await fillVisibleFreeTextFields(this.page, `E2E 수정 모집 ${EDIT_MARKER}`)
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

  /**
   * 공통 정보 조회 모드 — 수정 시 넣은 값이 각 필드 라벨 옆 내용과 일치하는지 확인.
   */
  async expectCommonInfoUpdated(snapshot?: CommonInfoEditedSnapshot | null) {
    const s = snapshot ?? this.commonEdited
    await this.ensureCommonInfoTab()

    await expectDetailInfoFieldContains(
      this.page,
      '대표 프로그램명 (국문)',
      EDITABLE_DUMMY_TITLE
    )

    if (!s) {
      await expect(this.page.getByText(EDIT_MARKER).first()).toBeVisible({ timeout: 15_000 })
      await expectDetailInfoFieldContains(this.page, '교육 장소', EDIT_EDUCATION_PLACE)
      await expectDetailInfoFieldContains(this.page, '공고용 프로그램명', EDIT_PUBLIC_NAME)
      return
    }

    await clickSectionNavIfVisible(this.page, '기본 정보')
    await expectDetailInfoFieldContains(this.page, '대표 프로그램명 (영문)', s.titleEn)
    await expectDetailInfoFieldContains(this.page, '공고용 프로그램명', s.publicName)
    if (s.detailedProgramName) {
      await expectDetailInfoFieldContains(this.page, '세부 프로그램명', s.detailedProgramName)
    }
    if (s.operationPeriod) {
      const periodHint = s.operationPeriod.match(/\d{4}/)?.[0]
      if (periodHint) {
        await expectDetailInfoFieldContains(this.page, '사업 운영 기간', periodHint)
      }
    }
    await expectDetailInfoFieldContains(this.page, '참여자 유형', /개인/)
    await expectDetailInfoFieldContains(this.page, '참여자 유형', /강사|교사/)
    await expectDetailInfoFieldContains(this.page, '참여자 유형', /봉사/)
    await expectDetailInfoFieldContains(this.page, '사업 분야', s.businessArea)
    if (s.sponsorName) {
      // multiple UI는 "A, B, C" — 조회는 동일 이름·콤마 구분. 첫 이름만으로도 충분
      const sponsorHint = s.sponsorName.split(',')[0]?.trim() || s.sponsorName
      await expectDetailInfoFieldContains(this.page, '후원사', sponsorHint)
    }
    if (s.sponsorManager) {
      // 편집 Select: "후원사 · 직책 이름" / 조회: "직책 이름 | 연락처"
      const afterSponsor = s.sponsorManager.includes('·')
        ? s.sponsorManager.split('·').pop()!.trim()
        : s.sponsorManager
      const managerHint = afterSponsor.split('|')[0]?.trim() || afterSponsor
      await expectDetailInfoFieldContains(this.page, '후원사 담당자', managerHint, {
        required: false,
      })
    }
    await expectDetailInfoFieldContains(this.page, '교육 장소', s.venueKind)
    await expectDetailInfoFieldContains(this.page, '교육 장소', s.educationPlace)
    await expectDetailInfoFieldContains(this.page, '설문 진행 항목', /설문/, { required: false })

    await clickSectionNavIfVisible(this.page, '프로그램 유형 설정')
    await expectDetailInfoFieldContains(this.page, '교육 진행 구조', s.educationStructure)
    await expectDetailInfoFieldContains(this.page, '수업 회차 유형', s.sessionRound)
    await expectDetailInfoFieldContains(this.page, '교육 형태', s.educationForm)
    await expectDetailInfoFieldContains(this.page, '참여 방식', s.participationMethod, {
      required: false,
    })
    await expectDetailInfoFieldContains(this.page, 'IPS 유형', s.ipsType, { required: false })

    await clickSectionNavIfVisible(this.page, '교육 진행 (커리큘럼)')
    await expectDetailInfoFieldContains(this.page, '단원명 및 교육 내용', s.curriculumUnit, {
      required: false,
    })
    await expectDetailInfoFieldContains(this.page, '단원명 및 교육 내용', s.curriculumContent, {
      required: false,
    })

    await clickSectionNavIfVisible(this.page, '사업 KPI 목표')
    await expectDetailInfoFieldContains(this.page, '참여자 최종 인원', s.kpiValue, {
      required: false,
    })

    await clickSectionNavIfVisible(this.page, '임금 정보')
    const wagePattern = new RegExp(s.wageValue.replace(/(\d)(?=(\d{3})+$)/g, '$1,?'))
    await expectDetailInfoFieldContains(this.page, '1급 강사비', wagePattern, { required: false })
  }

  /** 모집 탭 조회 모드 — 해당 탭에서 수정한 문의·비고·상세 등 필드 대조 */
  async expectRecruitmentTabFieldsMatch(snapshot: RecruitmentEditedSnapshot) {
    await clickRegistrationTabIfVisible(this.page, snapshot.tabLabel)
    await expect(this.page.getByRole('button', { name: '정보 수정' }).first()).toBeVisible({
      timeout: 15_000,
    })

    await expectDetailInfoFieldContains(this.page, '교육 대상 상세', snapshot.targetDetail, {
      required: false,
    })
    if (snapshot.operationPeriod) {
      const periodHint = snapshot.operationPeriod.match(/\d{4}/)?.[0]
      if (periodHint) {
        await expectDetailInfoFieldContains(this.page, '프로그램 운영 기간', periodHint, {
          required: false,
        })
      }
    }
    await expectDetailInfoFieldContains(this.page, '문의처', snapshot.contactTel, {
      required: false,
    })
    await expectDetailInfoFieldContains(this.page, '문의처', snapshot.contactEmail, {
      required: false,
    })
    await expectDetailInfoFieldContains(this.page, '비고', snapshot.remark, { required: false })
    await expect(this.page.getByText(EDIT_MARKER).first()).toBeVisible({ timeout: 15_000 })
  }

  /** 수정했던 모든 모집 탭을 다시 열어 필드 일치 재확인 */
  async expectAllRecruitmentInfoUpdated(snapshots?: readonly RecruitmentEditedSnapshot[]) {
    const list = snapshots ?? this.recruitmentEdited
    await this.goToRecruitmentTab()
    for (const snap of list) {
      await this.expectRecruitmentTabFieldsMatch(snap)
    }
  }

  async expectDummyVisibleInList(programId?: string) {
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

    // openByTitle 과 동일 — 일시적 BE 5xx/빈 body 에 재조회 (첫 실패로 즉시 throw 하지 않음)
    await expect(async () => {
      await titleFilter.fill(EDITABLE_DUMMY_TITLE)
      const listWait = this.page.waitForResponse(
        res =>
          res.request().method() === 'GET' &&
          /\/api\/admin\/programs/.test(new URL(res.url()).pathname),
        { timeout: 30_000 }
      )
      await this.page.getByRole('button', { name: '조회' }).click()
      const listResponse = await listWait
      if (!listResponse.ok()) {
        const body = await listResponse.text().catch(() => '')
        throw new Error(
          [
            `프로그램 목록 API 실패(백엔드): HTTP ${listResponse.status()}`,
            listResponse.url(),
            body.slice(0, 300) || '(empty body)',
            `— 「${EDITABLE_DUMMY_TITLE}」 행을 확인할 수 없습니다.`,
          ].join('\n')
        )
      }

      if (programId) {
        const byId = this.page.locator(`tr[data-row-key="${programId}"]`)
        if ((await byId.count()) > 0) {
          await expect(byId).toBeVisible({ timeout: 5_000 })
          await expect(byId).toContainText(EDITABLE_DUMMY_TITLE)
          return
        }
      }
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

  private snapshotToChangedFields(snapshot: CommonInfoEditedSnapshot): FieldLogItem[] {
    return [
      { label: '대표 프로그램명 (영문)', value: snapshot.titleEn },
      { label: '공고용 프로그램명', value: snapshot.publicName },
      { label: '세부 프로그램명', value: snapshot.detailedProgramName },
      { label: '사업 운영 기간', value: snapshot.operationPeriod },
      { label: '사업 분야', value: snapshot.businessArea },
      { label: '후원사', value: snapshot.sponsorName },
      { label: '후원사 담당자', value: snapshot.sponsorManager },
      { label: '교육 장소 유형', value: snapshot.venueKind },
      { label: '교육 장소', value: snapshot.educationPlace },
      { label: '교육 진행 구조', value: snapshot.educationStructure },
      { label: '수업 회차 유형', value: snapshot.sessionRound },
      { label: '교육 형태', value: snapshot.educationForm },
      { label: '참여 방식', value: snapshot.participationMethod },
      { label: 'IPS 유형', value: snapshot.ipsType },
      { label: '커리큘럼 단원', value: snapshot.curriculumUnit },
      { label: '커리큘럼 교육 내용', value: snapshot.curriculumContent },
      { label: '사업 KPI 목표값', value: snapshot.kpiValue },
      { label: '임금 직접 입력', value: snapshot.wageValue },
    ]
  }

  private recruitmentSnapshotToChangedFields(
    snapshot: RecruitmentEditedSnapshot
  ): FieldLogItem[] {
    return [
      { label: `${snapshot.tabLabel} · 상세 교육/모집 대상`, value: snapshot.targetDetail },
      { label: `${snapshot.tabLabel} · 프로그램 운영 기간`, value: snapshot.operationPeriod },
      { label: `${snapshot.tabLabel} · 발표 방법`, value: snapshot.announceMethod },
      { label: `${snapshot.tabLabel} · 문의처 전화`, value: snapshot.contactTel },
      { label: `${snapshot.tabLabel} · 문의처 이메일`, value: snapshot.contactEmail },
      { label: `${snapshot.tabLabel} · 비고`, value: snapshot.remark },
      { label: `${snapshot.tabLabel} · 프로그램 설명`, value: snapshot.description },
      { label: `${snapshot.tabLabel} · 모집 안내`, value: snapshot.recruitGuide },
      { label: `${snapshot.tabLabel} · 지원 방법`, value: snapshot.applicationMethod },
      { label: `${snapshot.tabLabel} · 학습 지원`, value: snapshot.learningSupport },
      { label: `${snapshot.tabLabel} · 기타 안내`, value: snapshot.etcGuide },
    ]
  }

  /** DOM에서 readOnly/disabled 입력 필드 라벨을 모아 미수정 목록에 합칩니다. */
  private async mergeUnchangedWithDomReadOnly(
    intentional: FieldLogItem[]
  ): Promise<FieldLogItem[]> {
    const byLabel = new Map<string, FieldLogItem>()
    for (const item of intentional) {
      byLabel.set(item.label, item)
    }

    const readOnlyLabels = await this.page
      .locator('.detail-info-form__field')
      .evaluateAll(nodes => {
        const labels: string[] = []
        for (const node of nodes) {
          const el = node as {
            offsetParent: unknown
            querySelector: (selector: string) => unknown
          }
          if (el.offsetParent === null) continue
          const labelEl = el.querySelector('.detail-info-form__field-label-text') as
            | { textContent?: string | null }
            | null
          const label =
            labelEl?.textContent?.trim() ?? ''
          if (!label) continue
          const locked =
            el.querySelector(
              'input[readonly], input[disabled], textarea[readonly], textarea[disabled], .ant-input-disabled, .ant-select-disabled, [aria-disabled="true"]'
            ) != null
          if (locked) labels.push(label)
        }
        return labels
      })
      .catch(() => [] as string[])

    for (const label of readOnlyLabels) {
      if (byLabel.has(label)) continue
      byLabel.set(label, {
        label,
        reason: '화면상 readOnly/disabled — E2E에서 값을 바꾸지 않음',
      })
    }

    return [...byLabel.values()]
  }

  private async logEditFieldNotes(
    stepTitle: string,
    fields: { changed: FieldLogItem[]; unchanged: FieldLogItem[] }
  ) {
    const title = `${EDIT_LOG_TITLE_PREFIX} › ${stepTitle}`
    await recordE2eTestLogNotes({
      page: this.page,
      title,
      titlePath: [
        'flows/programs/general-program-edit.spec.ts',
        '일반 프로그램 수정',
        stepTitle,
      ],
      file: 'tests/e2e/flows/programs/general-program-edit.spec.ts',
      notes: [
        {
          phase: 'edit:changed-fields',
          message: `변경 필드 ${fields.changed.length}건`,
          detail: JSON.stringify(fields.changed, null, 2),
        },
        {
          phase: 'edit:unchanged-fields',
          message: `미수정 필드 ${fields.unchanged.length}건`,
          detail: JSON.stringify(fields.unchanged, null, 2),
        },
      ],
    })
  }

  /**
   * 프로그램 진행 현황 — 참여 기관·참여자 / 강사 / 봉사자 목록 셸이 보이는지 확인.
   * 공통 정보에서 참여 방식=개인이면 `교육 참여자 목록`, 기관이면 `교육 참여 기관 목록`.
   * remote ON + 빈 시드면 0건일 수 있음(의도적 mock 미폴백) — 제목·테이블 셸만 필수.
   * 탭 전환 중 상세 로드 실패(BE 5xx)면 해당 탭만 스킵 — 하나 이상 확인되면 통과.
   */
  async expectProgressParticipantMockLists(programId: string) {
    const tabs: { tab: string; titles: string[] }[] = [
      {
        tab: 'progress_participants',
        titles: [
          '교육 참여 기관 목록',
          '교육 참여자 목록',
          '참여자 목록',
          '교육 참여 참여자 목록',
        ],
      },
      { tab: 'progress_instructors', titles: ['교육 참여 강사 목록'] },
      { tab: 'progress_volunteers', titles: ['참여 봉사자 목록'] },
    ]

    let verified = 0
    const skipped: string[] = []

    for (const { tab, titles } of tabs) {
      const opened = await this.tryOpenProgressTab(programId, tab)
      if (!opened) {
        skipped.push(`${tab}: LNB/상세 진입 실패`)
        continue
      }
      const ok = await this.tryExpectProgressListVisible(titles)
      if (ok) {
        verified += 1
      } else {
        skipped.push(`${tab}: 목록 제목 없음 (${titles.join(' | ')})`)
      }
    }

    expect(
      verified,
      `진행 현황 목록을 하나 이상 확인해야 합니다. skipped=[${skipped.join('; ')}]`
    ).toBeGreaterThan(0)
  }

  /** 진행 현황 탭 딥링크 — 상세 로드 실패 시 1회 재시도 */
  private async tryOpenProgressTab(programId: string, tab: string): Promise<boolean> {
    for (let attempt = 0; attempt < 2; attempt += 1) {
      const opened = await this.detail.tryGotoLnb(programId, 'progress', tab)
      if (!opened) continue
      if (await this.isProgramDetailLoadFailed()) {
        if (attempt === 0) continue
        return false
      }
      return true
    }
    return false
  }

  private async isProgramDetailLoadFailed(): Promise<boolean> {
    const error = this.page.getByText('프로그램 정보를 불러오지 못했습니다')
    return (await error.isVisible().catch(() => false)) === true
  }

  /**
   * FilterTableLayout 제목 후보 중 보이는 것과 목록 셸 확인.
   * 건수가 0이 아니면 행도 확인한다. 제목을 못 찾으면 false.
   */
  private async tryExpectProgressListVisible(listTitles: string[]): Promise<boolean> {
    // 탭 전환 직후 제목 렌더 대기 (없으면 바로 false)
    const modalContent = this.page.locator('.detail-fullpage-modal__content').first()
    await expect(modalContent).toBeVisible({ timeout: 15_000 }).catch(() => undefined)
    await expect(modalContent.locator('.filter-table-layout__title').first())
      .toBeVisible({ timeout: 15_000 })
      .catch(() => undefined)

    let layout = modalContent.locator('.filter-table-layout').first()
    let found = false
    const normalize = (value: string) => value.replace(/\s+/g, '')
    for (const listTitle of listTitles) {
      const candidate = modalContent
        .locator('.filter-table-layout')
        .filter({
          has: this.page.locator('.filter-table-layout__title', { hasText: listTitle }),
        })
        .first()
      if ((await candidate.count()) === 0) continue
      if (!(await candidate.isVisible().catch(() => false))) continue
      const titleText = (
        await candidate.locator('.filter-table-layout__title').first().innerText()
      ).trim()
      if (!normalize(titleText).includes(normalize(listTitle))) continue
      layout = candidate
      found = true
      break
    }
    if (!found) {
      // 카피가 바뀌어도 모달 내 단일 목록 셸이면 통과 (예: 참여자/참여기관 명칭 변경)
      const fallbackLayout = modalContent
        .locator('.filter-table-layout')
        .filter({ has: this.page.locator('.filter-table-layout__title') })
        .first()
      if ((await fallbackLayout.count()) === 0) return false
      if (!(await fallbackLayout.isVisible().catch(() => false))) return false
      const fallbackTitle = (
        await fallbackLayout.locator('.filter-table-layout__title').first().innerText()
      ).trim()
      if (!fallbackTitle.includes('목록') && !fallbackTitle.includes('참여')) return false
      layout = fallbackLayout
    }

    await expect(layout).toBeVisible({ timeout: 30_000 })

    const countLabel = layout.locator('.filter-table-layout__description').first()
    await expect(countLabel).toBeVisible({ timeout: 30_000 })
    const countText = (await countLabel.innerText()).trim()

    if (countText === '0건') {
      await expect(
        layout.locator('.ant-empty, .ant-table-placeholder, .ant-table').first()
      ).toBeVisible({ timeout: 30_000 })
      return true
    }

    const rows = layout.locator('tbody.ant-table-tbody tr.ant-table-row')
    await expect(rows.first()).toBeVisible({ timeout: 30_000 })
    return true
  }

  /**
   * 라벨 근처 ParagraphDatePicker — 이미 값이 있어도 다시 열어 미래 날짜를 고른다.
   * (placeholder 기반 헬퍼는 값이 채워지면 트리거를 못 찾음)
   */
  private async fillDateNearLabel(
    label: string,
    mode: 'single' | 'range',
    options?: { preferFutureMonth?: boolean; futureMonthClicks?: number }
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
      const clicks = options.futureMonthClicks ?? 2
      const nextBtn = dialog.locator('button.ant-picker-header-next-btn').first()
      if ((await nextBtn.count()) > 0) {
        for (let i = 0; i < clicks; i += 1) {
          await nextBtn.click().catch(() => undefined)
        }
      }
    }

    const days = dialog.locator(
      '.ant-picker-cell-in-view:not(.ant-picker-cell-disabled) .calendar-mini-cell'
    )
    await expect(days.first()).toBeVisible({ timeout: 5_000 })
    const dayCount = await days.count()
    // single(발표일)은 월말 쪽, range(모집)는 그보다 앞선 구간을 고른다
    const startIdx =
      mode === 'single'
        ? Math.max(dayCount - 2, 0)
        : Math.min(Math.max(dayCount - 8, 0), Math.max(dayCount - 2, 0))
    await days.nth(startIdx).click({ force: true })
    if (mode === 'range' && dayCount > 1) {
      await days.nth(Math.min(startIdx + 3, dayCount - 1)).click({ force: true })
    }

    await dialog.getByRole('button', { name: '설정' }).click()
    await expect(dialog).toBeHidden({ timeout: 10_000 })
  }
}
