import { useEffect, useId, useRef } from 'react'
import type { SessionPlanShortEssayParagraph } from '@/features/template/model/writing-form-draft.schema'
import type { ParagraphBodyInteractionMode } from '@/features/template/ui/paragraph/renderers/paragraph-body-interaction-mode'
import { CmsTextArea } from '@/shared/ui/cms-textarea'
import { ItemDeleteButton } from '@/features/template/ui/shared/item-delete-button'
import { ParagraphLabelInput } from '@/features/template/ui/shared/paragraph-label-input'
import { useDeferredFieldCommit } from '@/features/template/ui/shared/use-deferred-field-commit'
import { SessionPlanItemTitle } from '@/features/template/ui/paragraph/single-item/session-plan-item-title'
import './session-plan-short-essay.css'

function SessionPlanDeferredBodyField({
  itemId,
  bodyText,
  placeholder,
  className,
  rows,
  expandableFromSingleRow,
  isBodyInteractive,
  onSelectItem,
  onCommitBody,
  controlId,
  labelledBy,
  usePlainLabelInput,
}: {
  itemId: string
  bodyText: string
  placeholder: string
  className?: string
  rows: number
  expandableFromSingleRow?: boolean
  isBodyInteractive: boolean
  onSelectItem: () => void
  onCommitBody: (itemId: string, bodyText: string) => void
  controlId?: string
  labelledBy?: string
  usePlainLabelInput: boolean
}) {
  const {
    value: editValue,
    setValue: setEditValue,
    flush: flushEditValue,
  } = useDeferredFieldCommit(
    bodyText,
    isBodyInteractive ? next => onCommitBody(itemId, next) : undefined
  )

  if (usePlainLabelInput) {
    return (
      <ParagraphLabelInput
        className={className}
        value={editValue}
        placeholder={placeholder}
        rows={rows}
        expandableFromSingleRow={expandableFromSingleRow}
        onClick={event => {
          event.stopPropagation()
          onSelectItem()
        }}
        onChange={isBodyInteractive ? e => setEditValue(e.target.value) : undefined}
        onBlur={isBodyInteractive ? () => flushEditValue() : undefined}
        readOnly={!isBodyInteractive}
      />
    )
  }

  return (
    <CmsTextArea
      id={controlId}
      inputSize="medium"
      width="100%"
      rootClassName="session-plan-short-essay-block__textarea-root"
      className="session-plan-short-essay-block__textarea"
      value={editValue}
      placeholder={placeholder}
      onChange={isBodyInteractive ? e => setEditValue(e.target.value) : undefined}
      onBlur={isBodyInteractive ? () => flushEditValue() : undefined}
      readOnly={!isBodyInteractive}
      aria-labelledby={labelledBy}
      rows={rows}
    />
  )
}

/**
 * N차시 교육 계획 전용 단락 본문 — `short_essay`와 UI·성격 분리.
 * 항목별 상단 타이틀 밴드 + 하단 입력(스펙: 헤더 54px·블록 간격 20px 등).
 */
