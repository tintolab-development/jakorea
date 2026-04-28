import { useEffect, useRef, type MouseEvent } from 'react'
import type { ScaleTypeParagraph } from '@/features/template/model/writing-form-draft.schema'
import { createDefaultScaleTypeItems } from '@/features/template/model/writing-form-draft.schema'
import './scale-type.css'

function normalizeItems(paragraph: ScaleTypeParagraph) {
  return paragraph.items?.length ? paragraph.items : createDefaultScaleTypeItems()
}

/** 단일항목 점수선택형 — 가로 척도 미리보기 */
export function ScaleType({
  paragraph,
  onChange,
  isEditMode,
}: {
  paragraph: ScaleTypeParagraph
  onChange: (next: ScaleTypeParagraph) => void
  isEditMode: boolean
}) {
  const items = normalizeItems(paragraph)
  const prevEditModeRef = useRef(isEditMode)
  const selectedId = isEditMode ? (paragraph.selectedPreviewItemId ?? null) : null

  useEffect(() => {
    const wasEditMode = prevEditModeRef.current
    if (!wasEditMode && isEditMode) {
      onChange({
        ...paragraph,
        items,
        selectedPreviewItemId: null,
      })
    }
    prevEditModeRef.current = isEditMode
  }, [isEditMode, items, onChange, paragraph])

  const handleItemClick = (event: MouseEvent<HTMLButtonElement>, itemId: string) => {
    if (!isEditMode) return
    event.stopPropagation()
    onChange({
      ...paragraph,
      items,
      selectedPreviewItemId: itemId,
    })
  }

  return (
    <div
      className={['scale-type-bar', !isEditMode ? 'scale-type-bar--disabled' : ''].filter(Boolean).join(' ')}
      role="group"
      aria-label="점수 선택"
    >
      {items.map(item => (
        <button
          key={item.id}
          type="button"
          disabled={!isEditMode}
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
