import { useCallback, useMemo, useState } from 'react'
import type { FormTitleNumberingStyle } from '@/features/template/model/writing-form-draft.schema'
import { FormEditorFieldNav } from '@/features/template/ui/form-editor/left-panel/form-editor-field-nav'
import { FormEditorTitleNumberingField } from '@/features/template/ui/form-editor/right-panel/form-editor-right-panel'
import { GEMINI_RECRUITMENT_ADD_SECTION_IDS } from '../../lib/recruitment/add-form-options'
import '@/features/template/ui/form-editor/form-editor.css'

const NAV_ITEMS = [
  {
    id: GEMINI_RECRUITMENT_ADD_SECTION_IDS.institution,
    displayLine: '1. 참여 기관 모집 정보',
  },
  {
    id: GEMINI_RECRUITMENT_ADD_SECTION_IDS.detail,
    displayLine: '2. 상세 정보',
  },
] as const

const HIDE_DRAG_HANDLE_IDS = new Set<string>(NAV_ITEMS.map(item => item.id))

export function GeminiRecruitmentAddFormSidebar() {
  const [selectedItemId, setSelectedItemId] = useState<string | null>(NAV_ITEMS[0]?.id ?? null)
  const [titleNumbering, setTitleNumbering] = useState<FormTitleNumberingStyle>('none')

  const sortableMiddle = useMemo(
    () => NAV_ITEMS.map(item => ({ id: item.id, displayLine: item.displayLine })),
    []
  )

  const handleSelectItem = useCallback((id: string) => {
    setSelectedItemId(id)
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  return (
    <FormEditorFieldNav
      sectionTitle="커스텀 필드"
      sortableMiddle={sortableMiddle}
      hideSortableDragHandleForIds={HIDE_DRAG_HANDLE_IDS}
      selectedItemId={selectedItemId}
      onSelectItem={handleSelectItem}
      onReorderMiddle={() => undefined}
      fieldListBottomSlot={
        <FormEditorTitleNumberingField value={titleNumbering} onChange={setTitleNumbering} />
      }
    />
  )
}
