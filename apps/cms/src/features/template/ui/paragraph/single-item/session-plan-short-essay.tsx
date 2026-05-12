import { useEffect, useId, useRef } from 'react'
import type { SessionPlanShortEssayParagraph } from '@/features/template/model/writing-form-draft.schema'
import type { ParagraphBodyInteractionMode } from '@/features/template/ui/paragraph/paragraph-body-interaction-mode'
import { CmsTextArea } from '@/shared/ui/cms-textarea'
import { ItemDeleteButton } from '@/features/template/ui/paragraph/shared/item-delete-button'
import './session-plan-short-essay.css'

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
    const nextItems = items.map(item => (item.id === id ? { ...item, bodyText } : item))
    onChange({
      ...paragraph,
      items: nextItems,
      bodyText: nextItems[0]?.bodyText ?? '',
      showItemTitle,
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
    const nextFocused = activeItemId === id ? null : id
    onSelectItem?.(nextFocused)
  }

  const stackUid = useId()

  if (!showItemTitle) {
    return (
      <div className="session-plan-short-essay-items">
        {items.map((item, index) => (
          <div key={item.id} className="session-plan-short-essay-item-row">
            <div className="session-plan-short-essay-block">
              <div className="session-plan-short-essay-block__footer">
                <CmsTextArea
                  inputSize="medium"
                  width="100%"
                  rootClassName="session-plan-short-essay-block__textarea-root"
                  className="session-plan-short-essay-block__textarea"
                  value={item.bodyText}
                  placeholder={item.placeholder ?? ph}
                  onChange={
                    isBodyInteractive
                      ? e => updateItemBodyText(item.id, e.target.value)
                      : undefined
                  }
                  readOnly={!isBodyInteractive}
                  rows={1}
                />
              </div>
            </div>
            {isCardSelected && index > 0 ? (
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
              <span className="session-plan-short-essay-block__title" id={`${controlId}-label`}>
                {titleText}
              </span>
              {isCardSelected && index > 0 ? (
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
              <CmsTextArea
                id={controlId}
                inputSize="medium"
                width="100%"
                rootClassName="session-plan-short-essay-block__textarea-root"
                className="session-plan-short-essay-block__textarea"
                value={item.bodyText}
                placeholder={item.placeholder ?? ph}
                onChange={
                  isBodyInteractive ? e => updateItemBodyText(item.id, e.target.value) : undefined
                }
                readOnly={!isBodyInteractive}
                aria-labelledby={`${controlId}-label`}
                rows={1}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
