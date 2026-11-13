import type { UjatProgramRegistrationEditorViewModel } from '@/features/template/ui/form-set/registration-form/UJAT/use-ujat-program-registration-editor'
import { FormEditorFieldNav } from '@/features/template/ui/form-editor/left-panel/form-editor-field-nav'
import { FormEditorLeftPanel } from '@/features/template/ui/form-editor/left-panel/form-editor-left-panel'
import {
  FormEditorRightPanel,
  FormEditorTitleNumberingField,
} from '@/features/template/ui/form-editor/right-panel/form-editor-right-panel'
import { HideParagraphSelectionChromeContext } from '@/features/template/context/paragraph-selection-chrome-context'
import { useIsTemplateManagementScreen } from '@/features/template/ui/template-management/detail-view-mode-context'

/**
 * 템플릿 관리 등록 폼 — 단락 구조가 고정이라 카드 선택 강조·하단 단락 버튼·드래그 핸들을 숨긴다(2026-11-13 사용자 확인).
 * 프로그램 등록 위저드는 위저드 쪽 Provider 설정을 그대로 따른다.
 */
export function UjatProgramRegistrationEditorLeftColumn({
  vm,
}: {
  vm: UjatProgramRegistrationEditorViewModel
}) {
  const isTemplateManagementScreen = useIsTemplateManagementScreen()
  const panel = (
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
      singleItemListActiveItemId={vm.singleItemListActiveItemId}
      onSelectSingleItemListItem={vm.onSelectSingleItemListItem}
      structureLockedParagraphIds={vm.structureLockedParagraphIds}
      paragraphBodyOptions={vm.paragraphBodyOptions}
      headingDescriptionExtraClassName="paragraph-input-explanation-title"
    />
  )
  if (!isTemplateManagementScreen) return panel
  return (
    <HideParagraphSelectionChromeContext.Provider value>
      {panel}
    </HideParagraphSelectionChromeContext.Provider>
  )
}

export function UjatProgramRegistrationEditorRightColumn({
  vm,
}: {
  vm: UjatProgramRegistrationEditorViewModel
}) {
  // 템플릿 관리 등록 폼 — 타이틀 번호 변경 불가(구조 고정 양식)
  const isTemplateManagementScreen = useIsTemplateManagementScreen()
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
          disabled={isTemplateManagementScreen}
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
        structureLockedTypeSelectPreset="table_system_settings"
      />
    </FormEditorFieldNav>
  )
}
