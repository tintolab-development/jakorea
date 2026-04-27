import type { ShortEssayParagraph } from '@/features/template/model/writing-form-draft.schema'
import { ParagraphLabelInput } from '@/features/template/ui/paragraph/shared/paragraph-label-input'
import './short-essay.css'

/** 주관식형 (short-essay) — 단락 바디 슬롯 (추후 본문 연동) */
export function ShortEssay({
  paragraph,
  onChange,
  isEditMode,
  activeItemId,
  onSelectItem,
}: {
  paragraph: ShortEssayParagraph
  onChange: (next: ShortEssayParagraph) => void
  isEditMode: boolean
  activeItemId?: string | null
  onSelectItem?: (itemId: string | null) => void
}) {
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
            disabled={!isEditMode}
            className={activeItemId === item.id ? 'short-essay-item--active' : undefined}
            value={item.bodyText}
            placeholder={item.placeholder ?? ph}
            onClick={event => {
              event.stopPropagation()
              handleItemClick(item.id)
            }}
            onChange={isEditMode ? e => updateItemBodyText(item.id, e.target.value) : undefined}
          />
          {isEditMode && index > 0 ? (
            <button
              type="button"
              className="short-essay-item-remove"
              aria-label={`항목 ${index + 1} 삭제`}
              onClick={event => {
                event.stopPropagation()
                removeItem(item.id)
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden
              >
                <mask
                  id={`short-essay-item-remove-mask-${item.id}`}
                  style={{ maskType: 'alpha' }}
                  maskUnits="userSpaceOnUse"
                  x="0"
                  y="0"
                  width="24"
                  height="24"
                >
                  <rect width="24" height="24" fill="#D9D9D9" />
                </mask>
                <g mask={`url(#short-essay-item-remove-mask-${item.id})`}>
                  <path
                    d="M12 13.0538L15.073 16.127C15.2115 16.2653 15.3856 16.3362 15.5953 16.3395C15.8048 16.3427 15.982 16.2718 16.127 16.127C16.2718 15.982 16.3443 15.8063 16.3443 15.6C16.3443 15.3937 16.2718 15.218 16.127 15.073L13.0538 12L16.127 8.927C16.2653 8.7885 16.3362 8.61442 16.3395 8.40475C16.3427 8.19525 16.2718 8.018 16.127 7.873C15.982 7.72817 15.8063 7.65575 15.6 7.65575C15.3937 7.65575 15.218 7.72817 15.073 7.873L12 10.9462L8.927 7.873C8.7885 7.73467 8.61442 7.66383 8.40475 7.6605C8.19525 7.65733 8.018 7.72817 7.873 7.873C7.72817 8.018 7.65575 8.19367 7.65575 8.4C7.65575 8.60633 7.72817 8.782 7.873 8.927L10.9462 12L7.873 15.073C7.73467 15.2115 7.66383 15.3856 7.6605 15.5953C7.65733 15.8048 7.72817 15.982 7.873 16.127C8.018 16.2718 8.19367 16.3443 8.4 16.3443C8.60633 16.3443 8.782 16.2718 8.927 16.127L12 13.0538ZM12.0017 21.5C10.6877 21.5 9.45267 21.2507 8.2965 20.752C7.14033 20.2533 6.13467 19.5766 5.2795 18.7218C4.42433 17.8669 3.74725 16.8617 3.24825 15.706C2.74942 14.5503 2.5 13.3156 2.5 12.0017C2.5 10.6877 2.74933 9.45267 3.248 8.2965C3.74667 7.14033 4.42342 6.13467 5.27825 5.2795C6.13308 4.42433 7.13833 3.74725 8.294 3.24825C9.44967 2.74942 10.6844 2.5 11.9983 2.5C13.3123 2.5 14.5473 2.74933 15.7035 3.248C16.8597 3.74667 17.8653 4.42342 18.7205 5.27825C19.5757 6.13308 20.2528 7.13833 20.7518 8.294C21.2506 9.44967 21.5 10.6844 21.5 11.9983C21.5 13.3123 21.2507 14.5473 20.752 15.7035C20.2533 16.8597 19.5766 17.8653 18.7218 18.7205C17.8669 19.5757 16.8617 20.2528 15.706 20.7518C14.5503 21.2506 13.3156 21.5 12.0017 21.5Z"
                    fill="#3D3D3D"
                    fillOpacity="0.5"
                  />
                </g>
              </svg>
            </button>
          ) : null}
        </div>
      ))}
    </div>
  )
}
