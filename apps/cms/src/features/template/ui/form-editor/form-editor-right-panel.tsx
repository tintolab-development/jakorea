import { Form } from 'antd'
import { CmsInput } from '@/shared/ui/cms-input'
import { CmsTextArea } from '@/shared/ui/cms-textarea'
import { CmsRadio, CmsRadioGroup } from '@/shared/ui/cms-radio'
import { CmsSelect } from '@/shared/ui/cms-select'
import type {
  FormEditorKind,
  FormTitleNumberingStyle,
  HorizontalTableParagraph,
  HorizontalTableRowSelection,
  VerticalTableParagraph,
  WritingFormDraft,
  WritingFormParagraph,
} from '@/features/template/model/writing-form-draft.schema'
import {
  normalizeVerticalTableParagraph,
  verticalTableParagraphOutlineLabel,
  writingOutlineLabel,
} from '@/features/template/model/writing-form-draft.schema'
import { FormEditorHorizontalTableBodyFields } from '@/features/template/ui/form-editor/form-editor-horizontal-table-body-fields'
import { FormEditorHorizontalTableHeaderFields } from '@/features/template/ui/form-editor/form-editor-horizontal-table-header-fields'
import { FormEditorVerticalTableRowFields } from '@/features/template/ui/form-editor/form-editor-vertical-table-row-fields'
import './form-editor.css'

const TITLE_NUMBERING_OPTIONS: { value: FormTitleNumberingStyle; label: string }[] = [
  { value: 'numeric', label: '1, 2, 3' },
  { value: 'alpha', label: 'A, B, C' },
  { value: 'q_repeat', label: 'Q, Q, Q' },
  { value: 'q123', label: 'Q1, Q2, Q3' },
  { value: 'none', label: '미선택' },
]

function paragraphKindLabel(p: WritingFormParagraph): string {
  if (p.kind === 'description') return '설명글'
  if (p.kind === 'single_item' && p.variant === 'agreement_explanation_text') return '설명글'
  if (p.kind === 'single_item' && p.variant === 'horizontal_table') {
    const t = p as HorizontalTableParagraph
    return t.tableFlavor === 'field' ? '테이블_가로형 (필드 형)' : '테이블_가로형'
  }
  if (p.kind === 'single_item' && p.variant === 'vertical_table') {
    const vt = normalizeVerticalTableParagraph(p as VerticalTableParagraph)
    return verticalTableParagraphOutlineLabel(vt.verticalTableFlavor)
  }
  return '단일항목'
}

function paragraphVariantLabel(p: WritingFormParagraph): string {
  if (p.kind === 'single_item' && p.variant === 'horizontal_table') {
    const t = p as HorizontalTableParagraph
    return t.tableFlavor === 'field' ? '테이블_가로형 (필드 형)' : '테이블_가로형'
  }
  if (p.kind === 'single_item' && p.variant === 'vertical_table') {
    const vt = normalizeVerticalTableParagraph(p as VerticalTableParagraph)
    return verticalTableParagraphOutlineLabel(vt.verticalTableFlavor)
  }
  switch (p.variant) {
    case 'survey_title_with_period':
      return '제목형'
    case 'user_profile':
      return '사용자 정보형'
    case 'score_select':
      return '점수 선택형'
    case 'subjective':
      return '주관식형'
    case 'agreement_rich_text':
      return '동의 본문형'
    case 'agreement_explanation_text':
      return '텍스트형'
    case 'agreement_privacy_rows':
      return '개인정보 수집 항목형'
    case 'agreement_table_consent':
      return '표·동의 선택형'
    case 'closing':
      return '마무리글형'
  }
}

export interface FormEditorRightPanelProps {
  draft: WritingFormDraft
  activeParagraphId: string | null
  onTitleNumberingChange: (style: FormTitleNumberingStyle) => void
  updateParagraph: (id: string, updater: (p: WritingFormParagraph) => WritingFormParagraph) => void
  editorKind?: FormEditorKind
  showTitleNumbering?: boolean
  /** 테이블 가로형: 헤더 행 선택 시 우측에 헤더 전용 필드 */
  horizontalTableRowSelection?: HorizontalTableRowSelection | null
  /** 테이블 가로형: 데이터 행 삭제 후 포커스할 행 인덱스(이전 행) */
  onHorizontalTableBodyRowDeleted?: (nextRowIndex: number) => void
  /** 테이블 세로형: 본문 행 선택 시 해당 행 인덱스 */
  verticalTableBodyRowSelection?: { paragraphId: string; row: number } | null
  /** 테이블 세로형: 행 삭제 후 포커스할 행 인덱스(이전 행) */
  onVerticalTableBodyRowDeleted?: (nextRowIndex: number) => void
}

