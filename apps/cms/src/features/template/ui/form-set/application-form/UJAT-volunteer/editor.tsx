import type { ProgramParticipantApplicationEditorViewModel } from '@/features/template/hooks/use-program-participant-application-editor'
import { resolveUjatVolunteerHiddenParagraphIds } from '@/features/template/lib/ujat-volunteer-application-form-visibility'
import { UJAT_PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS } from '@/features/template/model/ujat-program-application-form-volunteer-draft'
import { FormEditorFieldNav } from '@/features/template/ui/form-editor/left-panel/form-editor-field-nav'
import { FormEditorLeftPanel } from '@/features/template/ui/form-editor/left-panel/form-editor-left-panel'
import {
  FormEditorRightPanel,
  FormEditorTitleNumberingField,
} from '@/features/template/ui/form-editor/right-panel/form-editor-right-panel'

function filterUjatVolunteerParagraphs<T extends { id: string }>(
  paragraphs: readonly T[],
  vm: ProgramParticipantApplicationEditorViewModel
): T[] {
  const hidden = resolveUjatVolunteerHiddenParagraphIds(vm.ujatVolunteerApplicationType, {
    isTemplateAuthoringMode:
      vm.leftPanelParagraphBodyOptions?.ujatProgramApplicationFormVolunteer
        ?.isTemplateAuthoringMode,
  })
  if (hidden == null) return [...paragraphs]
  return paragraphs.filter(p => !hidden.has(p.id))
}

function resolveUjatVolunteerSelectedParagraphId(
  activeParagraphId: string | null,
  vm: ProgramParticipantApplicationEditorViewModel
): string | null {
  const hidden = resolveUjatVolunteerHiddenParagraphIds(vm.ujatVolunteerApplicationType, {
    isTemplateAuthoringMode:
      vm.leftPanelParagraphBodyOptions?.ujatProgramApplicationFormVolunteer
        ?.isTemplateAuthoringMode,
  })
  if (activeParagraphId != null && hidden?.has(activeParagraphId)) {
    return UJAT_PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS.basicInfo
  }
  return activeParagraphId
}

/** UJAT 프로그램 봉사자 신청 폼 전용 편집 UI */
export function UjatProgramApplicationFormVolunteerEditorLeftColumn({
  vm,
}: {
  vm: ProgramParticipantApplicationEditorViewModel
}) {
  const visibleParagraphs = filterUjatVolunteerParagraphs(vm.draft.paragraphs, vm)
  const selectedCardId = resolveUjatVolunteerSelectedParagraphId(vm.activeParagraphId, vm)

  return (
    <FormEditorLeftPanel
      paragraphs={visibleParagraphs}
      titleNumbering={vm.draft.formSettings.titleNumbering}
      selectedCardId={selectedCardId}
      onSelectCard={vm.handleSelectCard}
      onReorderMiddle={vm.onReorderMiddle}
      updateParagraph={vm.updateParagraph}
      editorKind="horizontal_table"
      layout="three"
      horizontalTableRowSelectionsByParagraphId={vm.horizontalTableRowSelectionsByParagraphId}
      onHorizontalTableRowSelectionChange={vm.onHorizontalTableRowSelectionChange}
      verticalTableBodyRowSelection={vm.verticalTableBodyRowSelection}
      onVerticalTableBodyRowSelectionChange={vm.onVerticalTableBodyRowSelectionChange}
      middleParagraphActions={vm.middleParagraphActions}
      singleItemListActiveItemId={vm.singleItemListActiveItemId}
      onSelectSingleItemListItem={vm.onSelectSingleItemListItem}
      structureLockedParagraphIds={vm.structureLockedParagraphIds}
      paragraphBodyOptions={vm.leftPanelParagraphBodyOptions}
      headingDescriptionExtraClassName="paragraph-input-explanation-title"
    />
  )
}

export function UjatProgramApplicationFormVolunteerEditorRightColumn({
  vm,
}: {
  vm: ProgramParticipantApplicationEditorViewModel
}) {
  const selectedItemId = resolveUjatVolunteerSelectedParagraphId(vm.activeParagraphId, vm)
  const sortableMiddle = filterUjatVolunteerParagraphs(vm.sortableMiddle, vm)

  return (
    <FormEditorFieldNav
      sectionTitle="커스텀 필드"
      pinnedTop={vm.pinnedTop}
      sortableMiddle={sortableMiddle}
      pinnedBottom={vm.pinnedBottom}
      selectedItemId={selectedItemId}
      onSelectItem={vm.handleSelectCard}
      onReorderMiddle={vm.onReorderMiddle}
      fieldListBottomSlot={
        <FormEditorTitleNumberingField
          value={vm.draft.formSettings.titleNumbering}
          onChange={vm.onTitleNumberingChange}
        />
      }
    >
      <FormEditorRightPanel
        draft={vm.draft}
        activeParagraphId={selectedItemId}
        onTitleNumberingChange={vm.onTitleNumberingChange}
        updateParagraph={vm.updateParagraph}
        editorKind="horizontal_table"
        showTitleNumbering={false}
        singleItemListActiveItemId={vm.singleItemListActiveItemId}
        horizontalTableRowSelection={vm.activeHorizontalTableRowSelection}
        onHorizontalTableBodyRowDeleted={vm.focusHorizontalTableBodyRow}
        verticalTableBodyRowSelection={vm.verticalTableBodyRowSelection}
        onVerticalTableBodyRowDeleted={vm.focusVerticalTableBodyRow}
        structureLockedParagraphIds={vm.structureLockedParagraphIds}
      />
    </FormEditorFieldNav>
  )
}
