import type { Editor } from '@tiptap/react'
import '@tiptap/extension-table'

export const RICH_TEXT_TABLE_EDIT_ACTIONS = [
  { command: 'addRowBefore', label: '위에 행 추가' },
  { command: 'addRowAfter', label: '아래에 행 추가' },
  { command: 'addColumnBefore', label: '왼쪽에 열 추가' },
  { command: 'addColumnAfter', label: '오른쪽에 열 추가' },
  { command: 'deleteRow', label: '행 삭제' },
  { command: 'deleteColumn', label: '열 삭제' },
  { command: 'mergeCells', label: '셀 병합' },
  { command: 'splitCell', label: '셀 나누기' },
  { command: 'deleteTable', label: '표 삭제' },
] as const

export type RichTextTableEditCommand =
  (typeof RICH_TEXT_TABLE_EDIT_ACTIONS)[number]['command']

export type RichTextTableCommandAvailability = Record<RichTextTableEditCommand, boolean>

export const EMPTY_RICH_TEXT_TABLE_COMMAND_AVAILABILITY: RichTextTableCommandAvailability =
  Object.fromEntries(
    RICH_TEXT_TABLE_EDIT_ACTIONS.map(action => [action.command, false])
  ) as RichTextTableCommandAvailability

export type RichTextTableToolbarItem =
  | { kind: 'insert'; label: string }
  | { kind: 'divider' }
  | {
      kind: 'command'
      command: RichTextTableEditCommand
      label: string
      disabled: boolean
    }

export function isRichTextTableActive(editor: Editor): boolean {
  return (
    editor.isActive('table') ||
    editor.isActive('tableCell') ||
    editor.isActive('tableHeader') ||
    editor.isActive('tableRow')
  )
}

export function richTextDocumentHasTable(editor: Editor): boolean {
  let found = false
  editor.state.doc.descendants(node => {
    if (node.type.name === 'table') {
      found = true
      return false
    }
  })
  return found
}

export function canRunRichTextTableCommand(
  editor: Editor,
  command: RichTextTableEditCommand
): boolean {
  if (!editor.isEditable || !isRichTextTableActive(editor)) return false
  const can = editor.can()
  switch (command) {
    case 'addRowBefore':
      return can.addRowBefore()
    case 'addRowAfter':
      return can.addRowAfter()
    case 'addColumnBefore':
      return can.addColumnBefore()
    case 'addColumnAfter':
      return can.addColumnAfter()
    case 'deleteRow':
      return can.deleteRow()
    case 'deleteColumn':
      return can.deleteColumn()
    case 'mergeCells':
      return can.mergeCells()
    case 'splitCell':
      return can.splitCell()
    case 'deleteTable':
      return can.deleteTable()
    default: {
      const _exhaustive: never = command
      return _exhaustive
    }
  }
}

export function getRichTextTableCommandAvailability(
  editor: Editor
): RichTextTableCommandAvailability {
  if (!editor.isEditable || !isRichTextTableActive(editor)) {
    return EMPTY_RICH_TEXT_TABLE_COMMAND_AVAILABILITY
  }
  const availability = { ...EMPTY_RICH_TEXT_TABLE_COMMAND_AVAILABILITY }
  for (const action of RICH_TEXT_TABLE_EDIT_ACTIONS) {
    availability[action.command] = canRunRichTextTableCommand(editor, action.command)
  }
  return availability
}

export function runRichTextTableCommand(
  editor: Editor,
  command: RichTextTableEditCommand
): void {
  const chain = editor.chain().focus()
  switch (command) {
    case 'addRowBefore':
      chain.addRowBefore().run()
      return
    case 'addRowAfter':
      chain.addRowAfter().run()
      return
    case 'addColumnBefore':
      chain.addColumnBefore().run()
      return
    case 'addColumnAfter':
      chain.addColumnAfter().run()
      return
    case 'deleteRow':
      chain.deleteRow().run()
      return
    case 'deleteColumn':
      chain.deleteColumn().run()
      return
    case 'mergeCells':
      chain.mergeCells().run()
      return
    case 'splitCell':
      chain.splitCell().run()
      return
    case 'deleteTable':
      chain.deleteTable().run()
      return
    default: {
      const _exhaustive: never = command
      return _exhaustive
    }
  }
}

export function listRichTextTableToolbarItems(args: {
  inTable: boolean
  availability?: RichTextTableCommandAvailability
}): RichTextTableToolbarItem[] {
  const items: RichTextTableToolbarItem[] = [{ kind: 'insert', label: '표 삽입' }]
  items.push({ kind: 'divider' })
  for (const action of RICH_TEXT_TABLE_EDIT_ACTIONS) {
    items.push({
      kind: 'command',
      command: action.command,
      label: action.label,
      disabled: !args.inTable || args.availability?.[action.command] === false,
    })
  }
  return items
}