export function FormEditorTitleNumberingField({
  value,
  onChange,
}: {
  value: FormTitleNumberingStyle
  onChange: (style: FormTitleNumberingStyle) => void
}) {
  return (
    <div className="form-editor-right-panel__field">
      <span className="form-editor-right-panel__label">타이틀 번호</span>
      <CmsSelect
        width="100%"
        className="form-editor-right-panel__select"
        value={value}
        options={TITLE_NUMBERING_OPTIONS}
        onChange={v => onChange(v as FormTitleNumberingStyle)}
      />
    </div>
  )
}

function FormEditorHorizontalTableCustomFields({
  paragraph,
  rowSelection,
  updateParagraph,
  onBodyRowDeleted,
}: {
  paragraph: HorizontalTableParagraph
  rowSelection: HorizontalTableRowSelection | null
  updateParagraph: FormEditorRightPanelProps['updateParagraph']
  onBodyRowDeleted?: (nextRowIndex: number) => void
}) {
  if (rowSelection?.area === 'header') {
    return (
      <FormEditorHorizontalTableHeaderFields
        paragraph={paragraph}
        paragraphId={paragraph.id}
        updateParagraph={updateParagraph}
      />
    )
  }

  if (rowSelection?.area !== 'body') return null

  const rowIndex = rowSelection.row
  const rowCount = Math.max(1, paragraph.dataRows.length)
  if (rowIndex < 0 || rowIndex >= rowCount) return null

  return (
    <FormEditorHorizontalTableBodyFields
      paragraph={paragraph}
      paragraphId={paragraph.id}
      rowIndex={rowIndex}
      updateParagraph={updateParagraph}
      onBodyRowDeleted={onBodyRowDeleted}
    />
  )
}

function FormEditorVerticalTableCustomFields({
  paragraph,
  rowSelection,
  updateParagraph,
  onBodyRowDeleted,
}: {
  paragraph: VerticalTableParagraph
  rowSelection: { paragraphId: string; row: number } | null
  updateParagraph: FormEditorRightPanelProps['updateParagraph']
  onBodyRowDeleted?: (nextRowIndex: number) => void
}) {
  if (rowSelection == null || rowSelection.paragraphId !== paragraph.id) return null

  const rowIndex = rowSelection.row
  const rowCount = Math.max(1, paragraph.rows.length)
  if (rowIndex < 0 || rowIndex >= rowCount) return null

  return (
    <FormEditorVerticalTableRowFields
      paragraph={paragraph}
      paragraphId={paragraph.id}
      rowIndex={rowIndex}
      updateParagraph={updateParagraph}
      onBodyRowDeleted={onBodyRowDeleted}
    />
  )
}

