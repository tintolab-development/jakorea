/**
 * 양식 테스트 > 테이블 모음
 * TODO(임시): 최상단 테이블 가로형(텍스트형)만 노출. 필드형·세로형 복구 시 데모 초안을 다시 합칩니다.
 */

import { HorizontalTableFormEditor } from '@/features/template/ui/form-set/horizontal-table-form-editor'
import {
  createDefaultHorizontalTableDraft,
  type HorizontalTableParagraph,
  type WritingFormDraft,
} from '@/features/template/model/writing-form-draft.schema'
import './form-test-table-components-page.css'

const FORM_TEST_HT_TABLE_TEXT_ID = 'form-test-ht-table-text'

function createFormTestTableComponentsDraft(): WritingFormDraft {
  const base = createDefaultHorizontalTableDraft()
  const t0 = base.paragraphs[0]
  if (t0 == null || t0.kind !== 'single_item' || t0.variant !== 'horizontal_table') return base

  const tableText: HorizontalTableParagraph = { ...t0, id: FORM_TEST_HT_TABLE_TEXT_ID }

  return {
    ...base,
    paragraphs: [tableText],
  }
}

const FORM_TEST_TABLE_DRAFT = createFormTestTableComponentsDraft()

export function FormTestTableComponentsPage() {
  return (
    <div className="template-form-tab__content form-test-table-components-page">
      <HorizontalTableFormEditor
        variant="embedded"
        initialDraft={FORM_TEST_TABLE_DRAFT}
        initialActiveParagraphId={FORM_TEST_HT_TABLE_TEXT_ID}
      />
    </div>
  )
}

export default FormTestTableComponentsPage
