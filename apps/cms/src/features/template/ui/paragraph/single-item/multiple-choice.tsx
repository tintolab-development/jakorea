import type { MouseEvent } from 'react'
import type { MultipleChoiceParagraph } from '@/features/template/model/writing-form-draft.schema'
import { createDefaultMultipleChoiceItems } from '@/features/template/model/writing-form-draft.schema'
import { CmsCheckbox } from '@/shared/ui/cms-checkbox'
import { CmsRadio, CmsRadioGroup } from '@/shared/ui/cms-radio'
import './multiple-choice.css'

/** 항목 영역 선택 → 좌측 테두리·우측「항목 수정」연동 (실제 항목 id와 구분) */
export const MULTIPLE_CHOICE_EDITOR_ITEMS_SURFACE_ID = '__mc_editor_items_surface__' as const

function normalizeItems(paragraph: MultipleChoiceParagraph) {
  return paragraph.items?.length ? paragraph.items : createDefaultMultipleChoiceItems()
}

function mergeParagraph(
  paragraph: MultipleChoiceParagraph,
  partial: Partial<MultipleChoiceParagraph>
): MultipleChoiceParagraph {
  const next = { ...paragraph, ...partial }
  if (!next.items?.length) next.items = createDefaultMultipleChoiceItems()
  return next
}

/** 객관식형 — 단락 바디: 라디오(단일) / 체크박스(중복 선택) */
export function MultipleChoice({
  paragraph,
  onChange,
  isEditMode,
  activeItemId,
  onSelectItem,
}: {
  paragraph: MultipleChoiceParagraph
  onChange: (next: MultipleChoiceParagraph) => void
  isEditMode: boolean
  activeItemId?: string | null
  onSelectItem?: (itemId: string | null) => void
}) {
  const items = normalizeItems(paragraph)
  const allowMultiple = paragraph.allowMultiple ?? false
  const singleId = paragraph.selectedPreviewSingleId ?? null
  const multiIds = paragraph.selectedPreviewMultipleIds ?? []

  const patch = (partial: Partial<MultipleChoiceParagraph>) => {
    onChange(mergeParagraph(paragraph, partial))
  }

  const itemsSurfaceSelected = activeItemId === MULTIPLE_CHOICE_EDITOR_ITEMS_SURFACE_ID

  const handleItemsSurfaceClick = (event: MouseEvent) => {
    if (!isEditMode) return
    event.stopPropagation()
    onSelectItem?.(MULTIPLE_CHOICE_EDITOR_ITEMS_SURFACE_ID)
  }

  const bodyClass = [
    'multiple-choice-body',
    itemsSurfaceSelected ? 'multiple-choice-body--selected' : '',
  ]
    .filter(Boolean)
    .join(' ')

  if (allowMultiple) {
    const toggleMulti = (id: string, checked: boolean) => {
      const set = new Set(multiIds)
      if (checked) set.add(id)
      else set.delete(id)
      patch({ selectedPreviewMultipleIds: [...set] })
    }

    return (
      <div role="presentation" className={bodyClass} onClick={handleItemsSurfaceClick}>
        {items.map(item => (
          <div key={item.id} role="presentation" className="multiple-choice-row">
            <CmsCheckbox
              checked={multiIds.includes(item.id)}
              onChange={e => toggleMulti(item.id, e.target.checked)}
            />
            <span className="multiple-choice-row__label">{item.label}</span>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div role="presentation" className={bodyClass} onClick={handleItemsSurfaceClick}>
      <CmsRadioGroup
        className="multiple-choice-radio-group"
        value={singleId ?? undefined}
        onChange={e => patch({ selectedPreviewSingleId: e.target.value })}
      >
        {items.map(item => (
          <div key={item.id} role="presentation" className="multiple-choice-row">
            <CmsRadio value={item.id} />
            <span className="multiple-choice-row__label">{item.label}</span>
          </div>
        ))}
      </CmsRadioGroup>
    </div>
  )
}
