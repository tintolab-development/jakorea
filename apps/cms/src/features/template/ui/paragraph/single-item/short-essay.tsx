import { useEffect, useRef } from 'react'
import type { ShortEssayParagraph } from '@/features/template/model/writing-form-draft.schema'
import type { ParagraphBodyInteractionMode } from '@/features/template/ui/paragraph/paragraph-body-interaction-mode'
import { ItemDeleteButton } from '@/features/template/ui/paragraph/shared/item-delete-button'
import { ParagraphLabelInput } from '@/features/template/ui/paragraph/shared/paragraph-label-input'
import './short-essay.css'

/** 주관식형 (short_essay) — 단락 바디 슬롯 */
export function ShortEssay({
  paragraph,
  onChange,
  isCardSelected,
  isBodyInteractive,
  paragraphInteractionMode = 'authoring',
  activeItemId,
  onSelectItem,
}: {
  paragraph: ShortEssayParagraph
  onChange: (next: ShortEssayParagraph) => void
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
                id: 'short-essay-item-1',
                label: 'Title 01',
                placeholder: p.bodyPlaceholder.trim() || '답변을 입력해 주세요',
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

  const ph = paragraph.bodyPlaceholder.trim() || '답변을 입력해 주세요'
  const items =
    paragraph.items && paragraph.items.length > 0
      ? paragraph.items
      : [
          {
            id: 'short-essay-item-1',
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

  return (
    <div className="short-essay-items">
      {items.map((item, index) => (
        <div key={item.id} className="short-essay-item-row">
          <ParagraphLabelInput
            label={
              showItemTitle
                ? (item.label ?? `Title ${String(index + 1).padStart(2, '0')}`)
                : undefined
            }
            className={activeItemId === item.id ? 'short-essay-item--active' : undefined}
            value={item.bodyText}
            placeholder={item.placeholder ?? ph}
            onClick={event => {
              event.stopPropagation()
              handleItemClick(item.id)
            }}
            onChange={isBodyInteractive ? e => updateItemBodyText(item.id, e.target.value) : undefined}
          />
          {isCardSelected && index > 0 ? (
            <ItemDeleteButton
              className="item-delete-button short-essay-item-delete"
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
