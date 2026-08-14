import { useDraggable, useDroppable } from '@dnd-kit/core'
import {
  ALIMTALK_ROOT_CATEGORY_ID,
  type AlimtalkCategory,
  type AlimtalkTemplateItem,
  type AlimtalkTreeSelection,
} from '@/features/notifications/model/alimtalk-template/types'
import { childrenOf } from '@/features/notifications/lib/tree'
import {
  IconFolderClosed,
  IconFolderOpen,
  IconTemplateDoc,
  IconTreeCollapse,
  IconTreeExpand,
} from './icons'

export const ALIMTALK_DND_TEMPLATE_PREFIX = 'template:'
export const ALIMTALK_DND_CATEGORY_PREFIX = 'category:'
export const ALIMTALK_DND_CATEGORY_MOVE_PREFIX = 'cat-move:'

export function alimtalkTemplateDndId(id: string) {
  return `${ALIMTALK_DND_TEMPLATE_PREFIX}${id}`
}

export function alimtalkCategoryDndId(id: string) {
  return `${ALIMTALK_DND_CATEGORY_PREFIX}${id}`
}

export function alimtalkCategoryMoveDndId(id: string) {
  return `${ALIMTALK_DND_CATEGORY_MOVE_PREFIX}${id}`
}

export function parseAlimtalkDndId(id: string): AlimtalkTreeSelection {
  if (id.startsWith(ALIMTALK_DND_TEMPLATE_PREFIX)) {
    return { kind: 'template', id: id.slice(ALIMTALK_DND_TEMPLATE_PREFIX.length) }
  }
  if (id.startsWith(ALIMTALK_DND_CATEGORY_MOVE_PREFIX)) {
    return { kind: 'category', id: id.slice(ALIMTALK_DND_CATEGORY_MOVE_PREFIX.length) }
  }
  if (id.startsWith(ALIMTALK_DND_CATEGORY_PREFIX)) {
    return { kind: 'category', id: id.slice(ALIMTALK_DND_CATEGORY_PREFIX.length) }
  }
  return null
}

type CategoryTreeProps = {
  categories: AlimtalkCategory[]
  templates: AlimtalkTemplateItem[]
  expandedIds: ReadonlySet<string>
  selection: AlimtalkTreeSelection
  onToggleExpand: (categoryId: string) => void
  onSelect: (selection: AlimtalkTreeSelection) => void
}

export function CategoryTree(props: CategoryTreeProps) {
  return (
    <ul className="alimtalk-category-tree" role="tree">
      <RootRow {...props} />
    </ul>
  )
}

function rowClassName(selected: boolean, extra = '') {
  return [
    'alimtalk-category-tree__row',
    selected ? 'alimtalk-category-tree__row--selected' : '',
    extra,
  ]
    .filter(Boolean)
    .join(' ')
}

function RootRow(props: CategoryTreeProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: alimtalkCategoryDndId(ALIMTALK_ROOT_CATEGORY_ID),
  })
  const expanded = props.expandedIds.has(ALIMTALK_ROOT_CATEGORY_ID)
  const selected =
    props.selection?.kind === 'category' && props.selection.id === ALIMTALK_ROOT_CATEGORY_ID
  const childNodes = childrenOf(props.categories, props.templates, ALIMTALK_ROOT_CATEGORY_ID)

  return (
    <li ref={setNodeRef} className="alimtalk-category-tree__node alimtalk-category-tree__node--root">
      <div
        className={rowClassName(selected, isOver ? 'alimtalk-category-tree__row--drop' : '')}
        role="treeitem"
        aria-expanded={expanded}
        onClick={() => props.onSelect({ kind: 'category', id: ALIMTALK_ROOT_CATEGORY_ID })}
      >
        <span className="alimtalk-category-tree__icon">
          {expanded ? <IconFolderOpen /> : <IconFolderClosed />}
        </span>
        <span className="alimtalk-category-tree__label">Category</span>
      </div>
      {expanded && childNodes.length > 0 ? (
        <CategoryChildren parentId={ALIMTALK_ROOT_CATEGORY_ID} fromRoot {...props} />
      ) : null}
    </li>
  )
}

