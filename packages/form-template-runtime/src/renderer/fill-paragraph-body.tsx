import { Input, Radio } from 'antd'
import type {
  AgreementExplanationTextParagraph,
  MultipleChoiceParagraph,
  WritingFormParagraph,
} from '@jakorea/form-schema/writing-form'
import type { ParagraphBodyInteractionMode } from '@jakorea/form-schema/surface'
import { isFormPreviewReadonlyMode } from '@jakorea/form-schema/surface'
import { HorizontalTablePreviewBody } from './horizontal-table-preview-body.js'
import { PreviewParagraphBody } from './preview-paragraph-body.js'

export type FormUpdateParagraph = (
  id: string,
  updater: (paragraph: WritingFormParagraph) => WritingFormParagraph
) => void

export type FillParagraphBodyOptions = {
  /** 본문 문구 잠금 — `interactiveExplanationIds`에 포함된 단락만 입력 가능 */
  consentFillReadOnlyBody?: boolean
  interactiveExplanationIds?: ReadonlySet<string>
}

export type FillParagraphBodyProps = {
  paragraph: WritingFormParagraph
  interactionMode: ParagraphBodyInteractionMode
  onUpdateParagraph?: FormUpdateParagraph
  fillOptions?: FillParagraphBodyOptions
}

function isExplanationInteractive(
  paragraphId: string,
  fillOptions?: FillParagraphBodyOptions
): boolean {
  if (fillOptions?.interactiveExplanationIds?.has(paragraphId)) return true
  return fillOptions?.consentFillReadOnlyBody !== true
}

function MultipleChoiceFill({
  paragraph,
  readonly,
  onUpdateParagraph,
}: {
  paragraph: MultipleChoiceParagraph
  readonly: boolean
  onUpdateParagraph?: FormUpdateParagraph
}) {
  const description = paragraph.paragraphDescription?.trim() ?? ''

  return (
    <div className="form-template-fill-multiple-choice">
      {description ? (
        <p className="form-template-fill-multiple-choice__description">{description}</p>
      ) : null}
      <Radio.Group
        className="form-template-fill-multiple-choice__radios app-radio-group app-radio-group--large"
        size="large"
        value={paragraph.selectedPreviewSingleId ?? undefined}
        disabled={readonly}
        onChange={event => {
          const nextId = String(event.target.value)
          onUpdateParagraph?.(paragraph.id, current =>
            current.kind === 'single_item' && current.variant === 'multiple_choice'
              ? { ...current, selectedPreviewSingleId: nextId }
              : current
          )
        }}
      >
        {paragraph.items.map(item => (
          <Radio key={item.id} value={item.id}>
            {item.label}
          </Radio>
        ))}
      </Radio.Group>
    </div>
  )
}

function AgreementExplanationTextFill({
  paragraph,
  readonly,
  onUpdateParagraph,
}: {
  paragraph: AgreementExplanationTextParagraph
  readonly: boolean
  onUpdateParagraph?: FormUpdateParagraph
}) {
  const body = paragraph.bodyText?.trim() ?? ''
  if (readonly) {
    return body ? <div className="form-template-preview-text">{body}</div> : null
  }

  return (
    <Input.TextArea
      className="form-template-fill-explanation-text"
      value={paragraph.bodyText}
      placeholder={paragraph.bodyPlaceholder || '내용을 입력해 주세요'}
      autoSize={{ minRows: 2, maxRows: 8 }}
      onChange={event => {
        const next = event.target.value
        onUpdateParagraph?.(paragraph.id, current =>
          current.kind === 'single_item' && current.variant === 'agreement_explanation_text'
            ? { ...current, bodyText: next }
            : current
        )
      }}
    />
  )
}

