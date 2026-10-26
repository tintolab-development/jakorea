import {
  resolveHorizontalTableCellPlainText,
  type HorizontalTableParagraph,
} from '@jakorea/form-schema/writing-form'

export type HorizontalTablePreviewLayout = {
  colCount: number
  headers: string[]
  bodyRows: string[][]
}

export function patchHorizontalTableDataCell(
  paragraph: HorizontalTableParagraph,
  rowIndex: number,
  colIndex: number,
  value: string
): HorizontalTableParagraph {
  const colCount = Math.max(1, paragraph.columnHeaders.length, colIndex + 1)
  const rowCount = Math.max(1, paragraph.dataRows.length, rowIndex + 1)
  const dataRows = Array.from({ length: rowCount }, (_, ri) => {
    const existing = paragraph.dataRows[ri] ?? []
    return Array.from({ length: colCount }, (_, ci) =>
      ri === rowIndex && ci === colIndex ? value : (existing[ci] ?? '')
    )
  })
  return { ...paragraph, dataRows }
}

export function resolveHorizontalTablePreviewLayout(
  paragraph: HorizontalTableParagraph
): HorizontalTablePreviewLayout {
  const colCount = Math.max(1, paragraph.columnHeaders.length)
  const headers = paragraph.columnHeaders.slice(0, colCount)
  while (headers.length < colCount) headers.push('')

  const rowCount = Math.max(1, paragraph.dataRows.length, paragraph.fieldDataRows?.length ?? 0)
  const bodyRows = Array.from({ length: rowCount }, (_, rowIndex) =>
    Array.from({ length: colCount }, (_, colIndex) =>
      resolveHorizontalTableCellPlainText(paragraph, rowIndex, colIndex)
    )
  )

  return { colCount, headers, bodyRows }
}
