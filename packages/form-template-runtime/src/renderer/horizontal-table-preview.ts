import {
  resolveHorizontalTableCellPlainText,
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

  const rowCount = Math.max(1, paragraph.dataRows.length, paragraph.fieldDataRows?.length ?? 0)
  const bodyRows = Array.from({ length: rowCount }, (_, rowIndex) =>
    Array.from({ length: colCount }, (_, colIndex) =>
      resolveHorizontalTableCellPlainText(paragraph, rowIndex, colIndex)
    )
  )

  return { colCount, headers, bodyRows }
}
