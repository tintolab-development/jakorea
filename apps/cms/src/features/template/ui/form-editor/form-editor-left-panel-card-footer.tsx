import type { ReactNode } from 'react'
import {
  FormParagraphCardActions,
  FormParagraphCardActionsMinimal,
} from '@/features/template/ui/paragraph/shared/paragraph-actions'
import {
  getWritingFormHeadMiddlePinnedTail,
  isAgreementLockedSystemParagraph,
  type HorizontalTableParagraph,
  type MultipleChoiceParagraph,
  type ShortEssayParagraph,
  type TitleWithPeriodParagraph,
  type VerticalTableParagraph,
  type WritingFormParagraph,
} from '@/features/template/model/writing-form-draft.schema'
import { HorizontalTableDimensionActions } from '@/features/template/ui/paragraph/table/horizontal-table-dimension-actions'
import { VerticalTableDimensionActions } from '@/features/template/ui/paragraph/table/vertical-table-dimension-actions'
import { getLastMiddleParagraphId } from '@/features/template/lib/writing-form-middle-paragraph-mutations'
import { CmsToggle } from '@/shared/ui/cms-toggle'
import type { FormEditorLeftPanelProps } from '@/features/template/ui/form-editor/form-editor-left-panel.types'
import { isTitleWithPeriodParagraph } from '@/features/template/ui/form-editor/form-editor-left-panel-heading'

export function modalCardFooterToggles(
  paragraph: WritingFormParagraph,
  isSelected: boolean,
  updateParagraph: FormEditorLeftPanelProps['updateParagraph'],
  structureLockedParagraphIds?: ReadonlySet<string>,
  hideParagraphRequiredChrome?: boolean
): ReactNode {
  const structureLocked = structureLockedParagraphIds?.has(paragraph.id) ?? false
  /* 잠금 단락은 기본적으로 하단 토글 숨김 — 제목형(작성 기간)만 예외로 좌측 스위치 유지(단락 액션과 같은 줄) */
  if (structureLocked && !isTitleWithPeriodParagraph(paragraph)) {
    return undefined
  }

  if (
    !hideParagraphRequiredChrome &&
    paragraph.kind === 'single_item' &&
    paragraph.variant === 'horizontal_table'
  ) {
    if (!isSelected) return undefined
    const ht = paragraph as HorizontalTableParagraph
    return (
      <div
        className="form-editor-card__toggles-row form-editor-card__toggles-row--table-foot"
        onClick={event => event.stopPropagation()}
      >
        <div className="form-editor-card__table-footer-toggle-slot">
          <CmsToggle
            label="답변 필수"
            checked={ht.answerRequired}
            onChange={checked =>
              updateParagraph(ht.id, p =>
                p.kind === 'single_item' && p.variant === 'horizontal_table'
                  ? { ...p, answerRequired: checked }
                  : p
              )
            }
          />
        </div>
        <div className="form-editor-card__table-footer-toggle-slot">
          <CmsToggle
            label="하단 설명"
            checked={ht.showBottomText}
            onChange={checked =>
              updateParagraph(ht.id, p =>
                p.kind === 'single_item' && p.variant === 'horizontal_table'
                  ? { ...p, showBottomText: checked }
                  : p
              )
            }
          />
        </div>
        <div className="form-editor-card__table-footer-toggle-slot">
          <CmsToggle
            label="동의 여부"
            checked={ht.showBottomConsent}
            onChange={checked =>
              updateParagraph(ht.id, p =>
                p.kind === 'single_item' && p.variant === 'horizontal_table'
                  ? { ...p, showBottomConsent: checked }
                  : p
              )
            }
          />
        </div>
      </div>
    )
  }

  if (
    !hideParagraphRequiredChrome &&
    paragraph.kind === 'single_item' &&
    paragraph.variant === 'vertical_table'
  ) {
    if (!isSelected) return undefined
    const vt = paragraph as VerticalTableParagraph
    return (
      <div
        className="form-editor-card__toggles-row form-editor-card__toggles-row--table-foot"
        onClick={event => event.stopPropagation()}
      >
        <div className="form-editor-card__table-footer-toggle-slot">
          <CmsToggle
            label="답변 필수"
            checked={vt.answerRequired}
            onChange={checked =>
              updateParagraph(vt.id, p =>
                p.kind === 'single_item' && p.variant === 'vertical_table'
                  ? { ...p, answerRequired: checked }
                  : p
              )
            }
          />
        </div>
        <div className="form-editor-card__table-footer-toggle-slot">
          <CmsToggle
            label="하단 설명"
            checked={vt.showBottomText}
            onChange={checked =>
              updateParagraph(vt.id, p =>
                p.kind === 'single_item' && p.variant === 'vertical_table'
                  ? { ...p, showBottomText: checked }
                  : p
              )
            }
          />
        </div>
        <div className="form-editor-card__table-footer-toggle-slot">
          <CmsToggle
            label="동의 여부"
            checked={vt.showBottomConsent}
            onChange={checked =>
              updateParagraph(vt.id, p =>
                p.kind === 'single_item' && p.variant === 'vertical_table'
                  ? { ...p, showBottomConsent: checked }
                  : p
              )
            }
          />
        </div>
      </div>
    )
  }

  if (isTitleWithPeriodParagraph(paragraph)) {
    if (!isSelected) return undefined
    const titleParagraph = paragraph as TitleWithPeriodParagraph
    return (
      <div className="form-editor-card__toggles-row" onClick={event => event.stopPropagation()}>
        <CmsToggle
          label="작성 기간"
          checked={titleParagraph.showWritingPeriodOnForm ?? false}
          onChange={checked =>
            updateParagraph(titleParagraph.id, p =>
              p.kind === 'description' && p.variant === 'survey_title_with_period'
                ? { ...p, showWritingPeriodOnForm: checked }
                : p
            )
          }
        />
      </div>
    )
  }

  if (hideParagraphRequiredChrome) return undefined

  if (!isSelected) return undefined

  /* 마무리글형: 답변 필수 토글 없음(해당 없음). kind가 어긋나도 single_item용 답변 필수 토글 미노출 */
  if (paragraph.variant === 'closing') {
    return undefined
  }

  if (paragraph.kind === 'single_item') {
    const answerRequired = paragraph.answerRequired ?? paragraph.requiredMark
    const toggles: ReactNode[] = [
      <CmsToggle
        key="answer-required"
        label="답변 필수"
        checked={answerRequired}
        onChange={checked =>
          updateParagraph(paragraph.id, p =>
            p.kind === 'single_item' && p.id === paragraph.id
              ? { ...p, answerRequired: checked, requiredMark: checked }
              : p
          )
        }
      />,
    ]

    if (
      paragraph.variant === 'short_essay' ||
      paragraph.variant === 'session_plan_short_essay'
    ) {
      const shortEssay = paragraph as ShortEssayParagraph
      const itemCount = shortEssay.items?.length ?? 1
      const showItemTitle = itemCount >= 2 ? true : (shortEssay.showItemTitle ?? false)
      toggles.push(
        <CmsToggle
          key="item-title"
          label="항목 타이틀"
          checked={showItemTitle}
          disabled={itemCount >= 2}
          onChange={checked =>
            updateParagraph(shortEssay.id, p =>
              p.kind === 'single_item' &&
              (p.variant === 'short_essay' || p.variant === 'session_plan_short_essay')
                ? { ...p, showItemTitle: checked }
                : p
            )
          }
        />
      )
    }

    if (paragraph.variant === 'multiple_choice') {
      const mc = paragraph as MultipleChoiceParagraph
      toggles.push(
        <CmsToggle
          key="allow-multiple"
          label="중복 선택"
          checked={mc.allowMultiple ?? false}
          onChange={checked =>
            updateParagraph(mc.id, p => {
              if (p.kind !== 'single_item' || p.variant !== 'multiple_choice') return p
              return {
                ...p,
                allowMultiple: checked,
                ...(checked
                  ? { selectedPreviewSingleId: null }
                  : { selectedPreviewMultipleIds: [] }),
              }
            })
          }
        />
      )
    }

    return (
      <div className="form-editor-card__toggles-row" onClick={event => event.stopPropagation()}>
        {toggles}
      </div>
    )
  }

  return undefined
}

