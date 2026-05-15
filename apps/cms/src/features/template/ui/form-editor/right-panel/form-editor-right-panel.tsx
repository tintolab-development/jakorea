import type { FormTitleNumberingStyle } from '@/features/template/model/writing-form-draft.schema'
import { CmsSelect } from '@/shared/ui/cms-select'
import { ParagraphCustomFieldsFormShell, ParagraphCustomFieldsSection } from '@/features/template/ui/form-editor/right-panel/sections/paragraph-custom-fields-section'
import { ParagraphMetaSection } from '@/features/template/ui/form-editor/right-panel/sections/paragraph-meta-section'
import { ParagraphSettingsSection } from '@/features/template/ui/form-editor/right-panel/sections/paragraph-settings-section'
import { StructureLockedParagraphSection } from '@/features/template/ui/form-editor/right-panel/sections/structure-locked-section'
import { useActiveParagraphState } from '@/features/template/ui/form-editor/right-panel/hooks/use-active-paragraph'
import { useParagraphConversion } from '@/features/template/ui/form-editor/right-panel/hooks/use-paragraph-conversion'
import { useShortEssayEditorState } from '@/features/template/ui/form-editor/right-panel/hooks/use-short-essay-state'
import type { FormEditorRightPanelProps } from '@/features/template/ui/form-editor/right-panel/form-editor-right-panel.types'
import '../form-editor.css'

const TITLE_NUMBERING_OPTIONS: { value: FormTitleNumberingStyle; label: string }[] = [
  { value: 'numeric', label: '1, 2, 3' },
  { value: 'alpha', label: 'A, B, C' },
  { value: 'q_repeat', label: 'Q, Q, Q' },
  { value: 'q123', label: 'Q1, Q2, Q3' },
  { value: 'none', label: '미선택' },
]

export type { FormEditorRightPanelProps } from '@/features/template/ui/form-editor/right-panel/form-editor-right-panel.types'

export function FormEditorTitleNumberingField({
  value,
  onChange,
}: {
  value: FormTitleNumberingStyle
  onChange: (style: FormTitleNumberingStyle) => void
}) {
  return (
    <div className="form-editor-right-panel__field">
      <span className="form-editor-right-panel__label">타이틀 번호</span>
      <CmsSelect
        width="100%"
        className="form-editor-right-panel__select"
        value={value}
        options={TITLE_NUMBERING_OPTIONS}
        withAllOption={false}
        onChange={v => onChange(v as FormTitleNumberingStyle)}
      />
    </div>
  )
}

export function FormEditorRightPanel({
  draft,
  activeParagraphId,
  onTitleNumberingChange,
  updateParagraph,
  editorKind: _editorKind = 'survey',
  showTitleNumbering = true,
  singleItemListActiveItemId,
  horizontalTableRowSelection = null,
  onHorizontalTableBodyRowDeleted,
  verticalTableBodyRowSelection = null,
  onVerticalTableBodyRowDeleted,
  structureLockedParagraphIds,
}: FormEditorRightPanelProps) {
  const { active, structureLockedActive, outline, activeKindValue, activeDetailValue, activeKindLocked } =
    useActiveParagraphState({ draft, activeParagraphId, structureLockedParagraphIds })

  const { handleKindChange, handleDetailChange } = useParagraphConversion({
    active,
    activeKindLocked,
    activeKindValue,
    updateParagraph,
  })

  const { activeShortEssay, selectedShortEssayItem, shortEssayShowItemTitle } =
    useShortEssayEditorState({ active, singleItemListActiveItemId })

  if (active != null && structureLockedActive) {
    return (
      <div className="form-editor-right-panel">
        {showTitleNumbering ? (
          <FormEditorTitleNumberingField
            value={draft.formSettings.titleNumbering}
            onChange={onTitleNumberingChange}
          />
        ) : null}
        <StructureLockedParagraphSection paragraph={active} />
      </div>
    )
  }

  return (
    <div className="form-editor-right-panel">
      {showTitleNumbering ? (
        <FormEditorTitleNumberingField
          value={draft.formSettings.titleNumbering}
          onChange={onTitleNumberingChange}
        />
      ) : null}

      {active ? (
        <>
          <ParagraphMetaSection
            active={active}
            outline={outline}
            activeKindValue={activeKindValue}
            activeDetailValue={activeDetailValue}
            activeKindLocked={activeKindLocked}
            onKindChange={handleKindChange}
            onDetailChange={handleDetailChange}
          />

          <ParagraphCustomFieldsFormShell active={active}>
            <ParagraphSettingsSection active={active} updateParagraph={updateParagraph} />
            <ParagraphCustomFieldsSection
              active={active}
              updateParagraph={updateParagraph}
              singleItemListActiveItemId={singleItemListActiveItemId}
              horizontalTableRowSelection={horizontalTableRowSelection}
              onHorizontalTableBodyRowDeleted={onHorizontalTableBodyRowDeleted}
              verticalTableBodyRowSelection={verticalTableBodyRowSelection}
              onVerticalTableBodyRowDeleted={onVerticalTableBodyRowDeleted}
              shortEssayShowItemTitle={shortEssayShowItemTitle}
              activeShortEssay={activeShortEssay}
              selectedShortEssayItem={selectedShortEssayItem}
            />
          </ParagraphCustomFieldsFormShell>
        </>
      ) : null}
    </div>
  )
}