function ShortEssayFill({
  paragraph,
  readonly,
  onUpdateParagraph,
}: {
  paragraph: Extract<
    WritingFormParagraph,
    { kind: 'single_item'; variant: 'short_essay' | 'session_plan_short_essay' }
  >
  readonly: boolean
  onUpdateParagraph?: FormUpdateParagraph
}) {
  const items = paragraph.items ?? []

  if (items.length === 0) {
    return (
      <Input.TextArea
        className="form-template-fill-short-essay"
        value={paragraph.bodyText}
        placeholder={paragraph.bodyPlaceholder || '답변을 입력해 주세요'}
        disabled={readonly}
        autoSize={{
          minRows:
            paragraph.variant === 'short_essay' && 'itemInputRows' in paragraph
              ? (paragraph.itemInputRows ?? 1)
              : 1,
          maxRows: 8,
        }}
        onChange={event => {
          const next = event.target.value
          onUpdateParagraph?.(paragraph.id, current =>
            current.kind === 'single_item' &&
            (current.variant === 'short_essay' || current.variant === 'session_plan_short_essay')
              ? { ...current, bodyText: next }
              : current
          )
        }}
      />
    )
  }

  return (
    <div className="form-template-fill-short-essay-items">
      {items.map(item => (
        <label key={item.id} className="form-template-fill-short-essay-item">
          {paragraph.showItemTitle && (item.label?.trim() ?? '') ? (
            <span className="form-template-fill-short-essay-item__label">{item.label}</span>
          ) : null}
          <Input
            size="large"
            value={item.bodyText}
            placeholder={item.placeholder || paragraph.bodyPlaceholder || '답변을 입력해 주세요'}
            disabled={readonly}
            onChange={event => {
              const nextValue = event.target.value
              onUpdateParagraph?.(paragraph.id, current => {
                if (
                  current.kind !== 'single_item' ||
                  (current.variant !== 'short_essay' &&
                    current.variant !== 'session_plan_short_essay')
                ) {
                  return current
                }
                return {
                  ...current,
                  items: (current.items ?? []).map(entry =>
                    entry.id === item.id ? { ...entry, bodyText: nextValue } : entry
                  ),
                }
              })
            }}
          />
        </label>
      ))}
    </div>
  )
}

export function FillParagraphBody({
  paragraph,
  interactionMode,
  onUpdateParagraph,
  fillOptions,
}: FillParagraphBodyProps) {
  const readonly = isFormPreviewReadonlyMode(interactionMode) || onUpdateParagraph == null

  if (paragraph.kind === 'single_item' && paragraph.variant === 'horizontal_table') {
    return (
      <HorizontalTablePreviewBody
        paragraph={paragraph}
        interactionMode={interactionMode}
        onBottomConsentChange={
          readonly
            ? undefined
            : value => {
                onUpdateParagraph?.(paragraph.id, current =>
                  current.kind === 'single_item' && current.variant === 'horizontal_table'
                    ? { ...current, bottomConsent: value }
                    : current
                )
              }
        }
        onIdTypeWithInputChange={
          readonly
            ? undefined
            : next => {
                onUpdateParagraph?.(paragraph.id, current =>
                  current.kind === 'single_item' && current.variant === 'horizontal_table'
                    ? { ...current, idTypeWithInput: next }
                    : current
                )
              }
        }
      />
    )
  }

  if (paragraph.kind === 'single_item' && paragraph.variant === 'multiple_choice') {
    return (
      <MultipleChoiceFill
        paragraph={paragraph}
        readonly={readonly}
        onUpdateParagraph={onUpdateParagraph}
      />
    )
  }

  if (paragraph.kind === 'single_item' && paragraph.variant === 'agreement_explanation_text') {
    const explanationReadonly =
      readonly || !isExplanationInteractive(paragraph.id, fillOptions)
    return (
      <AgreementExplanationTextFill
        paragraph={paragraph}
        readonly={explanationReadonly}
        onUpdateParagraph={onUpdateParagraph}
      />
    )
  }

  if (
    paragraph.kind === 'single_item' &&
    (paragraph.variant === 'short_essay' || paragraph.variant === 'session_plan_short_essay')
  ) {
    return (
      <ShortEssayFill
        paragraph={paragraph}
        readonly={readonly}
        onUpdateParagraph={onUpdateParagraph}
      />
    )
  }

  return (
    <PreviewParagraphBody paragraph={paragraph} interactionMode={interactionMode} surface="platformUser" />
  )
}
