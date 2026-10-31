/** @vitest-environment jsdom */
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { PROGRAM_REGISTRATION_IDS } from '@/features/template/model/program-registration-draft'
import {
  REQUIRED_FIELDS_INCOMPLETE_ALERT_MESSAGE,
  REQUIRED_FIELDS_INCOMPLETE_ALERT_TITLE,
} from '@/shared/constants/messages'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { FormParagraphSectionHeader } from '@/features/template/ui/shared/form-paragraph-section-header'
import {
  RegistrationWizardValidationHighlightProvider,
  RegistrationWizardValidationHighlightSync,
} from '@/features/program/shared/ui/registration/registration-wizard-validation-highlight'
import { ProgramEditInfoActions } from '@/features/program/shared/ui/program-edit-info-actions'
import { resolveRegistrationWizardIncompleteParagraphIds } from '@/features/program/shared/lib/registration-wizard-incomplete-map'
import {
  curriculumRegularSessionContentValidationKeys,
  resolveGeneralCommonInfoValidationAlert,
} from './common-info-rhf-validation'

vi.mock('@/shared/ui', async () => {
  const { createElement: create } = await import('react')
  return {
    CmsButton: ({
      children,
      loading,
      disabled,
      variant,
      size: _size,
      ...props
    }: React.ButtonHTMLAttributes<HTMLButtonElement> & {
      loading?: boolean
      variant?: string
      size?: string
    }) =>
      create(
        'button',
        { ...props, disabled: disabled || loading, 'data-variant': variant },
        children
      ),
  }
})

afterEach(cleanup)

function HighlightHarness({
  nonce,
  keys,
}: {
  nonce: number
  keys: readonly string[]
}) {
  return (
    <RegistrationWizardValidationHighlightProvider variant="general">
      <RegistrationWizardValidationHighlightSync nonce={nonce} keys={keys} variant="general" />
      <FormParagraphSectionHeader
        title="기본 정보"
        highlightParagraphId={PROGRAM_REGISTRATION_IDS.basicInfo}
        required
      />
      <FormParagraphSectionHeader
        title="임금 정보"
        highlightParagraphId={PROGRAM_REGISTRATION_IDS.wageInfo}
        required
      />
      <FormParagraphSectionHeader
        title="교육 진행"
        highlightParagraphId={PROGRAM_REGISTRATION_IDS.educationCurriculum}
        required
      />
      <DetailInfoForm title="공통정보" hideHeader mode="edit">
        <DetailInfoForm.Field
          label="대표 프로그램명 (국문)"
          validationKey="basicInfo.programTitleKo"
          edit={<input aria-label="대표 프로그램명 (국문)" />}
          view="-"
        />
        <DetailInfoForm.Field
          label="1급 강사비"
          validationKey="wage.grade1Fee"
          edit={<input aria-label="1급 강사비" />}
          view="-"
        />
        <DetailInfoForm.Field
          label="1회차 수업"
          validationKey={curriculumRegularSessionContentValidationKeys(1)}
          edit={<input aria-label="1회차 수업" />}
          view="-"
        />
        <DetailInfoForm.Field
          label="2회차 수업"
          validationKey={curriculumRegularSessionContentValidationKeys(2)}
          edit={<input aria-label="2회차 교육 내용" />}
          view="-"
        />
      </DetailInfoForm>
    </RegistrationWizardValidationHighlightProvider>
  )
}

describe('일반 공통정보 수정 검증 UX', () => {
  beforeEach(() => {
    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
      configurable: true,
      writable: true,
      value: vi.fn(),
    })
  })

  it('VAL-01 필수값 누락 팝업은 등록 위저드 공통 문구를 쓴다', () => {
    const alert = resolveGeneralCommonInfoValidationAlert({
      alertKind: 'required-incomplete',
      message: '2회차 내용을 입력해주세요',
    })
    expect(alert.title).toBe(REQUIRED_FIELDS_INCOMPLETE_ALERT_TITLE)
    expect(alert.content).toBe(REQUIRED_FIELDS_INCOMPLETE_ALERT_MESSAGE)
  })

  it('VAL-02·VAL-03 사전교육 ON 2회차 미입력은 실제 2회차 Field만 강조한다', () => {
    const { container } = render(
      <HighlightHarness nonce={1} keys={['curriculum.unitContent[2]']} />
    )
    const second = container.querySelector('[data-wizard-field-key*="curriculum.unitContent[2]"]')
    const first = container.querySelector('[data-wizard-field-key*="curriculum.unitContent[1]"]')
    expect(second?.className).toContain('detail-info-form__field--required-incomplete')
    expect(first?.className).not.toContain('detail-info-form__field--required-incomplete')
    const curriculumHeader = container.querySelector(
      `[data-paragraph-id="${PROGRAM_REGISTRATION_IDS.educationCurriculum}"]`
    )
    expect(curriculumHeader?.className).toContain('form-paragraph-section-header--required-incomplete')
  })

  it('VAL-04 기본 정보 필수값 누락은 기본 정보 단락을 강조한다', () => {
    const { container } = render(
      <HighlightHarness nonce={1} keys={['basicInfo.programTitleKo']} />
    )
    const header = container.querySelector(
      `[data-paragraph-id="${PROGRAM_REGISTRATION_IDS.basicInfo}"]`
    )
    expect(header?.className).toContain('form-paragraph-section-header--required-incomplete')
    const field = container.querySelector('[data-wizard-field-key="basicInfo.programTitleKo"]')
    expect(field?.className).toContain('detail-info-form__field--required-incomplete')
  })

  it('VAL-05 임금 정보 필수값 누락은 임금 정보 단락을 강조한다', () => {
    const { container } = render(<HighlightHarness nonce={1} keys={['wage.grade1Fee']} />)
    const header = container.querySelector(
      `[data-paragraph-id="${PROGRAM_REGISTRATION_IDS.wageInfo}"]`
    )
    expect(header?.className).toContain('form-paragraph-section-header--required-incomplete')
  })

  it('VAL-03 스크롤 대상은 교육 진행 단락이다', () => {
    const ids = resolveRegistrationWizardIncompleteParagraphIds(
      ['curriculum.unitContent[2]'],
      'general'
    )
    expect([...ids]).toEqual([PROGRAM_REGISTRATION_IDS.educationCurriculum])
    render(<HighlightHarness nonce={1} keys={['curriculum.unitContent[2]']} />)
    expect(HTMLElement.prototype.scrollIntoView as ReturnType<typeof vi.fn>).toHaveBeenCalled()
  })

  it('VAL-12 강조는 nonce 0 에서 초기화된다', () => {
    const { container, rerender } = render(
      <HighlightHarness nonce={1} keys={['basicInfo.programTitleKo']} />
    )
    expect(
      container.querySelector('[data-wizard-field-key="basicInfo.programTitleKo"]')?.className
    ).toContain('detail-info-form__field--required-incomplete')
    rerender(<HighlightHarness nonce={0} keys={[]} />)
    expect(
      container.querySelector('[data-wizard-field-key="basicInfo.programTitleKo"]')?.className
    ).not.toContain('detail-info-form__field--required-incomplete')
  })

  it('VAL-13 편집 중 정보 수정 클릭은 onSave를 한 번 호출한다', () => {
    const onSave = vi.fn()
    render(
      <ProgramEditInfoActions
        isEditing
        onEdit={vi.fn()}
        onCancel={vi.fn()}
        onSave={onSave} />
    )
    fireEvent.click(screen.getByRole('button', { name: '정보 수정' }))
    expect(onSave).toHaveBeenCalledOnce()
  })
})
