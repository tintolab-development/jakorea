import { MenuOutlined } from '@ant-design/icons'
import { Form } from 'antd'
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  createDefaultScaleTypeItems,
  type ScaleTypeItem,
  type ScaleTypeParagraph,
  type WritingFormParagraph,
} from '@/features/template/model/writing-form-draft.schema'
import { ItemAddButton } from '@/features/template/ui/paragraph/shared/item-add-button'
import { ItemDeleteButton } from '@/features/template/ui/paragraph/shared/item-delete-button'
import { CmsInput } from '@/shared/ui/cms-input'
import './form-editor.css'

function pruneSelectedAfterRemove(
  paragraph: ScaleTypeParagraph,
  removedId: string
): Pick<ScaleTypeParagraph, 'selectedPreviewItemId'> {
  const sel = paragraph.selectedPreviewItemId
  if (sel !== removedId) return { selectedPreviewItemId: sel }
  const list = paragraph.items?.length ? paragraph.items : createDefaultScaleTypeItems()
  const remaining = list.filter(i => i.id !== removedId)
  return { selectedPreviewItemId: remaining[0]?.id ?? null }
}

function SortableScaleRow({
  item,
  index,
  showDelete,
  onLabelChange,
  onRemove,
}: {
  item: ScaleTypeItem
  index: number
  showDelete: boolean
  onLabelChange: (id: string, label: string) => void
  onRemove: (id: string) => void
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id })

  return (
    <div
      ref={setNodeRef}
      className="form-editor-mc-item"
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.75 : 1,
      }}
    >
      <button
        ref={setActivatorNodeRef}
        type="button"
        className="form-editor-mc-item__drag"
        aria-label={`항목 ${index + 1} 순서 변경`}
        {...attributes}
        {...listeners}
      >
        <MenuOutlined />
      </button>
      <div className="form-editor-mc-item__field-wrap">
        <span className="form-editor-mc-item__index" aria-hidden>{`${index + 1}.`}</span>
        <div className="form-editor-mc-item__field">
          <CmsInput
            width="100%"
            value={item.label}
            onChange={e => onLabelChange(item.id, e.target.value)}
            placeholder="항목 문구"
          />
        </div>
      </div>
      {showDelete ? (
        <ItemDeleteButton
          className="item-delete-button form-editor-mc-item__remove"
          aria-label={`항목 ${index + 1} 삭제`}
          onClick={() => onRemove(item.id)}
        />
      ) : null}
    </div>
  )
}

export function FormEditorScaleTypeItems({
  paragraph,
  updateParagraph,
}: {
  paragraph: ScaleTypeParagraph
  updateParagraph: (id: string, updater: (p: WritingFormParagraph) => WritingFormParagraph) => void
}) {
  const items = paragraph.items?.length ? paragraph.items : createDefaultScaleTypeItems()
  const showDelete = items.length > 2
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 2 } }))

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (over == null || active.id === over.id) return
    updateParagraph(paragraph.id, cur => {
      if (cur.kind !== 'single_item' || cur.variant !== 'scale_type') return cur
      const list = cur.items?.length ? cur.items : createDefaultScaleTypeItems()
      const oldIndex = list.findIndex(i => i.id === String(active.id))
      const newIndex = list.findIndex(i => i.id === String(over.id))
      if (oldIndex < 0 || newIndex < 0) return cur
      return { ...cur, items: arrayMove(list, oldIndex, newIndex) }
    })
  }

  const setLabel = (id: string, label: string) => {
    updateParagraph(paragraph.id, cur => {
      if (cur.kind !== 'single_item' || cur.variant !== 'scale_type') return cur
      const list = cur.items?.length ? cur.items : createDefaultScaleTypeItems()
      return {
        ...cur,
        items: list.map(row => (row.id === id ? { ...row, label } : row)),
      }
    })
  }

  const removeItem = (id: string) => {
    updateParagraph(paragraph.id, cur => {
      if (cur.kind !== 'single_item' || cur.variant !== 'scale_type') return cur
      const list = cur.items?.length ? cur.items : createDefaultScaleTypeItems()
      if (list.length <= 2) return cur
      const nextItems = list.filter(row => row.id !== id)
      return { ...cur, items: nextItems, ...pruneSelectedAfterRemove(cur, id) }
    })
  }

  const addItem = () => {
    updateParagraph(paragraph.id, cur => {
      if (cur.kind !== 'single_item' || cur.variant !== 'scale_type') return cur
      const list = cur.items?.length ? cur.items : createDefaultScaleTypeItems()
      const nextIndex = list.length + 1
      const newId = `scale-type-item-${Date.now()}`
      return {
        ...cur,
        items: [...list, { id: newId, label: `항목 ${nextIndex}` }],
      }
    })
  }

  return (
    <>
      <Form.Item label="항목 수정">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
            <div className="form-editor-mc-items">
              {items.map((item, index) => (
                <SortableScaleRow
                  key={item.id}
                  item={item}
                  index={index}
                  showDelete={showDelete}
                  onLabelChange={setLabel}
                  onRemove={removeItem}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </Form.Item>
      <ItemAddButton onClick={addItem} />
    </>
  )
}
