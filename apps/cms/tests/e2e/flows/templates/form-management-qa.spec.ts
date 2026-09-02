import { test, expect } from '../../fixtures/test'
import {
  FORM_MANAGEMENT_URL,
  ISSUANCE_URL,
  FORM_TEST_URL,
  FORM_TEST_TABLES_URL,
  openTemplateByName,
  closeTemplateEditor,
  saveAndConfirm,
  selectParagraphByNavLabel,
  clickMultipleChoiceOption,
  openWritingPreview,
  closeWritingPreview,
  assertMultipleChoiceSurvivesParagraphSwitchById,
  paragraphCardById,
} from '../../helpers/form-template-editor-helpers'
import {
  WRITING_TEMPLATE_NAMES,
  ISSUANCE_TEMPLATE_NAMES,
  CRIME_CONSENT_TEMPLATE_NAME,
  E2E_OPEN_SAVE_SKIP_TEMPLATE_NAMES,
} from '../../helpers/form-template-catalog'

test.describe.configure({ mode: 'serial' })

test.describe('폼 양식 관리 — 브라우저 QA (전수)', () => {

  test('작성 양식 목록이 로드된다', async ({ page }) => {
    await page.goto(FORM_MANAGEMENT_URL)
    await expect(page.getByText('등록 양식')).toBeVisible()
    await expect(page.getByText('모집 양식')).toBeVisible()
    await expect(page.getByText('신청 양식')).toBeVisible()
    await expect(page.getByText('설문 양식')).toBeVisible()
    await expect(page.getByText('동의 양식')).toBeVisible()
  })

  test('모집 — 공통_강사 모집: 전면 잠금(단락 추가 없음) + 저장', async ({ page }) => {
    await page.goto(FORM_MANAGEMENT_URL)
    await openTemplateByName(page, '공통_강사 모집 폼')
    await expect(page.getByText('모든 항목은 추가, 삭제 및 수정이 불가합니다')).toBeVisible()
    await expect(page.getByRole('button', { name: '단락 추가' })).toHaveCount(0)
    await saveAndConfirm(page)
    await closeTemplateEditor(page)
  })

  test('모집 — UJAT 참여 기관: 저장·재진입', async ({ page }) => {
    await page.goto(FORM_MANAGEMENT_URL)
    await openTemplateByName(page, 'UJAT_참여 기관 모집 폼')
    await expect(page.getByRole('button', { name: '단락 추가' })).toHaveCount(0)
    await saveAndConfirm(page)
    await closeTemplateEditor(page)
    await openTemplateByName(page, 'UJAT_참여 기관 모집 폼')
    await expect(page.getByRole('button', { name: '저장' })).toBeVisible()
    await closeTemplateEditor(page)
  })

  test('신청 — 공통_강사 신청: 에디터·저장', async ({ page }) => {
    await page.goto(FORM_MANAGEMENT_URL)
    await openTemplateByName(page, '공통_강사 신청 폼')
    await expect(page.getByText('커스텀 필드')).toBeVisible()
    await saveAndConfirm(page)
    await closeTemplateEditor(page)
  })

  test('신청 — UJAT 참여 기관 신청: 에디터·저장', async ({ page }) => {
    await page.goto(FORM_MANAGEMENT_URL)
    await openTemplateByName(page, 'UJAT_참여 기관 신청 폼')
    await saveAndConfirm(page)
    await closeTemplateEditor(page)
  })

  test('설문 — 설문조사: 에디터·미리보기·저장', async ({ page }) => {
    await page.goto(FORM_MANAGEMENT_URL)
    await openTemplateByName(page, '설문조사')
    await openWritingPreview(page)
    await expect(page.getByText('설문조사').first()).toBeVisible()
    await closeWritingPreview(page)
    await saveAndConfirm(page)
    await closeTemplateEditor(page)
  })

  test('동의 — 초상권: A4 셸·저장', async ({ page }) => {
    await page.goto(FORM_MANAGEMENT_URL)
    await openTemplateByName(page, '초상권 수집·이용 동의')
    await saveAndConfirm(page)
    await closeTemplateEditor(page)
  })

  test('동의 — 성범죄 경력조회: 전용 모달', async ({ page }) => {
    await page.goto(FORM_MANAGEMENT_URL)
    await openTemplateByName(page, CRIME_CONSENT_TEMPLATE_NAME, { expectSaveButton: false })
    await expect(page.getByText('해당 폼은 기존 항목의 삭제가 불가하며')).toBeVisible()
    await expect(page.getByRole('button', { name: '문서 다운로드' })).toBeVisible()
    await expect(page.getByRole('button', { name: '문서 변경' })).toBeVisible()
    await page.locator('.crime-consent-doc-modal__close').click()
  })

  test('발급 — 보고·서류 탭 목록 및 대표 양식 저장', async ({ page }) => {
    await page.goto(ISSUANCE_URL)
    await expect(page.getByText('보고 양식')).toBeVisible()
    await expect(page.getByText('서류 양식')).toBeVisible()
    await expect(page.getByText('결과보고서')).toHaveCount(0)

    await openTemplateByName(page, 'UJAT 교육계획서')
    await saveAndConfirm(page)
    await closeTemplateEditor(page)

    await openTemplateByName(page, '강의보고서')
    await saveAndConfirm(page)
    await closeTemplateEditor(page)

    await openTemplateByName(page, '수료증')
    await saveAndConfirm(page)
    await closeTemplateEditor(page)
  })

  test('신규 설문 — 저장 후 edit 모드 전환', async ({ page }) => {
    await page.goto('/templates/form-management?tab=template-form&mode=new&type=survey')
    await expect(page.getByRole('button', { name: '저장' })).toBeVisible()
    await saveAndConfirm(page)
    await expect(page).toHaveURL(/mode=edit/)
    await expect(page.getByRole('button', { name: '저장' })).toBeVisible()
    await closeTemplateEditor(page)
  })

  test('P0 — 교육진행자 서약: 객관식 선택이 단락 이동·미리보기에 유지', async ({ page }) => {
    await page.goto(FORM_MANAGEMENT_URL)
    await openTemplateByName(page, '교육진행자 동의 서약서')

    await assertMultipleChoiceSurvivesParagraphSwitchById(
      page,
      'agreement-expense-pledge-clause-1',
      /종교적 정치적/,
      /아동·청소년 보호/,
      '동의'
    )

    await openWritingPreview(page)
    await expect(
      page.locator('.form-document-preview-body, .template-writing-preview').locator('.ant-radio-checked')
    ).not.toHaveCount(0)
    await closeWritingPreview(page)

    await saveAndConfirm(page)
    await closeTemplateEditor(page)
  })

  test('P0 — 행정정보: 에디터·저장', async ({ page }) => {
    await page.goto(FORM_MANAGEMENT_URL)
    await openTemplateByName(page, '행정정보 공동이용 사전 동의서')
    await saveAndConfirm(page)
    await closeTemplateEditor(page)
  })

  test('P0 — UJAT 봉사자 신청: 제출 확인 객관식 단락 이동 유지', async ({ page }) => {
    await page.goto(FORM_MANAGEMENT_URL)
    await openTemplateByName(page, 'UJAT_봉사자 신청 폼')

    await assertMultipleChoiceSurvivesParagraphSwitchById(
      page,
      'ujat-program-application-volunteer-seed-submit-confirmation',
      /기본 정보/,
      /상기 내용 모두 확인/,
      /네, 상기 내용 모두 확인/
    )

    await saveAndConfirm(page)
    await closeTemplateEditor(page)
  })

  test('P0 — 등록 일반 프로그램: 저장·재진입', async ({ page }) => {
    await page.goto(FORM_MANAGEMENT_URL)
    await openTemplateByName(page, '일반 프로그램 등록 폼')
    await saveAndConfirm(page)
    await closeTemplateEditor(page)
    await openTemplateByName(page, '일반 프로그램 등록 폼')
    await expect(page.getByRole('button', { name: '저장' })).toBeVisible()
    await closeTemplateEditor(page)
  })

  test('양식 테스트 — 단일 항목: 객관식 blur 시 초기화(설문 authoring)', async ({ page }) => {
    await page.goto(FORM_TEST_URL)
    await page.getByRole('button', { name: '단일 항목 모음' }).click()
    await expect(page.getByRole('button', { name: '미리보기' })).toBeVisible({ timeout: 15_000 })

    await selectParagraphByNavLabel(page, /객관식/)
    const mcCard = paragraphCardById(page, 'multiple-choice')
    await clickMultipleChoiceOption(page, 'text 1', mcCard)
    await selectParagraphByNavLabel(page, /주관식/)
    await selectParagraphByNavLabel(page, /객관식/)
    await expect(mcCard.locator('.ant-radio-checked')).toHaveCount(0)

    await page.locator('.full-page-modal__close').click()
  })

  test('양식 테스트 — 단일 항목 모음: 9종 네비·미리보기', async ({ page }) => {
    await page.goto(FORM_TEST_URL)
    await page.getByRole('button', { name: '단일 항목 모음' }).click()
    await expect(page.getByRole('button', { name: '미리보기' })).toBeVisible({ timeout: 15_000 })
    await expect(page.getByText('객관식형').first()).toBeVisible()
    await openWritingPreview(page)
    await closeWritingPreview(page)
    await page.locator('.full-page-modal__close').click()
  })

  test('양식 테스트 — 설명글 유형 모음 진입', async ({ page }) => {
    await page.goto(FORM_TEST_URL)
    await page.getByRole('button', { name: '설명글 유형 모음' }).click()
    await expect(page.getByRole('button', { name: '미리보기' })).toBeVisible({ timeout: 15_000 })
    await page.locator('.full-page-modal__close').click()
  })

  test('양식 테스트 — 테이블 가로형 페이지 로드', async ({ page }) => {
    await page.goto(FORM_TEST_TABLES_URL)
    await expect(page.getByText('테이블').first()).toBeVisible({ timeout: 15_000 })
  })

  for (const templateName of WRITING_TEMPLATE_NAMES) {
    test(`작성 — ${templateName}: 열기·저장`, async ({ page }) => {
      test.skip(
        E2E_OPEN_SAVE_SKIP_TEMPLATE_NAMES.has(templateName),
        '앱 크래시 — form-template-fe-gap-report.md'
      )
      await page.goto(FORM_MANAGEMENT_URL)
      if (templateName === CRIME_CONSENT_TEMPLATE_NAME) {
        await openTemplateByName(page, templateName, { expectSaveButton: false })
        await expect(page.getByRole('button', { name: '문서 다운로드' })).toBeVisible()
        await page.locator('.crime-consent-doc-modal__close').click()
        return
      }
      await openTemplateByName(page, templateName)
      await saveAndConfirm(page)
      await closeTemplateEditor(page)
    })
  }

  for (const templateName of ISSUANCE_TEMPLATE_NAMES) {
    test(`발급 — ${templateName}: 열기·저장`, async ({ page }) => {
      await page.goto(ISSUANCE_URL)
      await openTemplateByName(page, templateName)
      await saveAndConfirm(page)
      await closeTemplateEditor(page)
    })
  }
})
