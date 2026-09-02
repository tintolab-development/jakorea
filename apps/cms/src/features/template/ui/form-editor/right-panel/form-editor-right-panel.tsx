import type { FormTitleNumberingStyle } from '@/features/template/model/writing-form-draft.schema'
import { CmsSelect } from '@/shared/ui/cms-select'
import { ParagraphCustomFieldsFormShell, ParagraphCustomFieldsSection } from '@/features/template/ui/form-editor/right-panel/sections/paragraph-custom-fields-section'
import { ParagraphMetaSection } from '@/features/template/ui/form-editor/right-panel/sections/paragraph-meta-section'
import { ParagraphSettingsSection } from '@/features/template/ui/form-editor/right-panel/sections/paragraph-settings-section'
import { StructureLockedParagraphSection } from '@/features/template/ui/form-editor/right-panel/sections/structure-locked-section'
import { isTitleWithPeriodParagraph } from '@/features/template/lib/title-with-period-settings'
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
  hideParagraphKindOutline: hideParagraphKindOutlineProp,
}: FormEditorRightPanelProps) {
  const { active, structureLockedActive, outline, activeKindValue, activeDetailValue, activeKindLocked } =
    useActiveParagraphState({ draft, activeParagraphId, structureLockedParagraphIds })

  /** 사용자 추가 단락: 유형 셀렉트 노출 / 시드·관리자 고정: 기본은 잠금 안내·설정 노출 */
  const hideParagraphKindOutline = hideParagraphKindOutlineProp === true

  const { handleKindChange, handleDetailChange } = useParagraphConversion({
    active,
    activeKindLocked,
    activeKindValue,
    updateParagraph,
  })

  const { activeShortEssay, selectedShortEssayItem, shortEssayShowItemTitle } =
    useShortEssayEditorState({ active, singleItemListActiveItemId })

  if (active != null && structureLockedActive) {
    const titleWithPeriodLocked = isTitleWithPeriodParagraph(active)
    return (
      <div className="form-editor-right-panel">
        {showTitleNumbering ? (
          <FormEditorTitleNumberingField
            value={draft.formSettings.titleNumbering}
            onChange={onTitleNumberingChange}
          />
        ) : null}
        {/* 시드·고정 단락: 유형 셀렉트 숨김. 명시적으로 노출할 때만 StructureLocked 안내 */}
        {hideParagraphKindOutline ? null : (
          <StructureLockedParagraphSection paragraph={active} />
        )}
        {titleWithPeriodLocked ? (
          <ParagraphCustomFieldsFormShell
            active={active}
            className="form-editor-right-panel__form-items--after-structure-locked"
          >
            <ParagraphSettingsSection active={active} updateParagraph={updateParagraph} />
          </ParagraphCustomFieldsFormShell>
        ) : null}
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
          {hideParagraphKindOutline ? null : (
            <ParagraphMetaSection
              active={active}
              outline={outline}
              activeKindValue={activeKindValue}
              activeDetailValue={activeDetailValue}
              activeKindLocked={activeKindLocked}
              onKindChange={handleKindChange}
              onDetailChange={handleDetailChange}
            />
          )}

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
