import { NodeSelection } from '@tiptap/pm/state'
import type { Editor } from '@tiptap/core'
import type { NodeViewRenderer, NodeViewRendererProps } from '@tiptap/core'

type InnerImageNodeView = {
  dom?: Node
  contentDOM?: HTMLElement | null
  update?: (...args: never[]) => boolean
  selectNode?: () => void
  deselectNode?: () => void
  destroy?: () => void
  ignoreMutation?: (mutation: unknown) => boolean
  stopEvent?: (event: Event) => boolean
}

function resolvePos(getPos: NodeViewRendererProps['getPos']): number | null {
  const pos = typeof getPos === 'function' ? getPos() : getPos
  return typeof pos === 'number' ? pos : null
}

function selectImageNode(editor: Editor, getPos: NodeViewRendererProps['getPos']): number | null {
  const pos = resolvePos(getPos)
  if (pos == null || editor.isDestroyed) return null
  const node = editor.state.doc.nodeAt(pos)
  if (!node || node.type.name !== 'image') return null
  editor.view.dispatch(editor.state.tr.setSelection(NodeSelection.create(editor.state.doc, pos)))
  return pos
}

/** 부모 ImageResize 노드뷰를 그립 래퍼로 감싼다. 모서리 리사이즈는 그대로 둔다. */
export function wrapImageNodeViewWithDragHandle(
  parentView: NodeViewRenderer | null | undefined
): NodeViewRenderer {
  return ((props: NodeViewRendererProps) => {
    const inner =
      typeof parentView === 'function' ? (parentView(props) as InnerImageNodeView) : undefined
    const wrap = document.createElement('div')
    wrap.className = 'rich-text-image-block'
    wrap.setAttribute('data-rich-text-image-block', '')

    const handle = document.createElement('button')
    handle.type = 'button'
    handle.className = 'rich-text-image-block__drag-handle'
    handle.title = '끌어 위치 이동'
    handle.setAttribute('aria-label', '이미지 위치 이동')
    handle.draggable = true
    handle.contentEditable = 'false'

    handle.addEventListener('mousedown', event => {
      event.stopPropagation()
      selectImageNode(props.editor, props.getPos)
    })

    handle.addEventListener('dragstart', event => {
      event.stopPropagation()
      const pos = selectImageNode(props.editor, props.getPos)
      if (pos == null) {
        event.preventDefault()
        return
      }
      const view = props.editor.view
      const slice = view.state.selection.content()
      view.dragging = { slice, move: !event.ctrlKey }
      event.dataTransfer?.setData('text/plain', 'image')
      event.dataTransfer?.setDragImage(wrap, 12, 12)
    })

    handle.addEventListener('dragend', () => {
      if (props.editor.view.dragging) props.editor.view.dragging = null
    })

    wrap.append(handle)
    if (inner?.dom) wrap.append(inner.dom)

    return {
      dom: wrap,
      contentDOM: inner?.contentDOM ?? null,
      update: inner?.update?.bind(inner),
      selectNode: () => {
        wrap.classList.add('rich-text-image-block--selected')
        inner?.selectNode?.()
      },
      deselectNode: () => {
        wrap.classList.remove('rich-text-image-block--selected')
        inner?.deselectNode?.()
      },
      destroy: inner?.destroy?.bind(inner),
      ignoreMutation: inner?.ignoreMutation?.bind(inner),
      stopEvent: event => {
        if (event.target === handle || handle.contains(event.target as Node)) return false
        return inner?.stopEvent?.(event) ?? false
      },
    }
  }) as NodeViewRenderer
}