export function SessionPlanShortEssay({
  paragraph,
  onChange,
  isCardSelected,
  isBodyInteractive,
  paragraphInteractionMode = 'authoring',
  activeItemId,
  onSelectItem,
}: {
  paragraph: SessionPlanShortEssayParagraph
  onChange: (next: SessionPlanShortEssayParagraph) => void
  isCardSelected: boolean
  isBodyInteractive: boolean
  paragraphInteractionMode?: ParagraphBodyInteractionMode
  activeItemId?: string | null
  onSelectItem?: (itemId: string | null) => void
}) {
  const paragraphRef = useRef(paragraph)
  paragraphRef.current = paragraph

  const prevCardSelected = useRef(isCardSelected)
  useEffect(() => {
    if (
      paragraphInteractionMode === 'authoring' &&
      prevCardSelected.current &&
      !isCardSelected
    ) {
      const p = paragraphRef.current
      const baseItems =
        p.items && p.items.length > 0
          ? p.items
          : [
              {
                id: 'session-plan-item-1',
                label: 'Title 01',
                placeholder: p.bodyPlaceholder.trim() || '자유롭게 작성해 주세요',
                bodyText: p.bodyText,
              },
            ]
      const showItemTitle = baseItems.length >= 2 ? true : (p.showItemTitle ?? false)
      const clearedItems = baseItems.map(item => ({ ...item, bodyText: '' }))
      onChange({
        ...p,
        bodyText: '',
        items: clearedItems,
        showItemTitle,
      })
    }
    prevCardSelected.current = isCardSelected
  }, [isCardSelected, onChange, paragraphInteractionMode])

  const ph = paragraph.bodyPlaceholder.trim() || '자유롭게 작성해 주세요'
  const items =
    paragraph.items && paragraph.items.length > 0
      ? paragraph.items
      : [
          {
            id: 'session-plan-item-1',
            label: 'Title 01',
            placeholder: ph,
            bodyText: paragraph.bodyText,
          },
        ]
  const showItemTitle = items.length >= 2 ? true : (paragraph.showItemTitle ?? false)

  const updateItemBodyText = (id: string, bodyText: string) => {
    const p = paragraphRef.current
    const currentItems =
      p.items && p.items.length > 0
        ? p.items
        : [
            {
              id: 'session-plan-item-1',
              label: 'Title 01',
              placeholder: ph,
              bodyText: p.bodyText,
            },
          ]
    const nextItems = currentItems.map(item => (item.id === id ? { ...item, bodyText } : item))
    const nextShowItemTitle = nextItems.length >= 2 ? true : (p.showItemTitle ?? false)
    onChange({
      ...p,
      items: nextItems,
      bodyText: nextItems[0]?.bodyText ?? '',
      showItemTitle: nextShowItemTitle,
    })
  }

  const removeItem = (id: string) => {
    const nextItems = items.filter(item => item.id !== id)
    if (nextItems.length === 0) return
    const nextShowItemTitle = nextItems.length >= 2 ? true : (paragraph.showItemTitle ?? false)
    onChange({
      ...paragraph,
      items: nextItems,
      bodyText: nextItems[0]?.bodyText ?? '',
      showItemTitle: nextShowItemTitle,
    })
    if (activeItemId === id) {
      const nextFocused = nextItems[0]?.id ?? null
      onSelectItem?.(nextFocused)
    }
  }

  const handleItemClick = (id: string) => {
    if (!isBodyInteractive) return
    const nextFocused = activeItemId === id ? null : id
    onSelectItem?.(nextFocused)
  }

  const stackUid = useId()

  if (!showItemTitle) {
    return (
      <div className="session-plan-short-essay-items session-plan-short-essay-items--plain">
        {items.map((item, index) => (
          <div key={item.id} className="session-plan-short-essay-item-row">
            <SessionPlanDeferredBodyField
              itemId={item.id}
              bodyText={item.bodyText}
              placeholder={item.placeholder ?? ph}
              className={
                activeItemId === item.id ? 'session-plan-short-essay-item--active' : undefined
              }
              rows={1}
              expandableFromSingleRow
              isBodyInteractive={isBodyInteractive}
              onSelectItem={() => handleItemClick(item.id)}
              onCommitBody={updateItemBodyText}
              usePlainLabelInput
            />
            {isBodyInteractive && isCardSelected && index > 0 ? (
              <ItemDeleteButton
                className="item-delete-button"
                aria-label={`항목 ${index + 1} 삭제`}
                onClick={event => {
                  event.stopPropagation()
                  removeItem(item.id)
                }}
              />
            ) : null}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="session-plan-short-essay-items">
      {items.map((item, index) => {
        const controlId = `session-plan-stack-${stackUid}-${item.id}`
        const titleText = item.label ?? `Title ${String(index + 1).padStart(2, '0')}`
        return (
          <div
            key={item.id}
            className={[
              'session-plan-short-essay-block',
              activeItemId === item.id ? 'session-plan-short-essay-block--active' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            onClick={event => {
              event.stopPropagation()
              handleItemClick(item.id)
            }}
          >
            <div className="session-plan-short-essay-block__header">
              <SessionPlanItemTitle
                id={`${controlId}-label`}
                itemId={item.id}
                label={titleText}
                titleHint={item.titleHint}
              />
              {isBodyInteractive && isCardSelected && index > 0 ? (
                <ItemDeleteButton
                  className="item-delete-button session-plan-short-essay-block__delete"
                  aria-label={`항목 ${index + 1} 삭제`}
                  onClick={event => {
                    event.stopPropagation()
                    removeItem(item.id)
                  }}
                />
              ) : null}
            </div>
            <div className="session-plan-short-essay-block__footer">
              <SessionPlanDeferredBodyField
                itemId={item.id}
                bodyText={item.bodyText}
                placeholder={item.placeholder ?? ph}
                rows={1}
                isBodyInteractive={isBodyInteractive}
                onSelectItem={() => handleItemClick(item.id)}
                onCommitBody={updateItemBodyText}
                controlId={controlId}
                labelledBy={`${controlId}-label`}
                usePlainLabelInput={false}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
