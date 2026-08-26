import {
  Node,
  Plugin,
  TextSelection,
  mergeAttributes,
  type EditorState,
  type Transaction,
} from '@/shared/rich-text'

export const MAIL_VARIABLE_NODE_NAME = 'mailVariable'

const MAIL_VARIABLE_TOKEN_RE = /#\{[^{}]+\}/g

function parseLabelFromToken(text: string): string | null {
  const match = /^#\{([^{}]+)\}$/.exec(text.trim())
  return match?.[1] ?? null
}

function wrapMailVariableTextTokens(state: EditorState): Transaction | null {
  const type = state.schema.nodes[MAIL_VARIABLE_NODE_NAME]
  if (!type) return null

  const replacements: { from: number; to: number; label: string }[] = []
  state.doc.descendants((node, pos) => {
    if (node.type === type) return false
    if (!node.isText || !node.text) return
    const pattern = new RegExp(MAIL_VARIABLE_TOKEN_RE.source, 'g')
    let match = pattern.exec(node.text)
    while (match) {
      replacements.push({
        from: pos + match.index,
        to: pos + match.index + match[0].length,
        label: match[0].slice(2, -1),
      })
      match = pattern.exec(node.text)
    }
  })
  if (replacements.length === 0) return null

  let transaction = state.tr
  replacements.sort((a, b) => b.from - a.from)
  for (const item of replacements) {
    transaction = transaction.replaceWith(item.from, item.to, type.create({ label: item.label }))
  }
  return transaction
}

/** 에디터에서 `#{변수}`를 통째로만 다루는 inline atom */
export const MailVariable = Node.create({
  name: MAIL_VARIABLE_NODE_NAME,
  group: 'inline',
  inline: true,
  atom: true,
  selectable: false,
  draggable: false,

  addAttributes() {
    return {
      label: {
        default: '',
        parseHTML: element =>
          element.getAttribute('data-mail-variable') ||
          parseLabelFromToken(element.textContent ?? '') ||
          '',
        renderHTML: attributes => ({
          'data-mail-variable': attributes.label,
        }),
      },
    }
  },

  parseHTML() {
    return [
      { tag: 'span[data-mail-variable]', priority: 60 },
      {
        tag: 'span.mail-template-variable',
        priority: 60,
        getAttrs: node => {
          if (!(node instanceof HTMLElement)) return false
          const label =
            node.getAttribute('data-mail-variable') || parseLabelFromToken(node.textContent ?? '')
          return label ? { label } : false
        },
      },
      {
        tag: 'span',
        priority: 51,
        getAttrs: node => {
          if (!(node instanceof HTMLElement)) return false
          if (node.getAttribute('data-mail-variable')) return false
          const text = node.textContent ?? ''
          const label = parseLabelFromToken(text)
          return label && text.trim() === `#{${label}}` ? { label } : false
        },
      },
    ]
  },

  renderHTML({ node, HTMLAttributes }) {
    const label = String(node.attrs.label ?? '')
    return [
      'span',
      mergeAttributes(HTMLAttributes, {
        class: 'mail-template-variable',
        'data-mail-variable': label,
        contenteditable: 'false',
      }),
      `#{${label}}`,
    ]
  },

  renderText({ node }) {
    return `#{${String(node.attrs.label ?? '')}}`
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        appendTransaction: (transactions, _oldState, newState) => {
          if (!transactions.some(transaction => transaction.docChanged)) return null
          return wrapMailVariableTextTokens(newState)
        },
      }),
      new Plugin({
        props: {
          handleClickOn(view, _pos, node, nodePos, event) {
            if (node.type.name !== MAIL_VARIABLE_NODE_NAME) return false
            const target = event.target
            const chip =
              target instanceof Element
                ? (target.closest('.mail-template-variable') ?? target)
                : null
            if (!(chip instanceof Element)) return false
            const rect = chip.getBoundingClientRect()
            const insertPos =
              event.clientX >= rect.left + rect.width / 2 ? nodePos + node.nodeSize : nodePos
            view.dispatch(
              view.state.tr.setSelection(TextSelection.near(view.state.doc.resolve(insertPos)))
            )
            view.focus()
            return true
          },
        },
      }),
    ]
  },
})

export const MAIL_VARIABLE_EXTENSIONS = [MailVariable]
