import { Node, mergeAttributes } from '@/shared/rich-text'
import { MAIL_BUTTON_ATTR, MAIL_PRIMARY_BUTTON_ATTRS } from './layout-html'

export const MAIL_BUTTON_NODE_NAME = 'mailButton'

/**
 * 메일 본문 버튼(`mailPrimaryButtonHtml`, `table[data-mail-button]`)을 통째로 다루는 block atom.
 * 에디터 표 기능은 인라인 스타일을 버리므로, 버튼 표를 이 노드로 읽고 저장할 때 같은 스타일 HTML을 다시 쓴다.
 * 라벨·href(`https://#{도메인}#{알림 링크 경로}`)만 속성으로 보관한다.
 */
export const MailButton = Node.create({
  name: MAIL_BUTTON_NODE_NAME,
  group: 'block',
  atom: true,
  selectable: true,
  draggable: false,

  addAttributes() {
    return {
      label: {
        default: '',
        parseHTML: element => element.querySelector('a')?.textContent?.trim() ?? '',
        renderHTML: () => ({}),
      },
      href: {
        default: '',
        parseHTML: element => element.querySelector('a')?.getAttribute('href') ?? '',
        renderHTML: () => ({}),
      },
    }
  },

  parseHTML() {
    // 표(table) 확장보다 먼저 잡는다
    return [{ tag: `table[${MAIL_BUTTON_ATTR}]`, priority: 1000 }]
  },

  renderHTML({ node, HTMLAttributes }) {
    const { table, td, a } = MAIL_PRIMARY_BUTTON_ATTRS
    const label = String(node.attrs.label ?? '')
    const href = String(node.attrs.href ?? '')
    return [
      'table',
      mergeAttributes(HTMLAttributes, { [MAIL_BUTTON_ATTR]: '' }, table),
      ['tr', ['td', { ...td }, ['a', { href, ...a }, label]]],
    ]
  },
})
