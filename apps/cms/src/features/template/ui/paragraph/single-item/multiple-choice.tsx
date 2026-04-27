import type { MultipleChoiceParagraph } from '@/features/template/model/writing-form-draft.schema'
import { createDefaultMultipleChoiceItems } from '@/features/template/model/writing-form-draft.schema'
import { CmsCheckbox } from '@/shared/ui/cms-checkbox'
import { CmsRadio, CmsRadioGroup } from '@/shared/ui/cms-radio'
import './multiple-choice.css'

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
}: {
  paragraph: MultipleChoiceParagraph
  onChange: (next: MultipleChoiceParagraph) => void
  isEditMode: boolean
}) {
  const items = normalizeItems(paragraph)
  const allowMultiple = paragraph.allowMultiple ?? false
  const singleId = paragraph.selectedPreviewSingleId ?? null
  const multiIds = paragraph.selectedPreviewMultipleIds ?? []

  const patch = (partial: Partial<MultipleChoiceParagraph>) => {
    onChange(mergeParagraph(paragraph, partial))
  }

  const bodyClass = [
    'multiple-choice-body',
    isEditMode ? 'multiple-choice-body--selected' : '',
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
      <div role="presentation" className={bodyClass}>
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
    <div role="presentation" className={bodyClass}>
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