export function FormEditorRightPanel({
  draft,
  activeParagraphId,
  onTitleNumberingChange,
  updateParagraph,
  editorKind: _editorKind = 'survey',
  showTitleNumbering = true,
  horizontalTableRowSelection = null,
  onHorizontalTableBodyRowDeleted,
  verticalTableBodyRowSelection = null,
  onVerticalTableBodyRowDeleted,
}: FormEditorRightPanelProps) {
  const active = draft.paragraphs.find(p => p.id === activeParagraphId) ?? null
  const outline = active ? writingOutlineLabel(active) : ''

  return (
    <div className="form-editor-right-panel">
      {showTitleNumbering ? (
        <FormEditorTitleNumberingField
          value={draft.formSettings.titleNumbering}
          onChange={onTitleNumberingChange}
        />
      ) : null}

      {active ? (
        <>
          <Form layout="vertical" className="form-editor-right-panel__form" requiredMark={false}>
            <span className="form-editor-right-panel__section-title">{outline}</span>
            <Form.Item>
              <div className="form-editor-right-panel__kind-row">
                {active.kind === 'single_item' &&
                (active.variant === 'horizontal_table' || active.variant === 'vertical_table') ? (
                  <CmsSelect
                    width="100%"
                    value={paragraphVariantLabel(active)}
                    options={[
                      {
                        value: paragraphVariantLabel(active),
                        label: paragraphVariantLabel(active),
                      },
                    ]}
                    disabled
                  />
                ) : (
                  <>
                    <CmsSelect
                      width="100%"
                      value={paragraphKindLabel(active)}
                      options={[
                        { value: paragraphKindLabel(active), label: paragraphKindLabel(active) },
                      ]}
                      disabled
                    />
                    <CmsSelect
                      width="100%"
                      value={paragraphVariantLabel(active)}
                      options={[
                        {
                          value: paragraphVariantLabel(active),
                          label: paragraphVariantLabel(active),
                        },
                      ]}
                      disabled
                    />
                  </>
                )}
              </div>
            </Form.Item>
          </Form>

          <Form
            layout="vertical"
            className="form-editor-right-panel__form-items"
            requiredMark={false}
          >
            {active.kind === 'description' && active.variant === 'survey_title_with_period' ? (
              <>
                {active.showWritingPeriodOnForm ? (
                  <>
                    <Form.Item label={'설문 시작일'}>
                      <CmsRadioGroup
                        value={active.periodMode}
                        onChange={e =>
                          updateParagraph(active.id, () => ({
                            ...active,
                            periodMode: e.target.value,
                          }))
                        }
                      >
                        <CmsRadio value="immediate">바로 시작</CmsRadio>
                        <CmsRadio value="custom">직접 설정</CmsRadio>
                      </CmsRadioGroup>
                    </Form.Item>
                    <Form.Item label={'설문 종료일'}>
                      <CmsRadioGroup
                        value={active.periodMode}
                        onChange={e =>
                          updateParagraph(active.id, () => ({
                            ...active,
                            periodMode: e.target.value,
                          }))
                        }
                      >
                        <CmsRadio value="immediate">마감 없음</CmsRadio>
                        <CmsRadio value="custom">직접 설정</CmsRadio>
                      </CmsRadioGroup>
                    </Form.Item>
                  </>
                ) : null}
              </>
            ) : null}

            {active.kind === 'single_item' &&
            (active.variant === 'agreement_rich_text' ||
              active.variant === 'agreement_explanation_text') ? (
              <>
                <Form.Item label="본문 placeholder">
                  <CmsInput
                    width="100%"
                    value={active.bodyPlaceholder}
                    onChange={e =>
                      updateParagraph(active.id, () => ({
                        ...active,
                        bodyPlaceholder: e.target.value,
                      }))
                    }
                    placeholder="텍스트를 작성해 주세요"
                  />
                </Form.Item>
                {active.variant === 'agreement_rich_text' ? (
                  <Form.Item label="본문 초안(미리보기)">
                    <CmsTextArea
                      width="100%"
                      value={active.bodyText}
                      onChange={e =>
                        updateParagraph(active.id, () => ({
                          ...active,
                          bodyText: e.target.value,
                        }))
                      }
                      rows={4}
                    />
                  </Form.Item>
                ) : (
                  <Form.Item label="본문(미리보기)">
                    <CmsInput
                      width="100%"
                      value={active.bodyText}
                      onChange={e =>
                        updateParagraph(active.id, () => ({
                          ...active,
                          bodyText: e.target.value,
                        }))
                      }
                    />
                  </Form.Item>
                )}
              </>
            ) : null}

            {active.kind === 'single_item' && active.variant === 'agreement_table_consent' ? (
              <Form.Item label="하단 설명(원문)">
                <CmsTextArea
                  width="100%"
                  value={active.footerDescription}
                  onChange={e =>
                    updateParagraph(active.id, () => ({
                      ...active,
                      footerDescription: e.target.value,
                    }))
                  }
                  rows={3}
                  placeholder="설명을 입력해 주세요"
                />
              </Form.Item>
            ) : null}

            {active.kind === 'single_item' && active.variant === 'horizontal_table' ? (
              <FormEditorHorizontalTableCustomFields
                paragraph={active as HorizontalTableParagraph}
                rowSelection={horizontalTableRowSelection}
                updateParagraph={updateParagraph}
                onBodyRowDeleted={onHorizontalTableBodyRowDeleted}
              />
            ) : null}

            {active.kind === 'single_item' && active.variant === 'vertical_table' ? (
              <FormEditorVerticalTableCustomFields
                paragraph={active as VerticalTableParagraph}
                rowSelection={verticalTableBodyRowSelection}
                updateParagraph={updateParagraph}
                onBodyRowDeleted={onVerticalTableBodyRowDeleted}
              />
            ) : null}

            {active.kind === 'description' && active.variant === 'closing' ? (
              <Form.Item label="마무리 문구">
                <CmsTextArea
                  width="100%"
                  value={active.body}
                  onChange={e =>
                    updateParagraph(active.id, () => ({
                      ...active,
                      body: e.target.value,
                    }))
                  }
                  rows={4}
                />
              </Form.Item>
            ) : null}
          </Form>
        </>
      ) : null}
    </div>
  )
}
