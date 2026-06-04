import type { ProgramParticipantApplicationEditorViewModel } from '@/features/template/hooks/use-program-participant-application-editor'
import { UJAT_PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS } from '@/features/template/model/ujat-program-application-form-volunteer-draft'
import { FormEditorFieldNav } from '@/features/template/ui/form-editor/left-panel/form-editor-field-nav'
import { FormEditorLeftPanel } from '@/features/template/ui/form-editor/left-panel/form-editor-left-panel'
import {
  FormEditorRightPanel,
  FormEditorTitleNumberingField,
} from '@/features/template/ui/form-editor/right-panel/form-editor-right-panel'

/** UJAT 프로그램 봉사자 신청 폼 전용 편집 UI */
export function UjatProgramApplicationFormVolunteerEditorLeftColumn({
  vm,
}: {
  vm: ProgramParticipantApplicationEditorViewModel
}) {
  const hidePreviousTerm = vm.ujatVolunteerApplicationType === 'new'
  const visibleParagraphs = hidePreviousTerm
    ? vm.draft.paragraphs.filter(
        p => p.id !== UJAT_PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS.previousTerm
      )
    : vm.draft.paragraphs
  const selectedCardId =
    hidePreviousTerm &&
    vm.activeParagraphId === UJAT_PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS.previousTerm
      ? UJAT_PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS.basicInfo
      : vm.activeParagraphId

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
      paragraphBodyOptions={{
        structureLockedParagraphIds: vm.structureLockedParagraphIds,
        structureLockedAuthoringChoicePreview: true,
        hiddenParagraphIds: hidePreviousTerm
          ? new Set([UJAT_PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS.previousTerm])
          : undefined,
        ujatProgramApplicationFormVolunteer: {
          enabled: true,
          applicationType: vm.ujatVolunteerApplicationType,
          onApplicationTypeChange: vm.setUjatVolunteerApplicationType,
        },
      }}
      headingDescriptionExtraClassName="paragraph-input-explanation-title"
    />
  )
}

export function UjatProgramApplicationFormVolunteerEditorRightColumn({
  vm,
}: {
  vm: ProgramParticipantApplicationEditorViewModel
}) {
  const hidePreviousTerm = vm.ujatVolunteerApplicationType === 'new'
  const selectedItemId =
    hidePreviousTerm &&
    vm.activeParagraphId === UJAT_PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS.previousTerm
      ? UJAT_PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS.basicInfo
      : vm.activeParagraphId
  const sortableMiddle = hidePreviousTerm
    ? vm.sortableMiddle.filter(
        item => item.id !== UJAT_PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS.previousTerm
      )
    : vm.sortableMiddle

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
