import Superscript from '@tiptap/extension-superscript'

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** Markdown — `<sup>` HTML fallback */
export const RichTextSuperscript = Superscript.extend({
  renderMarkdown: (node, helpers) => {
    const content = helpers.renderChildren(node.content ?? [])
    return `<sup>${content}</sup>`
  },
})
