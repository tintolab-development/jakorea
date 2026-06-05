import type { PaymentStatementPreConsentEditorViewModel } from '@/features/template/hooks/use-payment-statement-pre-consent-editor'
import { FormEditorFieldNav } from '@/features/template/ui/form-editor/left-panel/form-editor-field-nav'
import { FormEditorLeftPanel } from '@/features/template/ui/form-editor/left-panel/form-editor-left-panel'
import {
  FormEditorRightPanel,
  FormEditorTitleNumberingField,
} from '@/features/template/ui/form-editor/right-panel/form-editor-right-panel'
import {
  PAYMENT_STATEMENT_PRE_CONSENT_HIDDEN_DRAG_HANDLE_IDS,
  PAYMENT_STATEMENT_PRE_CONSENT_PARAGRAPH_BODY_OPTIONS,
} from '@/features/template/ui/form-set/payment-statement-pre-consent/paragraph-config'
import '@/features/template/ui/form-set/payment-statement-issuance/editor.css'

export function PaymentStatementPreConsentEditorLeftColumn({
  vm,
}: {
  vm: PaymentStatementPreConsentEditorViewModel
}) {
  return (
    <FormEditorLeftPanel
      paragraphs={vm.draft.paragraphs}
      titleNumbering={vm.draft.formSettings.titleNumbering}
      selectedCardId={vm.activeParagraphId}
      onSelectCard={vm.handleSelectCard}
      onReorderMiddle={vm.onReorderMiddle}
      updateParagraph={vm.updateParagraph}
      editorKind="agreement"
      layout="five"
      horizontalTableRowSelectionsByParagraphId={vm.horizontalTableRowSelectionsByParagraphId}
      onHorizontalTableRowSelectionChange={vm.onHorizontalTableRowSelectionChange}
      verticalTableBodyRowSelection={vm.verticalTableBodyRowSelection}
      onVerticalTableBodyRowSelectionChange={vm.onVerticalTableBodyRowSelectionChange}
      middleParagraphActions={vm.middleParagraphActions}
      singleItemListActiveItemId={vm.singleItemListActiveItemId}
      onSelectSingleItemListItem={vm.onSelectSingleItemListItem}
      structureLockedParagraphIds={vm.structureLockedParagraphIds}
      hideDragHandleForParagraphIds={PAYMENT_STATEMENT_PRE_CONSENT_HIDDEN_DRAG_HANDLE_IDS}
      paragraphBodyOptions={PAYMENT_STATEMENT_PRE_CONSENT_PARAGRAPH_BODY_OPTIONS}
      hideParagraphRequiredChrome
      headingDescriptionExtraClassName="paragraph-input-explanation-title"
    />
  )
}

export function PaymentStatementPreConsentEditorRightColumn({
  vm,
}: {
  vm: PaymentStatementPreConsentEditorViewModel
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
        editorKind="agreement"
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
