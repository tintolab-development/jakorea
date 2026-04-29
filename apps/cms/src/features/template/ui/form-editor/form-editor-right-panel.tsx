import { Form } from 'antd'
import { FormEditorMultipleChoiceItems } from '@/features/template/ui/form-editor/form-editor-multiple-choice-items'
import { FormEditorScaleTypeItems } from '@/features/template/ui/form-editor/form-editor-scale-type-items'
import { CmsInput } from '@/shared/ui/cms-input'
import { CmsRadio, CmsRadioGroup } from '@/shared/ui/cms-radio'
import { CmsSelect } from '@/shared/ui/cms-select'
import type {
  DateTimeFieldMode,
  DateTimeParagraph,
  FormEditorKind,
  FormTitleNumberingStyle,
  HorizontalTableParagraph,
  HorizontalTableRowSelection,
  VerticalTableParagraph,
  MultipleChoiceParagraph,
  ScaleTypeParagraph,
  ShortEssayParagraph,
  WritingFormDraft,
  WritingFormParagraph,
} from '@/features/template/model/writing-form-draft.schema'
import {
  createHorizontalTableParagraph,
  createVerticalTableParagraph,
  DATE_TIME_FIELD_MODE_OPTIONS,
  effectiveVerticalStageKinds,
  normalizeVerticalChoiceOptions,
  normalizeVerticalTableParagraph,
  verticalTableParagraphOutlineLabel,
  verticalTableParagraphWithChoiceOptions,
  FORM_EDITOR_MULTIPLE_CHOICE_ITEMS_FOCUS_ID,
  isAgreementLockedSystemParagraph,
  writingOutlineLabel,
} from '@/features/template/model/writing-form-draft.schema'
import { FormEditorHorizontalTableBodyFields } from '@/features/template/ui/form-editor/form-editor-horizontal-table-body-fields'
import { FormEditorHorizontalTableHeaderFields } from '@/features/template/ui/form-editor/form-editor-horizontal-table-header-fields'
import { FormEditorOptionListEditor } from '@/features/template/ui/form-editor/form-editor-option-list-editor'
import { FormEditorVerticalTableRowFields } from '@/features/template/ui/form-editor/form-editor-vertical-table-row-fields'
import './form-editor.css'

const TITLE_NUMBERING_OPTIONS: { value: FormTitleNumberingStyle; label: string }[] = [
  { value: 'numeric', label: '1, 2, 3' },
  { value: 'alpha', label: 'A, B, C' },
  { value: 'q_repeat', label: 'Q, Q, Q' },
  { value: 'q123', label: 'Q1, Q2, Q3' },
  { value: 'none', label: '미선택' },
]

const TABLE_KIND_OPTIONS = [{ value: 'table', label: '테이블' }] as const

/** 테이블 대분류 우측 패널 — 소분류는 가로·세로 방향만 전환(세부 유형은 캔버스·다른 설정에서 유지) */
type TableOrientationKind = 'horizontal' | 'vertical'
const TABLE_ORIENTATION_OPTIONS: { value: TableOrientationKind; label: string }[] = [
  { value: 'horizontal', label: '가로형' },
  { value: 'vertical', label: '세로형' },
]

const GENERATED_TABLE_TITLES = new Set([
  '테이블_가로형',
  '테이블_가로형 (필드 형)',
  verticalTableParagraphOutlineLabel('text'),
  verticalTableParagraphOutlineLabel('subjective'),
  verticalTableParagraphOutlineLabel('date_time'),
  verticalTableParagraphOutlineLabel('single_choice'),
  verticalTableParagraphOutlineLabel('multiple_choice'),
  verticalTableParagraphOutlineLabel('file_attachment'),
])

function tableOrientationFromParagraph(p: WritingFormParagraph): TableOrientationKind | null {
  if (p.kind !== 'single_item') return null
  if (p.variant === 'horizontal_table') return 'horizontal'
  if (p.variant === 'vertical_table') return 'vertical'
  return null
}

