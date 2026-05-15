import type { ProgramParticipantApplicationEditorViewModel } from '@/features/template/hooks/use-program-participant-application-editor'
import { FormEditorFieldNav } from '@/features/template/ui/form-editor/left-panel/form-editor-field-nav'
import { FormEditorLeftPanel } from '@/features/template/ui/form-editor/left-panel/form-editor-left-panel'
import {
  FormEditorRightPanel,
  FormEditorTitleNumberingField,
} from '@/features/template/ui/form-editor/right-panel/form-editor-right-panel'
import '@/features/template/ui/form-set/application-form/instructor/program-application-form-instructor.css'

/** 프로그램 봉사자 신청 폼 전용 편집 UI */
export function ProgramApplicationFormVolunteerEditorLeftColumn({
  vm,
}: {
  vm: ProgramParticipantApplicationEditorViewModel
}) {
  return (
    <div className="program-application-form-volunteer program-application-form-volunteer--editor-left">
      <FormEditorLeftPanel
        paragraphs={vm.draft.paragraphs}
        titleNumbering={vm.draft.formSettings.titleNumbering}
        selectedCardId={vm.activeParagraphId}
        onSelectCard={vm.handleSelectCard}
        onReorderMiddle={vm.onReorderMiddle}
        updateParagraph={vm.updateParagraph}
        editorKind="horizontal_table"
        layout="five"
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
          programApplicationFormVolunteer: vm.programApplicationFormVolunteerOptions,
        }}
        headingDescriptionExtraClassName="paragraph-input-explanation-title"
      />
    </div>
  )
}

export function ProgramApplicationFormVolunteerEditorRightColumn({
  vm,
}: {
  vm: ProgramParticipantApplicationEditorViewModel
}) {
  return (
    <div className="program-application-form-volunteer program-application-form-volunteer--editor-right">
      <FormEditorFieldNav
        sectionTitle="커스텀 필드"
        pinnedTop={vm.pinnedTop}
        sortableMiddle={vm.sortableMiddle}
        pinnedBottom={vm.pinnedBottom}
        selectedItemId={vm.activeParagraphId}
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
          activeParagraphId={vm.activeParagraphId}
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
    </div>
  )
}
