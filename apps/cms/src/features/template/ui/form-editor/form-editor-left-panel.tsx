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
} from '@/features/template/ui/paragraph/render-form-paragraph-body'
import { restrictFormEditorListToVerticalAxis } from '@/features/template/ui/form-editor/dnd-restrict-vertical-axis'
import {
  PinnedFormCard,
  SortableMiddleFormCard,
} from '@/features/template/ui/form-editor/form-editor-left-panel-cards'
import type { FormEditorLeftPanelProps } from '@/features/template/ui/form-editor/form-editor-left-panel.types'
import './form-editor.css'

export type { FormEditorLeftPanelLayout, FormEditorLeftPanelProps } from '@/features/template/ui/form-editor/form-editor-left-panel.types'

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
}: FormEditorLeftPanelProps) {
  const mergedParagraphBodyOptions: RenderFormParagraphBodyOptions = {
    ...paragraphBodyOptions,
    paragraphInteractionMode,
    structureLockedParagraphIds:
      paragraphBodyOptions?.structureLockedParagraphIds ?? structureLockedParagraphIds,
  }

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 2 } }))

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (over == null || active.id === over.id) return
    onReorderMiddle(String(active.id), String(over.id))
  }

  if (layout === 'three') {
    if (editorKind === 'horizontal_table' && paragraphsAreOnlyTableLayoutParagraphs(paragraphs)) {
      const middle = paragraphs
      const sortableIds = middle.map(p => p.id)
      if (middle.length < 1) return null
      return (
        <div className="form-editor-left">
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
                    paragraphs={paragraphs}
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
                paragraphs={paragraphs}
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

    const tail = paragraphs[paragraphs.length - 1]
    const middle = paragraphs.slice(0, -1)
    const sortableIds = middle.map(p => p.id)
    if (!tail || middle.length < 1) return null

    return (
      <div className="form-editor-left">
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
                  paragraphs={paragraphs}
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
              paragraphs={paragraphs}
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
          paragraphs={paragraphs}
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

  const split = getWritingFormHeadMiddlePinnedTail(paragraphs)
  if (split == null) return null
  const { head, middle, pinnedTail } = split
  const sortableIds = middle.map(p => p.id)

  if (middle.length < 1) return null

  return (
    <div className="form-editor-left">
      <PinnedFormCard
        paragraph={head}
        paragraphs={paragraphs}
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
                paragraphs={paragraphs}
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
            paragraphs={paragraphs}
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
      {pinnedTail.map(p =>
        isAgreementLockedSystemParagraph(p) ? (
          <div key={p.id} className="form-editor-left__system-fixed-row">
            {renderFormParagraphBody(p, updateParagraph, false, editorKind, mergedParagraphBodyOptions)}
          </div>
        ) : (
          <PinnedFormCard
            key={p.id}
            paragraph={p}
            paragraphs={paragraphs}
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
        )
      )}
    </div>
  )
}
