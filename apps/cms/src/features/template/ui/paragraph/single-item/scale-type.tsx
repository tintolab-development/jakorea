import { useEffect, useRef, type MouseEvent } from 'react'
import type { ScaleTypeParagraph } from '@/features/template/model/writing-form-draft.schema'
import { createDefaultScaleTypeItems } from '@/features/template/model/writing-form-draft.schema'
import type { ParagraphBodyInteractionMode } from '@/features/template/ui/paragraph/renderers/paragraph-body-interaction-mode'
import './scale-type.css'

function normalizeItems(paragraph: ScaleTypeParagraph) {
  return paragraph.items?.length ? paragraph.items : createDefaultScaleTypeItems()
}

/** 단일항목 점수선택형 — 가로 척도 미리보기 */
export function ScaleType({
  paragraph,
  onChange,
  isCardSelected,
  isBodyInteractive,
  paragraphInteractionMode = 'authoring',
}: {
  paragraph: ScaleTypeParagraph
  onChange: (next: ScaleTypeParagraph) => void
  /** 단락 카드 선택 — authoring 시 카드 선택 진입에 따른 미리보기 정리 */
  isCardSelected: boolean
  /** 척도 클릭 — user 모드에서는 카드 비선택이어도 true일 수 있음 */
  isBodyInteractive: boolean
  paragraphInteractionMode?: ParagraphBodyInteractionMode
}) {
  const items = normalizeItems(paragraph)
  const prevCardSelectedRef = useRef(isCardSelected)
  const selectedId = isBodyInteractive ? (paragraph.selectedPreviewItemId ?? null) : null

  useEffect(() => {
    const wasCardSelected = prevCardSelectedRef.current
    if (paragraphInteractionMode === 'authoring' && !wasCardSelected && isCardSelected) {
      onChange({
        ...paragraph,
        items,
        selectedPreviewItemId: null,
      })
    }
    prevCardSelectedRef.current = isCardSelected
  }, [isCardSelected, paragraphInteractionMode, items, onChange, paragraph])

  const handleItemClick = (event: MouseEvent<HTMLButtonElement>, itemId: string) => {
    if (!isBodyInteractive) return
    event.stopPropagation()
    onChange({
      ...paragraph,
      items,
      selectedPreviewItemId: itemId,
    })
  }

  return (
    <div
      className={['scale-type-bar', !isBodyInteractive ? 'scale-type-bar--disabled' : '']
        .filter(Boolean)
        .join(' ')}
      role="group"
      aria-label="점수 선택"
    >
      {items.map(item => (
        <button
          key={item.id}
          type="button"
          disabled={!isBodyInteractive}
          className={[
            'scale-type-item',
            selectedId === item.id ? 'scale-type-item--selected' : '',
          ]
            .filter(Boolean)
            .join(' ')}
          aria-pressed={selectedId === item.id}
          onClick={e => handleItemClick(e, item.id)}
        >
          {item.label}
        </button>
      ))}
    </div>
  )
}
