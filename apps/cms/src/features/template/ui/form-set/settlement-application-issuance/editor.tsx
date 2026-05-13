import type { SettlementApplicationIssuanceEditorViewModel } from '@/features/template/hooks/use-settlement-application-issuance-editor'
import { FormEditorFieldNav } from '@/features/template/ui/form-editor/left-panel/form-editor-field-nav'
import { FormEditorLeftPanel } from '@/features/template/ui/form-editor/left-panel/form-editor-left-panel'
import {
  FormEditorRightPanel,
  FormEditorTitleNumberingField,
} from '@/features/template/ui/form-editor/right-panel/form-editor-right-panel'
import {
  SETTLEMENT_APPLICATION_ISSUANCE_HIDDEN_DRAG_HANDLE_IDS,
  SETTLEMENT_APPLICATION_ISSUANCE_PARAGRAPH_BODY_OPTIONS,
} from '@/features/template/ui/form-set/settlement-application-issuance/paragraph-config'
import '@/features/template/ui/form-set/payment-statement-issuance/editor.css'

export function SettlementApplicationIssuanceEditorLeftColumn({
  vm,
}: {
  vm: SettlementApplicationIssuanceEditorViewModel
}) {
  return (
    <div className="payment-statement-issuance-editor">
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
        hideDragHandleForParagraphIds={SETTLEMENT_APPLICATION_ISSUANCE_HIDDEN_DRAG_HANDLE_IDS}
        paragraphBodyOptions={SETTLEMENT_APPLICATION_ISSUANCE_PARAGRAPH_BODY_OPTIONS}
        hideParagraphRequiredChrome
        headingDescriptionExtraClassName="paragraph-input-explanation-title"
      />
    </div>
  )
}

export function SettlementApplicationIssuanceEditorRightColumn({
  vm,
}: {
  vm: SettlementApplicationIssuanceEditorViewModel
}) {
  return (
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
  )
}