function withPreservedTableCommonFields<T extends HorizontalTableParagraph | VerticalTableParagraph>(
  next: T,
  prev: HorizontalTableParagraph | VerticalTableParagraph
): T {
  const shouldUseNextTitle =
    prev.paragraphTitle.trim() === '' || GENERATED_TABLE_TITLES.has(prev.paragraphTitle.trim())

  return {
    ...next,
    requiredMark: prev.requiredMark,
    paragraphTitle: shouldUseNextTitle ? next.paragraphTitle : prev.paragraphTitle,
    paragraphDescription: prev.paragraphDescription,
    participatesInTitleNumbering: prev.participatesInTitleNumbering,
    answerRequired: prev.answerRequired,
  }
}

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
  if (p.kind === 'description' && p.variant === 'system') {
    if (p.systemPreset === 'agreement_date') return '날짜 유형'
    if (p.systemPreset === 'agreement_signature') return '서명란 유형'
  }
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
    case 'agreement_explanation_text':
      return '텍스트형'
    case 'closing':
      return '마무리글형'
    case 'system':
      return '기타'
    case 'short_essay':
      return '주관식형'
    case 'multiple_choice':
      return '객관식형'
    case 'dropdown':
      return '드롭다운형'
    case 'date_time':
      return '날짜/시간형'
    case 'star_rate':
      return '별점형'
    case 'scale_type':
      return '점수 선택형'
    case 'user_info':
      return '사용자 정보형'
    case 'file_attachment':
      return '파일 첨부형'
  }
}

export interface FormEditorRightPanelProps {
  draft: WritingFormDraft
  activeParagraphId: string | null
  onTitleNumberingChange: (style: FormTitleNumberingStyle) => void
  updateParagraph: (id: string, updater: (p: WritingFormParagraph) => WritingFormParagraph) => void
  editorKind?: FormEditorKind
  showTitleNumbering?: boolean
  singleItemListActiveItemId?: string | null
  horizontalTableRowSelection?: HorizontalTableRowSelection | null
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
  const p = normalizeVerticalTableParagraph(paragraph)
  const selectedRow =
    rowSelection?.paragraphId === paragraph.id &&
    rowSelection.row >= 0 &&
    rowSelection.row < Math.max(1, p.rows.length)
      ? p.rows[rowSelection.row]
      : null
  const selectedRowHasChoiceStage =
    selectedRow != null
      ? effectiveVerticalStageKinds(selectedRow, p.verticalTableFlavor).some(
          k => k === 'single_choice' || k === 'multiple_choice'
        )
      : false
  const choiceFlavor =
    p.verticalTableFlavor === 'single_choice' ||
    p.verticalTableFlavor === 'multiple_choice' ||
    selectedRowHasChoiceStage

  /** 파일첨부형: 우측 커스텀 필드 없음(th는 스키마 기본값·데이터만) */
  const rowFields =
    p.verticalTableFlavor !== 'file_attachment' &&
    rowSelection != null &&
    rowSelection.paragraphId === paragraph.id &&
    rowSelection.row >= 0 &&
    rowSelection.row < Math.max(1, p.rows.length) ? (
      <FormEditorVerticalTableRowFields
        paragraph={paragraph}
        paragraphId={paragraph.id}
        rowIndex={rowSelection.row}
        updateParagraph={updateParagraph}
        onBodyRowDeleted={onBodyRowDeleted}
      />
    ) : null

  const choiceOptionsEditor = choiceFlavor ? (
    <div className="form-editor-right-panel__field">
      <FormEditorOptionListEditor
        values={normalizeVerticalChoiceOptions(p.verticalChoiceOptions)}
        onChange={options =>
          updateParagraph(paragraph.id, cur => {
            if (cur.kind !== 'single_item' || cur.variant !== 'vertical_table') return cur
            return verticalTableParagraphWithChoiceOptions(cur as VerticalTableParagraph, options)
          })
        }
        addLabel="+ 항목 추가"
        addButtonIcon={false}
      />
    </div>
  ) : null

  if (!choiceFlavor && rowFields == null) return null

  return (
    <>
      {choiceOptionsEditor}
      {rowFields}
    </>
  )
}

