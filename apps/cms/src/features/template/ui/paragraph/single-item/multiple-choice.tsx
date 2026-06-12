import { useEffect, useRef, type MouseEvent as ReactMouseEvent } from 'react'
import type { MultipleChoiceParagraph } from '@/features/template/model/writing-form-draft.schema'
import { createDefaultMultipleChoiceItems } from '@/features/template/model/writing-form-draft.schema'
import {
  isFormPreviewReadonlyMode,
  type ParagraphBodyInteractionMode,
} from '@/features/template/ui/paragraph/renderers/paragraph-body-interaction-mode'
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
  isCardSelected,
  isBodyInteractive,
  paragraphInteractionMode = 'authoring',
  itemsEditActive,
  onActivateItemsEditor,
}: {
  paragraph: MultipleChoiceParagraph
  onChange: (next: MultipleChoiceParagraph) => void
  /** 단락 카드 선택 — authoring 시 미리보기 클리어·항목 포커스 테두리 */
  isCardSelected: boolean
  /** 본문(미리보기) 조작 가능 — user 모드에서는 카드 비선택이어도 true일 수 있음 */
  isBodyInteractive: boolean
  /** user일 때는 카드 비선택으로 미리보기 선택값을 초기화하지 않음 */
  paragraphInteractionMode?: ParagraphBodyInteractionMode
  /** 항목 영역(라디오/체크박스 바디) 포커스 — 단락 카드만 선택된 상태와 구분 */
  itemsEditActive: boolean
  /** 항목 영역 클릭 시 우측「항목 수정」·선택 테두리 연동 */
  onActivateItemsEditor?: () => void
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
      onChange(
        mergeParagraph(p, {
          selectedPreviewSingleId: null,
          selectedPreviewMultipleIds: [],
        })
      )
    }
    prevCardSelected.current = isCardSelected
  }, [isCardSelected, onChange, paragraphInteractionMode])

  const items = normalizeItems(paragraph)
  const allowMultiple = paragraph.allowMultiple ?? false
  const singleId = paragraph.selectedPreviewSingleId ?? null
  const multiIds = paragraph.selectedPreviewMultipleIds ?? []
  const isPreviewReadonly = isFormPreviewReadonlyMode(paragraphInteractionMode)
  const controlDisabled = !isBodyInteractive && !isPreviewReadonly

  const patch = (partial: Partial<MultipleChoiceParagraph>) => {
    if (!isBodyInteractive) return
    onChange(mergeParagraph(paragraph, partial))
  }

  const bodyClass = [
    'multiple-choice-body',
    itemsEditActive ? 'multiple-choice-body--selected' : '',
  ]
    .filter(Boolean)
    .join(' ')

  const handleBodyClick = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (!isBodyInteractive || !onActivateItemsEditor) return
    event.stopPropagation()
    onActivateItemsEditor()
  }

  if (allowMultiple) {
    const toggleMulti = (id: string, checked: boolean) => {
      const set = new Set(multiIds)
      if (checked) set.add(id)
      else set.delete(id)
      patch({ selectedPreviewMultipleIds: [...set] })
    }

    return (
      <div role="presentation" className={bodyClass} onClick={handleBodyClick}>
        {items.map(item => (
          <div key={item.id} role="presentation" className="multiple-choice-row">
            <CmsCheckbox
              disabled={controlDisabled}
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
    <div role="presentation" className={bodyClass} onClick={handleBodyClick}>
      <CmsRadioGroup
        className="multiple-choice-radio-group"
        disabled={controlDisabled}
        value={singleId ?? undefined}
        onChange={e => patch({ selectedPreviewSingleId: e.target.value })}
      >
        {items.map(item => (
          <div key={item.id} role="presentation" className="multiple-choice-row">
            <CmsRadio value={item.id} disabled={controlDisabled} />
            <span className="multiple-choice-row__label">{item.label}</span>
          </div>
        ))}
      </CmsRadioGroup>
    </div>
  )
}
