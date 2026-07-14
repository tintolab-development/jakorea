import type { HorizontalTableParagraph } from '@jakorea/form-schema/writing-form'

export function horizontalTableToDetailInfoRows(paragraph: HorizontalTableParagraph): Array<{
  label: string
  value: string
}> {
  if (paragraph.tableFlavor === 'field' && paragraph.fieldDataRows.length > 0) {
    const headers = paragraph.columnHeaders
    const rows: Array<{ label: string; value: string }> = []
    for (const fieldRow of paragraph.fieldDataRows) {
      fieldRow.forEach((cell, colIndex) => {
        const label = headers[colIndex] ?? `항목 ${colIndex + 1}`
        const value =
          cell.kind === 'text'
            ? (cell.value?.trim() || '-')
            : '-'
        rows.push({ label, value })
      })
    }
    return rows
  }

  return paragraph.dataRows.flatMap((row, rowIndex) =>
    row.map((cell, colIndex) => ({
      label: paragraph.columnHeaders[colIndex] ?? `항목 ${colIndex + 1}`,
      value: cell?.trim() || `행 ${rowIndex + 1}`,
    }))
  )
}