function CategoryChildren({
  parentId,
  fromRoot = false,
  ...props
}: CategoryTreeProps & { parentId: string; fromRoot?: boolean }) {
  const nodes = childrenOf(props.categories, props.templates, parentId)
  return (
    <ul
      className={
        fromRoot
          ? 'alimtalk-category-tree__children alimtalk-category-tree__children--from-root'
          : 'alimtalk-category-tree__children'
      }
    >
      {nodes.map(node =>
        node.kind === 'category' ? (
          <CategoryRow key={node.category.id} category={node.category} {...props} />
        ) : (
          <TemplateRow key={node.template.id} template={node.template} {...props} />
        )
      )}
    </ul>
  )
}

function CategoryRow({
  category,
  ...props
}: CategoryTreeProps & { category: AlimtalkCategory }) {
  const { setNodeRef: setDropRef, isOver } = useDroppable({ id: alimtalkCategoryDndId(category.id) })
  const { attributes, listeners, setNodeRef: setDragRef, isDragging } = useDraggable({
    id: alimtalkCategoryMoveDndId(category.id),
  })
  const setNodeRef = (node: HTMLLIElement | null) => {
    setDropRef(node)
    setDragRef(node)
  }
  const expanded = props.expandedIds.has(category.id)
  const selected = props.selection?.kind === 'category' && props.selection.id === category.id
  const hasChildren = childrenOf(props.categories, props.templates, category.id).length > 0

  return (
    <li ref={setNodeRef} className="alimtalk-category-tree__node">
      <div
        className={rowClassName(
          selected,
          [
            isOver ? 'alimtalk-category-tree__row--drop' : '',
            isDragging ? 'alimtalk-category-tree__row--dragging' : '',
          ]
            .filter(Boolean)
            .join(' ')
        )}
        onClick={() => props.onSelect({ kind: 'category', id: category.id })}
        {...listeners}
        {...attributes}
        role="treeitem"
        aria-expanded={hasChildren ? expanded : undefined}
      >
        {hasChildren ? (
          <button
            type="button"
            className="alimtalk-category-tree__toggle"
            aria-label={expanded ? '접기' : '펼치기'}
            onClick={event => {
              event.stopPropagation()
              props.onToggleExpand(category.id)
            }}
            onPointerDown={event => event.stopPropagation()}
          >
            {expanded ? <IconTreeCollapse /> : <IconTreeExpand />}
          </button>
        ) : (
          <span className="alimtalk-category-tree__toggle-spacer" />
        )}
        <span className="alimtalk-category-tree__icon">
          {expanded && hasChildren ? <IconFolderOpen /> : <IconFolderClosed />}
        </span>
        <span className="alimtalk-category-tree__label">{category.name}</span>
      </div>
      {expanded && hasChildren ? <CategoryChildren parentId={category.id} {...props} /> : null}
    </li>
  )
}

function TemplateRow({
  template,
  ...props
}: CategoryTreeProps & { template: AlimtalkTemplateItem }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: alimtalkTemplateDndId(template.id),
  })
  const selected = props.selection?.kind === 'template' && props.selection.id === template.id

  return (
    <li className="alimtalk-category-tree__node alimtalk-category-tree__node--template">
      <div
        ref={setNodeRef}
        className={rowClassName(
          selected,
          [
            'alimtalk-category-tree__row--template',
            isDragging ? 'alimtalk-category-tree__row--dragging' : '',
          ]
            .filter(Boolean)
            .join(' ')
        )}
        onClick={() => props.onSelect({ kind: 'template', id: template.id })}
        {...listeners}
        {...attributes}
      >
        <span className="alimtalk-category-tree__icon">
          <IconTemplateDoc />
        </span>
        <span className="alimtalk-category-tree__label">{template.name}</span>
      </div>
    </li>
  )
}