export function modalCardFooterActions(
  paragraph: WritingFormParagraph,
  isSelected: boolean,
  updateParagraph: FormEditorLeftPanelProps['updateParagraph'],
  middleParagraphActions: FormEditorLeftPanelProps['middleParagraphActions'],
  paragraphs: WritingFormParagraph[],
  structureLockedParagraphIds?: ReadonlySet<string>
): ReactNode {
  const structureLocked = structureLockedParagraphIds?.has(paragraph.id) ?? false

  if (paragraph.kind === 'single_item' && paragraph.variant === 'horizontal_table') {
    if (!isSelected) return undefined
    const tableParagraph = paragraph as HorizontalTableParagraph
    const dimensionActions = !structureLocked ? (
      <HorizontalTableDimensionActions
        paragraph={tableParagraph}
        onUpdate={next => updateParagraph(tableParagraph.id, () => next)}
      />
    ) : null
    const paragraphActions = middleParagraphActions ? (
      <FormParagraphCardActions
        duplicateDisabled={structureLocked}
        deleteDisabled={structureLocked}
        onAdd={() => middleParagraphActions.onAddAfter(tableParagraph.id)}
        onDuplicate={() => middleParagraphActions.onDuplicate(tableParagraph.id)}
        onDelete={() => middleParagraphActions.onDelete(tableParagraph.id)}
      />
    ) : null
    if (!dimensionActions && !paragraphActions) return undefined
    return (
      <>
        {dimensionActions}
        {paragraphActions}
      </>
    )
  }

  if (paragraph.kind === 'single_item' && paragraph.variant === 'vertical_table') {
    if (!isSelected) return undefined
    const vt = paragraph as VerticalTableParagraph
    if (vt.verticalTableFlavor === 'file_attachment') {
      return middleParagraphActions ? (
        <FormParagraphCardActions
          duplicateDisabled={structureLocked}
          deleteDisabled={structureLocked}
          onAdd={() => middleParagraphActions.onAddAfter(vt.id)}
          onDuplicate={() => middleParagraphActions.onDuplicate(vt.id)}
          onDelete={() => middleParagraphActions.onDelete(vt.id)}
        />
      ) : null
    }
    const dimensionActions = !structureLocked ? (
      <VerticalTableDimensionActions
        paragraph={vt}
        onUpdate={next => updateParagraph(vt.id, () => next)}
      />
    ) : null
    const paragraphActions = middleParagraphActions ? (
      <FormParagraphCardActions
        duplicateDisabled={structureLocked}
        deleteDisabled={structureLocked}
        onAdd={() => middleParagraphActions.onAddAfter(vt.id)}
        onDuplicate={() => middleParagraphActions.onDuplicate(vt.id)}
        onDelete={() => middleParagraphActions.onDelete(vt.id)}
      />
    ) : null
    if (!dimensionActions && !paragraphActions) return undefined
    return (
      <>
        {dimensionActions}
        {paragraphActions}
      </>
    )
  }

  if (!isSelected) return undefined
  if (paragraph.kind === 'description' && paragraph.variant === 'system') {
    if (isAgreementLockedSystemParagraph(paragraph)) return undefined
    return <FormParagraphCardActionsMinimal />
  }
  if (paragraph.kind === 'description' && paragraph.variant === 'closing') {
    return middleParagraphActions ? (
      <FormParagraphCardActionsMinimal
        duplicateDisabled={structureLocked}
        deleteDisabled={structureLocked}
        onAdd={() => {
          const lastMid = getLastMiddleParagraphId(paragraphs)
          if (lastMid != null) {
            middleParagraphActions.onAddAfter(lastMid)
            return
          }
          const split = getWritingFormHeadMiddlePinnedTail(paragraphs)
          if (split != null) middleParagraphActions.onAddAfter(split.head.id)
        }}
        onDuplicate={() => middleParagraphActions.onDuplicate(paragraph.id)}
        onDelete={() => middleParagraphActions.onDelete(paragraph.id)}
      />
    ) : (
      <FormParagraphCardActionsMinimal />
    )
  }

  if (paragraph.kind === 'single_item') {
    if (
      paragraph.variant === 'short_essay' ||
      paragraph.variant === 'session_plan_short_essay'
    ) {
      return (
        <FormParagraphCardActions
          duplicateDisabled={structureLocked}
          deleteDisabled={structureLocked}
          onAddItem={() =>
            updateParagraph(paragraph.id, p => {
              if (
                p.kind !== 'single_item' ||
                (p.variant !== 'short_essay' && p.variant !== 'session_plan_short_essay')
              )
                return p
              const itemIdPrefix =
                p.variant === 'session_plan_short_essay' ? 'session-plan-item' : 'short-essay-item'
              const defaultFirstId = `${itemIdPrefix}-1`
              const currentItems =
                p.items?.length && p.items.length > 0
                  ? p.items
                  : [
                      {
                        id: defaultFirstId,
                        label: 'Title 01',
                        placeholder: p.bodyPlaceholder,
                        bodyText: p.bodyText,
                      },
                    ]
              const nextIndex = currentItems.length + 1
              const nextItems = [
                ...currentItems,
                {
                  id: `${itemIdPrefix}-${nextIndex}`,
                  label: `Title ${String(nextIndex).padStart(2, '0')}`,
                  placeholder: p.bodyPlaceholder,
                  bodyText: '',
                },
              ]
              return {
                ...p,
                items: nextItems,
                bodyText: nextItems[0]?.bodyText ?? '',
                showItemTitle: true,
              }
            })
          }
          onAdd={
            middleParagraphActions
              ? () => middleParagraphActions.onAddAfter(paragraph.id)
              : undefined
          }
          onDuplicate={
            middleParagraphActions
              ? () => middleParagraphActions.onDuplicate(paragraph.id)
              : undefined
          }
          onDelete={
            middleParagraphActions ? () => middleParagraphActions.onDelete(paragraph.id) : undefined
          }
        />
      )
    }
    return middleParagraphActions ? (
      <FormParagraphCardActions
        duplicateDisabled={structureLocked}
        deleteDisabled={structureLocked}
        onAdd={() => middleParagraphActions.onAddAfter(paragraph.id)}
        onDuplicate={() => middleParagraphActions.onDuplicate(paragraph.id)}
        onDelete={() => middleParagraphActions.onDelete(paragraph.id)}
      />
    ) : (
      <FormParagraphCardActions />
    )
  }

  if (isTitleWithPeriodParagraph(paragraph)) {
    return middleParagraphActions ? (
      <FormParagraphCardActionsMinimal
        duplicateDisabled={structureLocked}
        deleteDisabled={structureLocked}
        onAdd={() => middleParagraphActions.onAddAfter(paragraph.id)}
        onDuplicate={() => middleParagraphActions.onDuplicate(paragraph.id)}
        onDelete={() => middleParagraphActions.onDelete(paragraph.id)}
      />
    ) : (
      <FormParagraphCardActionsMinimal />
    )
  }

  return undefined
}
