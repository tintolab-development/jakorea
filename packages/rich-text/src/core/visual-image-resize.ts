import {
  containerStyleHasPersistentLayout,
  moveSelectedImageBlock,
  parseImageContainerStyleFromElement,
} from './image-align'
import { wrapImageNodeViewWithDragHandle } from './image-node-view'
import { RichTextImageResize } from './markdown-serializers'

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** Homepage Admin 시각 편집 전용 — 공통 CMS/Platform 에디터에는 쓰지 않는다. */
export function createVisualImageResize() {
  return RichTextImageResize.extend({
    addAttributes() {
      const parentAttrs = (this.parent?.() ?? {}) as Record<string, unknown>
      const parentContainerStyle = parentAttrs.containerStyle as
        | { parseHTML?: (element: HTMLElement) => string | null | undefined }
        | undefined
      return {
        ...parentAttrs,
        containerStyle: {
          ...(typeof parentAttrs.containerStyle === 'object' && parentAttrs.containerStyle
            ? parentAttrs.containerStyle
            : {}),
          parseHTML: (element: HTMLElement) => {
            const inherited =
              typeof parentContainerStyle?.parseHTML === 'function'
                ? parentContainerStyle.parseHTML(element)
                : element.getAttribute('style')
            return parseImageContainerStyleFromElement(element, inherited ?? null)
          },
        },
      }
    },
    renderMarkdown: node => {
      const attrs = node.attrs as Record<string, string | number | undefined> | undefined
      const rawSrc = attrs?.persistSrc || attrs?.src || ''
      const src = typeof rawSrc === 'string' ? rawSrc : String(rawSrc)
      const rawAlt = attrs?.alt ?? ''
      const alt = typeof rawAlt === 'string' ? rawAlt : String(rawAlt)
      const containerStyle =
        typeof attrs?.containerStyle === 'string' ? attrs.containerStyle : undefined
      const fileSize = attrs?.fileSize
      if (containerStyleHasPersistentLayout(containerStyle) || fileSize) {
        const style = escapeHtml(containerStyle ?? '')
        const styleAttr = style ? ` style="${style}"` : ''
        const fileSizeAttr = fileSize ? ` data-file-size="${escapeHtml(String(fileSize))}"` : ''
        return `<img src="${escapeHtml(src)}" alt="${escapeHtml(alt)}" class="rich-text-content__image"${styleAttr}${fileSizeAttr} />`
      }
      const safeAlt = alt.replace(/]/g, '\\]')
      return `![${safeAlt}](${src})`
    },
    addNodeView() {
      return wrapImageNodeViewWithDragHandle(this.parent?.())
    },
    addKeyboardShortcuts() {
      return {
        ...(this.parent?.() ?? {}),
        'Alt-ArrowUp': ({ editor }) => moveSelectedImageBlock(editor, -1),
        'Alt-ArrowDown': ({ editor }) => moveSelectedImageBlock(editor, 1),
      }
    },
  })
}