export function FormEditorRightPanel({
  draft,
  activeParagraphId,
  onTitleNumberingChange,
  updateParagraph,
  editorKind: _editorKind = 'survey',
  showTitleNumbering = true,
  singleItemListActiveItemId,
  horizontalTableRowSelection = null,
  onHorizontalTableBodyRowDeleted,
  verticalTableBodyRowSelection = null,
  onVerticalTableBodyRowDeleted,
}: FormEditorRightPanelProps) {
  const active = draft.paragraphs.find(p => p.id === activeParagraphId) ?? null
  const outline =
    active && active.kind === 'description' && active.variant === 'closing'
      ? `${paragraphKindLabel(active)}_${paragraphVariantLabel(active)}`
      : active
        ? writingOutlineLabel(active)
        : ''

  const activeShortEssay =
    active && active.kind === 'single_item' && active.variant === 'short_essay'
      ? (active as ShortEssayParagraph)
      : null
  const activeMultipleChoice =
    active && active.kind === 'single_item' && active.variant === 'multiple_choice'
      ? (active as MultipleChoiceParagraph)
      : null
  const activeDateTime =
    active && active.kind === 'single_item' && active.variant === 'date_time'
      ? (active as DateTimeParagraph)
      : null
  const activeScaleType =
    active && active.kind === 'single_item' && active.variant === 'scale_type'
      ? (active as ScaleTypeParagraph)
      : null
  const activeTableOrientation = active ? tableOrientationFromParagraph(active) : null

  const shortEssayItems =
    activeShortEssay?.items && activeShortEssay.items.length > 0
      ? activeShortEssay.items
      : activeShortEssay
        ? [
            {
              id: 'short-essay-item-1',
              label: 'Title 01',
              placeholder: activeShortEssay.bodyPlaceholder,
              bodyText: activeShortEssay.bodyText,
            },
          ]
        : []

  const selectedShortEssayItem =
    singleItemListActiveItemId == null
      ? null
      : (shortEssayItems.find(item => item.id === singleItemListActiveItemId) ?? null)

  const shortEssayShowItemTitle =
    activeShortEssay == null
      ? false
      : shortEssayItems.length >= 2
        ? true
        : (activeShortEssay.showItemTitle ?? false)

  const handleTableOrientationChange = (next: TableOrientationKind) => {
    if (!active || activeTableOrientation == null || activeTableOrientation === next) return
    updateParagraph(active.id, cur => {
      if (cur.kind !== 'single_item') return cur
      if (cur.variant !== 'horizontal_table' && cur.variant !== 'vertical_table') return cur
      const prev = cur as HorizontalTableParagraph | VerticalTableParagraph
      if (next === 'horizontal') {
        if (cur.variant === 'horizontal_table') return cur
        return withPreservedTableCommonFields(createHorizontalTableParagraph(cur.id), prev)
      }
      if (cur.variant === 'vertical_table') return cur
      return withPreservedTableCommonFields(createVerticalTableParagraph(cur.id, 'text'), prev)
    })
  }

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
                  <>
                    <CmsSelect
                      width={165}
                      value="table"
                      options={[...TABLE_KIND_OPTIONS]}
                      withAllOption={false}
                    />
                    <CmsSelect
                      width={165}
                      value={activeTableOrientation ?? 'horizontal'}
                      options={TABLE_ORIENTATION_OPTIONS}
                      onChange={v => handleTableOrientationChange(v as TableOrientationKind)}
                      withAllOption={false}
                    />
                  </>
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

          {!(active.kind === 'description' && active.variant === 'closing') ? (
            <Form
              layout="vertical"
              className="form-editor-right-panel__form-items"
              requiredMark={false}
            >
            {active.kind === 'description' && active.variant === 'survey_title_with_period' ? (
              <>
                {(active.showWritingPeriodOnForm ?? false) ? (
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

            {active.kind === 'description' &&
            active.variant === 'system' &&
            isAgreementLockedSystemParagraph(active) ? (
              <Form.Item>
                <span className="form-editor-right-panel__system-hint">
                  시스템 설정 항목입니다. 내용 추가·삭제·편집은 할 수 없습니다.
                </span>
              </Form.Item>
            ) : null}

            {active.kind === 'single_item' && active.variant === 'agreement_explanation_text' ? (
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
              </>
            ) : null}

            {activeShortEssay && selectedShortEssayItem ? (
              <>
                <Form.Item label="항목 유형">
                  <CmsSelect
                    width="100%"
                    value={paragraphVariantLabel(activeShortEssay)}
                    options={[
                      {
                        value: paragraphVariantLabel(activeShortEssay),
                        label: paragraphVariantLabel(activeShortEssay),
                      },
                    ]}
                    disabled
                  />
                </Form.Item>
                {shortEssayShowItemTitle ? (
                  <Form.Item label="항목명">
                    <CmsInput
                      width="100%"
                      value={selectedShortEssayItem.label ?? ''}
                      onChange={e =>
                        updateParagraph(activeShortEssay.id, cur => {
                          if (cur.kind !== 'single_item' || cur.variant !== 'short_essay') return cur
                          const items =
                            cur.items?.length && cur.items.length > 0
                              ? cur.items
                              : [
                                  {
                                    id: 'short-essay-item-1',
                                    label: 'Title 01',
                                    placeholder: cur.bodyPlaceholder,
                                    bodyText: cur.bodyText,
                                  },
                                ]
                          return {
                            ...cur,
                            items: items.map(item =>
                              item.id === selectedShortEssayItem.id
                                ? { ...item, label: e.target.value }
                                : item
                            ),
                          }
                        })
                      }
                      placeholder="항목명을 입력해 주세요"
                    />
                  </Form.Item>
                ) : null}
                <Form.Item label="입력창 안내 텍스트">
                  <CmsInput
                    width="100%"
                    value={selectedShortEssayItem.placeholder ?? activeShortEssay.bodyPlaceholder}
                    onChange={e =>
                      updateParagraph(activeShortEssay.id, cur => {
                        if (cur.kind !== 'single_item' || cur.variant !== 'short_essay') return cur
                        const items =
                          cur.items?.length && cur.items.length > 0
                            ? cur.items
                            : [
                                {
                                  id: 'short-essay-item-1',
                                  label: 'Title 01',
                                  placeholder: cur.bodyPlaceholder,
                                  bodyText: cur.bodyText,
                                },
                              ]
                        return {
                          ...cur,
                          bodyPlaceholder: e.target.value,
                          items: items.map(item =>
                            item.id === selectedShortEssayItem.id
                              ? { ...item, placeholder: e.target.value }
                              : item
                          ),
                        }
                      })
                    }
                    placeholder="답변을 입력해 주세요"
                  />
                </Form.Item>
              </>
            ) : null}

            {activeMultipleChoice ? (
              <>
                <Form.Item label="항목 유형">
                  <CmsSelect
                    width="100%"
                    value={paragraphVariantLabel(activeMultipleChoice)}
                    options={[
                      {
                        value: paragraphVariantLabel(activeMultipleChoice),
                        label: paragraphVariantLabel(activeMultipleChoice),
                      },
                    ]}
                    disabled
                  />
                </Form.Item>
                {singleItemListActiveItemId === FORM_EDITOR_MULTIPLE_CHOICE_ITEMS_FOCUS_ID ||
                singleItemListActiveItemId === undefined ? (
                  <FormEditorMultipleChoiceItems
                    paragraph={activeMultipleChoice}
                    updateParagraph={updateParagraph}
                  />
                ) : null}
              </>
            ) : null}

            {activeScaleType ? (
              <FormEditorScaleTypeItems paragraph={activeScaleType} updateParagraph={updateParagraph} />
            ) : null}

            {activeDateTime ? (
              <Form.Item label="유형">
                <CmsSelect
                  width="100%"
                  value={activeDateTime.fieldMode ?? 'date'}
                  options={[...DATE_TIME_FIELD_MODE_OPTIONS]}
                  onChange={v =>
                    updateParagraph(activeDateTime.id, cur => {
                      if (cur.kind !== 'single_item' || cur.variant !== 'date_time') return cur
                      const mode = v as DateTimeFieldMode
                      return {
                        ...cur,
                        fieldMode: mode,
                        ...(mode === 'time' ? { periodEnabled: false } : {}),
                      }
                    })
                  }
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

            </Form>
          ) : null}
        </>
      ) : null}
    </div>
  )
}
