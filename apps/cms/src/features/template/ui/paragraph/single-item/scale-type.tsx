import { memo, useEffect, useRef, type MouseEvent } from 'react'
import type { ScaleTypeParagraph } from '@/features/template/model/writing-form-draft.schema'
import { createDefaultScaleTypeItems } from '@/features/template/model/writing-form-draft.schema'
import type { ParagraphBodyInteractionMode } from '@/features/template/ui/paragraph/renderers/paragraph-body-interaction-mode'
import './scale-type.css'

function normalizeItems(paragraph: ScaleTypeParagraph) {
  return paragraph.items?.length ? paragraph.items : createDefaultScaleTypeItems()
}

type ScaleTypeProps = {
  paragraph: ScaleTypeParagraph
  /** 미리보기 선택만 갱신 — 제목/설명 편집과 충돌하지 않도록 함수형 패치용 */
  onSelectPreviewItem: (selectedPreviewItemId: string | null) => void
  /** 단락 카드 선택 — authoring 시 카드 선택 진입에 따른 미리보기 정리 */
  isCardSelected: boolean
  /** 척도 클릭 — user 모드에서는 카드 비선택이어도 true일 수 있음 */
  isBodyInteractive: boolean
  paragraphInteractionMode?: ParagraphBodyInteractionMode
}

function scaleTypePropsEqual(prev: ScaleTypeProps, next: ScaleTypeProps): boolean {
  return (
    prev.isCardSelected === next.isCardSelected &&
    prev.isBodyInteractive === next.isBodyInteractive &&
    (prev.paragraphInteractionMode ?? 'authoring') ===
      (next.paragraphInteractionMode ?? 'authoring') &&
    prev.paragraph.selectedPreviewItemId === next.paragraph.selectedPreviewItemId &&
    prev.paragraph.bodyText === next.paragraph.bodyText &&
    prev.paragraph.items === next.paragraph.items
  )
}

/** 단일항목 점수선택형 — 가로 척도 미리보기 */
function ScaleTypeInner({
  paragraph,
  onSelectPreviewItem,
  isCardSelected,
  isBodyInteractive,
  paragraphInteractionMode = 'authoring',
}: ScaleTypeProps) {
  const items = normalizeItems(paragraph)
  const prevCardSelectedRef = useRef(isCardSelected)
  const onSelectRef = useRef(onSelectPreviewItem)
  onSelectRef.current = onSelectPreviewItem
  const selectedId = isBodyInteractive ? (paragraph.selectedPreviewItemId ?? null) : null
  const bodyText = paragraph.bodyText?.trim() ?? ''

  useEffect(() => {
    const wasCardSelected = prevCardSelectedRef.current
    prevCardSelectedRef.current = isCardSelected
    if (paragraphInteractionMode !== 'authoring' || wasCardSelected || !isCardSelected) return
    onSelectRef.current(null)
  }, [isCardSelected, paragraphInteractionMode])

  const handleItemClick = (event: MouseEvent<HTMLButtonElement>, itemId: string) => {
    if (!isBodyInteractive) return
    event.stopPropagation()
    onSelectRef.current(itemId)
  }

  return (
    <div className="scale-type">
      {bodyText.length > 0 ? (
        <div className="scale-type__body-text">{bodyText}</div>
      ) : null}
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
    </div>
  )
}

export const ScaleType = memo(ScaleTypeInner, scaleTypePropsEqual)
