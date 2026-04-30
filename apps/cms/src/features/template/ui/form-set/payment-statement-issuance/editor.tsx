import type { PaymentStatementIssuanceEditorViewModel } from '@/features/template/hooks/use-payment-statement-issuance-editor'
import { FormEditorFieldNav } from '@/features/template/ui/form-editor/form-editor-field-nav'
import { FormEditorLeftPane } from '@/features/template/ui/form-editor/form-editor-left-pane'
import {
  FormEditorRightPanel,
  FormEditorTitleNumberingField,
} from '@/features/template/ui/form-editor/form-editor-right-panel'
import {
  PAYMENT_STATEMENT_ISSUANCE_HIDDEN_DRAG_HANDLE_IDS,
  PAYMENT_STATEMENT_ISSUANCE_PARAGRAPH_BODY_OPTIONS,
} from '@/features/template/ui/form-set/payment-statement-issuance/paragraph-config'
import './editor.css'

export function PaymentStatementIssuanceEditorLeftColumn({
  vm,
}: {
  vm: PaymentStatementIssuanceEditorViewModel
}) {
  return (
    <div className="payment-statement-issuance-editor">
      <FormEditorLeftPane
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
        hideDragHandleForParagraphIds={PAYMENT_STATEMENT_ISSUANCE_HIDDEN_DRAG_HANDLE_IDS}
        paragraphBodyOptions={PAYMENT_STATEMENT_ISSUANCE_PARAGRAPH_BODY_OPTIONS}
        hideParagraphRequiredChrome
        headingDescriptionExtraClassName="paragraph-input-explanation-title"
      />
    </div>
  )
}

export function PaymentStatementIssuanceEditorRightColumn({
  vm,
}: {
  vm: PaymentStatementIssuanceEditorViewModel
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
