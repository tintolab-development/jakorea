import { useMemo } from 'react'
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import {
  getWritingFormHeadMiddlePinnedTail,
  isAgreementLockedSystemParagraph,
  paragraphsAreOnlyTableLayoutParagraphs,
} from '@/features/template/model/writing-form-draft.schema'
import {
  renderFormParagraphBody,
  type RenderFormParagraphBodyOptions,
} from '@/features/template/ui/paragraph/renderers/render-form-paragraph-body'
import { restrictFormEditorListToVerticalAxis } from '@/features/template/ui/form-editor/dnd-restrict-vertical-axis'
import {
  PinnedFormCard,
  SortableMiddleFormCard,
} from '@/features/template/ui/form-editor/left-panel/form-editor-left-panel-cards'
import type { FormEditorLeftPanelProps } from '@/features/template/ui/form-editor/left-panel/form-editor-left-panel.types'
import { AgreementSheetClosingFooter } from '@/features/template/ui/paragraph/explanation/agreement-sheet-closing-footer'
import '../form-editor.css'

export type { FormEditorLeftPanelLayout, FormEditorLeftPanelProps } from '@/features/template/ui/form-editor/left-panel/form-editor-left-panel.types'

export function FormEditorLeftPanel({
  paragraphs,
  titleNumbering,
  selectedCardId,
  onSelectCard,
  onReorderMiddle,
  updateParagraph,
  editorKind = 'survey',
  singleItemListActiveItemId,
  onSelectSingleItemListItem,
  layout = 'five',
  horizontalTableRowSelectionsByParagraphId,
  onHorizontalTableRowSelectionChange,
  verticalTableBodyRowSelection,
  onVerticalTableBodyRowSelectionChange,
  middleParagraphActions,
  paragraphBodyOptions,
  paragraphInteractionMode = 'authoring',
  showEditorChrome = true,
  structureLockedParagraphIds,
  hideDragHandleForParagraphIds,
  hideParagraphRequiredChrome,
  headingDescriptionExtraClassName,
  agreementClosingFooter,
}: FormEditorLeftPanelProps) {
  const closingFooter =
    editorKind === 'agreement' ? (
      <AgreementSheetClosingFooter
        onSubmit={agreementClosingFooter?.onSubmit}
        submitDisabled={agreementClosingFooter?.submitDisabled}
        showSubmitButton={agreementClosingFooter?.showSubmitButton ?? true}
      />
    ) : null
  const mergedParagraphBodyOptions: RenderFormParagraphBodyOptions = {
    ...paragraphBodyOptions,
    paragraphInteractionMode,
    structureLockedParagraphIds:
      paragraphBodyOptions?.structureLockedParagraphIds ?? structureLockedParagraphIds,
  }

  const hiddenParagraphIds = mergedParagraphBodyOptions.hiddenParagraphIds
  const displayParagraphs = useMemo(() => {
    if (hiddenParagraphIds == null || hiddenParagraphIds.size === 0) return paragraphs
    return paragraphs.filter(paragraph => !hiddenParagraphIds.has(paragraph.id))
  }, [paragraphs, hiddenParagraphIds])

  const formEditorLeftClassName = [
    'form-editor-left',
    paragraphInteractionMode === 'preview' && 'form-editor-left--paragraph-body-preview',
  ]
    .filter(Boolean)
    .join(' ')

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 2 } }))

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (over == null || active.id === over.id) return
    onReorderMiddle(String(active.id), String(over.id))
  }

  if (layout === 'three') {
    if (
      editorKind === 'horizontal_table' &&
      paragraphsAreOnlyTableLayoutParagraphs(displayParagraphs)
    ) {
      const middle = displayParagraphs
      const sortableIds = middle.map(p => p.id)
      if (middle.length < 1) return null
      return (
        <div className={formEditorLeftClassName}>
          {showEditorChrome ? (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              modifiers={[restrictFormEditorListToVerticalAxis]}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
                {middle.map(p => (
                  <SortableMiddleFormCard
                    key={p.id}
                    paragraph={p}
                    paragraphs={displayParagraphs}
                    titleNumbering={titleNumbering}
                    selectedCardId={selectedCardId}
                    onSelectCard={onSelectCard}
                    updateParagraph={updateParagraph}
                    editorKind={editorKind}
                    singleItemListActiveItemId={singleItemListActiveItemId}
                    onSelectSingleItemListItem={onSelectSingleItemListItem}
                    horizontalTableRowSelectionsByParagraphId={
                      horizontalTableRowSelectionsByParagraphId
                    }
                    onHorizontalTableRowSelectionChange={onHorizontalTableRowSelectionChange}
                    verticalTableBodyRowSelection={verticalTableBodyRowSelection}
                    onVerticalTableBodyRowSelectionChange={onVerticalTableBodyRowSelectionChange}
                    middleParagraphActions={middleParagraphActions}
                    paragraphBodyOptions={mergedParagraphBodyOptions}
                    structureLockedParagraphIds={structureLockedParagraphIds}
                    hideDragHandleForParagraphIds={hideDragHandleForParagraphIds}
                    hideParagraphRequiredChrome={hideParagraphRequiredChrome}
                    headingDescriptionExtraClassName={headingDescriptionExtraClassName}
                    showEditorChrome={showEditorChrome}
                  />
                ))}
              </SortableContext>
            </DndContext>
          ) : (
            middle.map(p => (
              <PinnedFormCard
                key={p.id}
                paragraph={p}
                paragraphs={displayParagraphs}
                titleNumbering={titleNumbering}
                selectedCardId={selectedCardId}
                onSelectCard={onSelectCard}
                updateParagraph={updateParagraph}
                editorKind={editorKind}
                singleItemListActiveItemId={singleItemListActiveItemId}
                onSelectSingleItemListItem={onSelectSingleItemListItem}
                horizontalTableRowSelectionsByParagraphId={
                  horizontalTableRowSelectionsByParagraphId
                }
                onHorizontalTableRowSelectionChange={onHorizontalTableRowSelectionChange}
                verticalTableBodyRowSelection={verticalTableBodyRowSelection}
                onVerticalTableBodyRowSelectionChange={onVerticalTableBodyRowSelectionChange}
                middleParagraphActions={middleParagraphActions}
                paragraphBodyOptions={mergedParagraphBodyOptions}
                structureLockedParagraphIds={structureLockedParagraphIds}
                hideDragHandleForParagraphIds={hideDragHandleForParagraphIds}
                hideParagraphRequiredChrome={hideParagraphRequiredChrome}
                headingDescriptionExtraClassName={headingDescriptionExtraClassName}
                showEditorChrome={false}
              />
            ))
          )}
        </div>
      )
    }

    const tail = displayParagraphs[displayParagraphs.length - 1]
    const middle = displayParagraphs.slice(0, -1)
    const sortableIds = middle.map(p => p.id)
    if (!tail || middle.length < 1) return null

    return (
      <div className={formEditorLeftClassName}>
        {showEditorChrome ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            modifiers={[restrictFormEditorListToVerticalAxis]}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
              {middle.map(p => (
                <SortableMiddleFormCard
                  key={p.id}
                  paragraph={p}
                  paragraphs={displayParagraphs}
                  titleNumbering={titleNumbering}
                  selectedCardId={selectedCardId}
                  onSelectCard={onSelectCard}
                  updateParagraph={updateParagraph}
                  editorKind={editorKind}
                  singleItemListActiveItemId={singleItemListActiveItemId}
                  onSelectSingleItemListItem={onSelectSingleItemListItem}
                  horizontalTableRowSelectionsByParagraphId={
                    horizontalTableRowSelectionsByParagraphId
                  }
                  onHorizontalTableRowSelectionChange={onHorizontalTableRowSelectionChange}
                  verticalTableBodyRowSelection={verticalTableBodyRowSelection}
                  onVerticalTableBodyRowSelectionChange={onVerticalTableBodyRowSelectionChange}
                  middleParagraphActions={middleParagraphActions}
                  paragraphBodyOptions={mergedParagraphBodyOptions}
                  structureLockedParagraphIds={structureLockedParagraphIds}
                  hideDragHandleForParagraphIds={hideDragHandleForParagraphIds}
                  hideParagraphRequiredChrome={hideParagraphRequiredChrome}
                  headingDescriptionExtraClassName={headingDescriptionExtraClassName}
                  showEditorChrome={showEditorChrome}
                />
              ))}
            </SortableContext>
          </DndContext>
        ) : (
          middle.map(p => (
            <PinnedFormCard
              key={p.id}
              paragraph={p}
              paragraphs={displayParagraphs}
              titleNumbering={titleNumbering}
              selectedCardId={selectedCardId}
              onSelectCard={onSelectCard}
              updateParagraph={updateParagraph}
              editorKind={editorKind}
              singleItemListActiveItemId={singleItemListActiveItemId}
              onSelectSingleItemListItem={onSelectSingleItemListItem}
              horizontalTableRowSelectionsByParagraphId={horizontalTableRowSelectionsByParagraphId}
              onHorizontalTableRowSelectionChange={onHorizontalTableRowSelectionChange}
              verticalTableBodyRowSelection={verticalTableBodyRowSelection}
              onVerticalTableBodyRowSelectionChange={onVerticalTableBodyRowSelectionChange}
              middleParagraphActions={middleParagraphActions}
              paragraphBodyOptions={mergedParagraphBodyOptions}
              structureLockedParagraphIds={structureLockedParagraphIds}
              hideDragHandleForParagraphIds={hideDragHandleForParagraphIds}
              hideParagraphRequiredChrome={hideParagraphRequiredChrome}
              headingDescriptionExtraClassName={headingDescriptionExtraClassName}
              showEditorChrome={false}
            />
          ))
        )}
        <PinnedFormCard
          paragraph={tail}
          paragraphs={displayParagraphs}
          titleNumbering={titleNumbering}
          selectedCardId={selectedCardId}
          onSelectCard={onSelectCard}
          updateParagraph={updateParagraph}
          editorKind={editorKind}
          singleItemListActiveItemId={singleItemListActiveItemId}
          onSelectSingleItemListItem={onSelectSingleItemListItem}
          horizontalTableRowSelectionsByParagraphId={horizontalTableRowSelectionsByParagraphId}
          onHorizontalTableRowSelectionChange={onHorizontalTableRowSelectionChange}
          verticalTableBodyRowSelection={verticalTableBodyRowSelection}
          onVerticalTableBodyRowSelectionChange={onVerticalTableBodyRowSelectionChange}
          middleParagraphActions={middleParagraphActions}
          paragraphBodyOptions={mergedParagraphBodyOptions}
          structureLockedParagraphIds={structureLockedParagraphIds}
          hideDragHandleForParagraphIds={hideDragHandleForParagraphIds}
          hideParagraphRequiredChrome={hideParagraphRequiredChrome}
          headingDescriptionExtraClassName={headingDescriptionExtraClassName}
          showEditorChrome={showEditorChrome}
        />
      </div>
    )
  }

  const split = getWritingFormHeadMiddlePinnedTail(displayParagraphs)
  if (split == null) return null
  const { head, middle, pinnedTail } = split
  const pinnedSystemRows = pinnedTail.filter(isAgreementLockedSystemParagraph)
  const pinnedCardTail = pinnedTail.filter(p => !isAgreementLockedSystemParagraph(p))
  const sortableIds = middle.map(p => p.id)

  if (middle.length < 1) return null

  return (
    <div className={formEditorLeftClassName}>
      <PinnedFormCard
        paragraph={head}
        paragraphs={displayParagraphs}
        titleNumbering={titleNumbering}
        selectedCardId={selectedCardId}
        onSelectCard={onSelectCard}
        updateParagraph={updateParagraph}
        editorKind={editorKind}
        singleItemListActiveItemId={singleItemListActiveItemId}
        onSelectSingleItemListItem={onSelectSingleItemListItem}
        horizontalTableRowSelectionsByParagraphId={horizontalTableRowSelectionsByParagraphId}
        onHorizontalTableRowSelectionChange={onHorizontalTableRowSelectionChange}
        verticalTableBodyRowSelection={verticalTableBodyRowSelection}
        onVerticalTableBodyRowSelectionChange={onVerticalTableBodyRowSelectionChange}
        middleParagraphActions={middleParagraphActions}
        paragraphBodyOptions={mergedParagraphBodyOptions}
        structureLockedParagraphIds={structureLockedParagraphIds}
        hideDragHandleForParagraphIds={hideDragHandleForParagraphIds}
        hideParagraphRequiredChrome={hideParagraphRequiredChrome}
        headingDescriptionExtraClassName={headingDescriptionExtraClassName}
        showEditorChrome={showEditorChrome}
      />
      {showEditorChrome ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          modifiers={[restrictFormEditorListToVerticalAxis]}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
            {middle.map(p => (
              <SortableMiddleFormCard
                key={p.id}
                paragraph={p}
                paragraphs={displayParagraphs}
                titleNumbering={titleNumbering}
                selectedCardId={selectedCardId}
                onSelectCard={onSelectCard}
                updateParagraph={updateParagraph}
                editorKind={editorKind}
                singleItemListActiveItemId={singleItemListActiveItemId}
                onSelectSingleItemListItem={onSelectSingleItemListItem}
                horizontalTableRowSelectionsByParagraphId={
                  horizontalTableRowSelectionsByParagraphId
                }
                onHorizontalTableRowSelectionChange={onHorizontalTableRowSelectionChange}
                verticalTableBodyRowSelection={verticalTableBodyRowSelection}
                onVerticalTableBodyRowSelectionChange={onVerticalTableBodyRowSelectionChange}
                middleParagraphActions={middleParagraphActions}
                paragraphBodyOptions={mergedParagraphBodyOptions}
                structureLockedParagraphIds={structureLockedParagraphIds}
                hideDragHandleForParagraphIds={hideDragHandleForParagraphIds}
                hideParagraphRequiredChrome={hideParagraphRequiredChrome}
                headingDescriptionExtraClassName={headingDescriptionExtraClassName}
                showEditorChrome={showEditorChrome}
              />
            ))}
          </SortableContext>
        </DndContext>
      ) : (
        middle.map(p => (
          <PinnedFormCard
            key={p.id}
            paragraph={p}
            paragraphs={displayParagraphs}
            titleNumbering={titleNumbering}
            selectedCardId={selectedCardId}
            onSelectCard={onSelectCard}
            updateParagraph={updateParagraph}
            editorKind={editorKind}
            singleItemListActiveItemId={singleItemListActiveItemId}
            onSelectSingleItemListItem={onSelectSingleItemListItem}
            horizontalTableRowSelectionsByParagraphId={horizontalTableRowSelectionsByParagraphId}
            onHorizontalTableRowSelectionChange={onHorizontalTableRowSelectionChange}
            verticalTableBodyRowSelection={verticalTableBodyRowSelection}
            onVerticalTableBodyRowSelectionChange={onVerticalTableBodyRowSelectionChange}
            middleParagraphActions={middleParagraphActions}
            paragraphBodyOptions={mergedParagraphBodyOptions}
            structureLockedParagraphIds={structureLockedParagraphIds}
            hideDragHandleForParagraphIds={hideDragHandleForParagraphIds}
            hideParagraphRequiredChrome={hideParagraphRequiredChrome}
            headingDescriptionExtraClassName={headingDescriptionExtraClassName}
            showEditorChrome={false}
          />
        ))
      )}
      {pinnedCardTail.map(p => (
        <PinnedFormCard
          key={p.id}
          paragraph={p}
          paragraphs={displayParagraphs}
          titleNumbering={titleNumbering}
          selectedCardId={selectedCardId}
          onSelectCard={onSelectCard}
          updateParagraph={updateParagraph}
          editorKind={editorKind}
          singleItemListActiveItemId={singleItemListActiveItemId}
          onSelectSingleItemListItem={onSelectSingleItemListItem}
          horizontalTableRowSelectionsByParagraphId={horizontalTableRowSelectionsByParagraphId}
          onHorizontalTableRowSelectionChange={onHorizontalTableRowSelectionChange}
          verticalTableBodyRowSelection={verticalTableBodyRowSelection}
          onVerticalTableBodyRowSelectionChange={onVerticalTableBodyRowSelectionChange}
          middleParagraphActions={middleParagraphActions}
          paragraphBodyOptions={mergedParagraphBodyOptions}
          structureLockedParagraphIds={structureLockedParagraphIds}
          hideDragHandleForParagraphIds={hideDragHandleForParagraphIds}
          hideParagraphRequiredChrome={hideParagraphRequiredChrome}
          headingDescriptionExtraClassName={headingDescriptionExtraClassName}
          showEditorChrome={showEditorChrome}
        />
      ))}
      {pinnedSystemRows.length > 0 ? (
        <div className="form-editor-left__system-fixed">
          {pinnedSystemRows.map(p => (
            <div key={p.id} className="form-editor-left__system-fixed-row">
              {renderFormParagraphBody(
                p,
                updateParagraph,
                false,
                editorKind,
                mergedParagraphBodyOptions
              )}
            </div>
          ))}
        </div>
      ) : null}
      {closingFooter}
    </div>
  )
}
