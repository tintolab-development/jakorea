// @vitest-environment jsdom
import { cleanup, render } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  AGREEMENT_PORTRAIT_PARAGRAPH_IDS,
  AGREEMENT_PORTRAIT_SEED_PARAGRAPH_IDS,
  createAgreementPortraitDraft,
} from '@/features/template/model/writing-form-draft.schema'
import { FormEditorRightPanel } from './form-editor-right-panel'

// antd Form(Grid) 반응형 훅용 jsdom 폴리필
if (typeof window !== 'undefined' && !window.matchMedia) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => false,
    }),
  })
}

const STRUCTURE_LOCKED_HINT = /해당 단락은 수정 및 삭제가 불가합니다/

function renderPanel(
  activeParagraphId: string,
  locks: {
    structureLockedParagraphIds?: ReadonlySet<string>
    structureControlLockedParagraphIds?: ReadonlySet<string>
  },
  extra?: { verticalTableBodyRowSelection?: { paragraphId: string; row: number } }
) {
  return render(
    <FormEditorRightPanel
      draft={createAgreementPortraitDraft()}
      activeParagraphId={activeParagraphId}
      onTitleNumberingChange={vi.fn()}
      updateParagraph={vi.fn()}
      editorKind="agreement"
      showTitleNumbering={false}
      verticalTableBodyRowSelection={extra?.verticalTableBodyRowSelection ?? null}
      {...locks}
    />
  )
}

describe('FormEditorRightPanel — 구조 조작 전용 잠금 (템플릿 관리 시스템 동의 양식, QA 261113 #16)', () => {
  afterEach(cleanup)

  it('본문 잠금이면 잠금 안내만 보이고 문구 필드는 없다', () => {
    const { queryByText, getByText } = renderPanel(AGREEMENT_PORTRAIT_PARAGRAPH_IDS.intro, {
      structureLockedParagraphIds: AGREEMENT_PORTRAIT_SEED_PARAGRAPH_IDS,
    })
    expect(getByText(STRUCTURE_LOCKED_HINT)).toBeInTheDocument()
    expect(queryByText('입력창 안내 텍스트')).not.toBeInTheDocument()
  })

  it('구조 조작 전용 잠금이면 설명글 「입력창 안내 텍스트」·「미리보기 기본 텍스트」를 편집할 수 있다', () => {
    const { queryByText, getByText, getByDisplayValue } = renderPanel(
      AGREEMENT_PORTRAIT_PARAGRAPH_IDS.intro,
      { structureControlLockedParagraphIds: AGREEMENT_PORTRAIT_SEED_PARAGRAPH_IDS }
    )
    expect(queryByText(STRUCTURE_LOCKED_HINT)).not.toBeInTheDocument()
    expect(getByText('입력창 안내 텍스트')).toBeInTheDocument()
    expect(getByText('미리보기 기본 텍스트')).toBeInTheDocument()
    expect(getByDisplayValue('한 줄 안내를 입력해 주세요')).toBeEnabled()
  })

  it('구조 조작 전용 잠금이면 단락 유형·상세 셀렉트는 비활성이다', () => {
    const { container } = renderPanel(AGREEMENT_PORTRAIT_PARAGRAPH_IDS.intro, {
      structureControlLockedParagraphIds: AGREEMENT_PORTRAIT_SEED_PARAGRAPH_IDS,
    })
    const kindRow = container.querySelector('.form-editor-right-panel__kind-row')
    expect(kindRow).not.toBeNull()
    const selects = kindRow!.querySelectorAll('.ant-select')
    expect(selects.length).toBe(2)
    selects.forEach(select => {
      expect(select.classList.contains('ant-select-disabled')).toBe(true)
    })
  })

  it('구조 조작 전용 잠금이면 세로형 표는 항목명·내용은 편집하고 [행 삭제]·1단/2단은 막는다', () => {
    const { queryByRole, getAllByText, container } = renderPanel(
      AGREEMENT_PORTRAIT_PARAGRAPH_IDS.personalConsentTable,
      { structureControlLockedParagraphIds: AGREEMENT_PORTRAIT_SEED_PARAGRAPH_IDS },
      {
        verticalTableBodyRowSelection: {
          paragraphId: AGREEMENT_PORTRAIT_PARAGRAPH_IDS.personalConsentTable,
          row: 0,
        },
      }
    )
    expect(getAllByText('항목명').length).toBeGreaterThan(0)
    container
      .querySelectorAll<HTMLInputElement>(
        '.form-editor-horizontal-table-body-fields__content-input input, input.form-editor-horizontal-table-body-fields__content-input'
      )
      .forEach(input => {
        expect(input).toBeEnabled()
      })
    expect(queryByRole('button', { name: /행 삭제/ })).not.toBeInTheDocument()
    const structureRadios = container.querySelectorAll(
      '.form-editor-vertical-table-row-fields__structure-radios input[type="radio"]'
    )
    expect(structureRadios.length).toBeGreaterThan(0)
    structureRadios.forEach(radio => {
      expect(radio).toBeDisabled()
    })
  })

  it('잠금이 없으면 세로형 표의 [행 삭제]가 보인다', () => {
    const { getByRole } = renderPanel(
      AGREEMENT_PORTRAIT_PARAGRAPH_IDS.personalConsentTable,
      {},
      {
        verticalTableBodyRowSelection: {
          paragraphId: AGREEMENT_PORTRAIT_PARAGRAPH_IDS.personalConsentTable,
          row: 0,
        },
      }
    )
    expect(getByRole('button', { name: /행 삭제/ })).toBeInTheDocument()
  })
})
