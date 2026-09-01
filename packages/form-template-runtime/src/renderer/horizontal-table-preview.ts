import {
  fieldCellValueToPlainText,
  type HorizontalTableParagraph,
} from '@jakorea/form-schema/writing-form'

export type HorizontalTablePreviewLayout = {
  colCount: number
  headers: string[]
  bodyRows: string[][]
}

export function resolveHorizontalTablePreviewLayout(
  paragraph: HorizontalTableParagraph
): HorizontalTablePreviewLayout {
  const colCount = Math.max(1, paragraph.columnHeaders.length)
  const headers = paragraph.columnHeaders.slice(0, colCount)
  while (headers.length < colCount) headers.push('')

  if (paragraph.tableFlavor === 'field') {
    const fieldRows = paragraph.fieldDataRows ?? []
    const bodyRows =
      fieldRows.length > 0
        ? fieldRows.map(row => {
            const cells = row.slice(0, colCount)
            while (cells.length < colCount) {
              cells.push({ kind: 'text', value: '' })
            }
            return cells.map(cell => fieldCellValueToPlainText(cell))
          })
        : [Array.from({ length: colCount }, () => '')]

    return { colCount, headers, bodyRows }
  }

  const bodyRows = paragraph.dataRows.map(row => {
    const cells = [...row]
    while (cells.length < colCount) cells.push('')
    return cells.slice(0, colCount)
  })

  if (bodyRows.length === 0) {
    bodyRows.push(Array.from({ length: colCount }, () => ''))
  }

  return { colCount, headers, bodyRows }
}
