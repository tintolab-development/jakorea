/**
 * 양식 테스트 > 테이블 모음
 * TODO(임시): 최상단 테이블 가로형(텍스트형)만 노출. 필드형·세로형 복구 시 데모 초안을 다시 합칩니다.
 */

import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useCallback, useMemo } from 'react'
import { HorizontalTableFormEditor } from '@/features/template/ui/form-set/horizontal-table-form-editor'
import {
  createDefaultHorizontalTableDraft,
  type HorizontalTableParagraph,
  type WritingFormDraft,
} from '@/features/template/model/writing-form-draft.schema'
import { TEMPLATE_USER_PREVIEW_ACTIVE } from '@/features/template/lib/template-user-preview-url'
import { useQueryParams } from '@/shared/hooks/use-query-params'
import { CmsButton } from '@/shared/ui/cms-button'
import { useWritingUserPreviewUrlAuxiliarySync } from '@/features/template/hooks/use-writing-user-preview-url-auxiliary-sync'
import { useTemplateWritingPreview } from '@/features/template/context/template-writing-preview-context'
import './form-test-table-components-page.css'

const FORM_TEST_HT_TABLE_TEXT_ID = 'form-test-ht-table-text'

/** `FormManagementQuery.ftDemo` — 단일 데모 행 식별 */
const FORM_TEST_TABLE_DEMO_HORIZONTAL_TEXT = 'horizontal-text'

type FormTestTablePageQuery = {
  ftDemo?: string
  userPreview?: string
}

type FormTestDemoRow = {
  key: string
  name: string
  description: string
}

const DEMO_ROWS: FormTestDemoRow[] = [
  {
    key: FORM_TEST_TABLE_DEMO_HORIZONTAL_TEXT,
    name: '가로형 텍스트',
    description: '테이블 가로형(텍스트형) 단일 단락 데모',
  },
]

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
  const { params, setParams } = useQueryParams<FormTestTablePageQuery>()
  const { closeWritingUserPreview, isWritingUserPreviewOpen } = useTemplateWritingPreview()

  useWritingUserPreviewUrlAuxiliarySync(params, setParams, isWritingUserPreviewOpen, closeWritingUserPreview)

  const handleOpenDemo = useCallback(
    (row: FormTestDemoRow) => {
      setParams({ ftDemo: row.key, userPreview: undefined }, { replace: false })
    },
    [setParams]
  )

  const handleBackToList = useCallback(() => {
    setParams({ ftDemo: undefined, userPreview: undefined })
  }, [setParams])

  const onBeforeUserPreview = useCallback(() => {
    setParams({ userPreview: TEMPLATE_USER_PREVIEW_ACTIVE }, { replace: false })
  }, [setParams])

  const columns: ColumnsType<FormTestDemoRow> = useMemo(
    () => [
      { title: '데모', dataIndex: 'name', key: 'name', width: 160 },
      { title: '설명', dataIndex: 'description', key: 'description' },
      {
        title: '동작',
        key: 'action',
        width: 120,
        align: 'center',
        render: (_, row) => (
          <CmsButton size="medium" variant="default" onClick={() => handleOpenDemo(row)}>
            열기
          </CmsButton>
        ),
      },
    ],
    [handleOpenDemo]
  )

  const activeDemo = params.ftDemo
  const showEditor = activeDemo === FORM_TEST_TABLE_DEMO_HORIZONTAL_TEXT

  return (
    <div className="template-form-tab__content form-test-table-components-page">
      {!showEditor ? (
        <Table<FormTestDemoRow>
          rowKey="key"
          columns={columns}
          dataSource={DEMO_ROWS}
          pagination={false}
          size="middle"
        />
      ) : (
        <div className="form-test-table-components-page__editor-wrap">
          <div className="form-test-table-components-page__toolbar">
            <CmsButton type="button" variant="default" size="medium" onClick={handleBackToList}>
              ← 목록
            </CmsButton>
          </div>
          <HorizontalTableFormEditor
            variant="embedded"
            initialDraft={FORM_TEST_TABLE_DRAFT}
            initialActiveParagraphId={FORM_TEST_HT_TABLE_TEXT_ID}
            onBeforeUserPreview={onBeforeUserPreview}
            urlUserPreviewActive={params.userPreview === TEMPLATE_USER_PREVIEW_ACTIVE}
          />
        </div>
      )}
    </div>
  )
}

export default FormTestTableComponentsPage
