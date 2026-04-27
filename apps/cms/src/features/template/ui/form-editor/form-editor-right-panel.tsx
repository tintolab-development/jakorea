import { Form } from 'antd'
import { FormEditorMultipleChoiceItems } from '@/features/template/ui/form-editor/form-editor-multiple-choice-items'
import { MULTIPLE_CHOICE_EDITOR_ITEMS_SURFACE_ID } from '@/features/template/ui/paragraph/single-item/multiple-choice'
import { CmsInput } from '@/shared/ui/cms-input'
import { CmsTextArea } from '@/shared/ui/cms-textarea'
import { CmsRadio, CmsRadioGroup } from '@/shared/ui/cms-radio'
import { CmsSelect } from '@/shared/ui/cms-select'
import type {
  FormEditorKind,
  FormTitleNumberingStyle,
  MultipleChoiceParagraph,
  ShortEssayParagraph,
  WritingFormDraft,
  WritingFormParagraph,
} from '@/features/template/model/writing-form-draft.schema'
import { writingOutlineLabel } from '@/features/template/model/writing-form-draft.schema'
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
  return '단일항목'
}

function paragraphVariantLabel(p: WritingFormParagraph): string {
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

export function FormEditorRightPanel({
  draft,
  activeParagraphId,
  onTitleNumberingChange,
  updateParagraph,
  editorKind: _editorKind = 'survey',
  showTitleNumbering = true,
  singleItemListActiveItemId,
}: FormEditorRightPanelProps) {
  const active = draft.paragraphs.find(p => p.id === activeParagraphId) ?? null
  const outline = active ? writingOutlineLabel(active) : ''
  const activeShortEssay =
    active && active.kind === 'single_item' && active.variant === 'short_essay'
      ? (active as ShortEssayParagraph)
      : null
  const activeMultipleChoice =
    active && active.kind === 'single_item' && active.variant === 'multiple_choice'
      ? (active as MultipleChoiceParagraph)
      : null
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

  const showMultipleChoiceItemsEditor =
    activeMultipleChoice != null &&
    singleItemListActiveItemId === MULTIPLE_CHOICE_EDITOR_ITEMS_SURFACE_ID

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

            {showMultipleChoiceItemsEditor && activeMultipleChoice ? (
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
                <FormEditorMultipleChoiceItems
                  paragraph={activeMultipleChoice}
                  updateParagraph={updateParagraph}
                />
              </>
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
