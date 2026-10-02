import {
  DEFAULT_VERTICAL_FILE_ATTACHMENT_HEADER_LABEL,
  DEFAULT_VERTICAL_SUBJECTIVE_CELL_PLACEHOLDER,
  effectiveVerticalCompositeTimeHint,
  effectiveVerticalRowDateTimeModes,
  effectiveVerticalStageKinds,
  normalizeVerticalChoiceOptions,
  normalizeVerticalTableParagraph,
  verticalTableHeaderPlaceholder,
  type DateTimeFieldMode,
  type TableBottomConsent,
  type VerticalTableParagraph,
  type VerticalTableRow,
  type VerticalTableStageKind,
} from '@jakorea/form-schema/writing-form'

export const VERTICAL_TABLE_FILE_NAME_SEPARATOR = ' | '

const VT_DATE_PLACEHOLDER = '날짜를 선택해 주세요'
const VT_TIME_PLACEHOLDER = '시간을 선택해 주세요'
const VT_TEXT_CELL_PLACEHOLDER = DEFAULT_VERTICAL_SUBJECTIVE_CELL_PLACEHOLDER

export type VerticalTablePreviewStage = {
  header: string
  headerPlaceholder: string
  cell: string
  cellPlaceholder: string
  kind: VerticalTableStageKind
  dateTimeMode: DateTimeFieldMode | null
  compositeTime: string
  compositeTimeHint: string
  multipleSelected: string[]
  fileNames: string[]
}

export type VerticalTablePreviewRow = {
  stageCount: 1 | 2
  stages: VerticalTablePreviewStage[]
}

export type VerticalTablePreviewLayout = {
  paragraph: VerticalTableParagraph
  choiceOptions: string[]
  rows: VerticalTablePreviewRow[]
}

export function parseVerticalTableFileNames(cell: string): string[] {
  return cell
    .split(VERTICAL_TABLE_FILE_NAME_SEPARATOR)
    .map(name => name.trim())
    .filter(Boolean)
}

export function joinVerticalTableFileNames(names: readonly string[]): string {
  return names
    .map(name => name.trim())
    .filter(Boolean)
    .join(VERTICAL_TABLE_FILE_NAME_SEPARATOR)
}

function verticalCompositeTimeValue(row: VerticalTableRow, stageIdx: number): string {
  if (row.stageCount === 1) {
    return row.dateTimeStage0AuxTime ?? row.dateTimeStage1Time ?? ''
  }
  return stageIdx === 0 ? (row.dateTimeStage0AuxTime ?? '') : (row.dateTimeStage1Time ?? '')
}

function resolveStagePlaceholder(
  row: VerticalTableRow,
  stageIdx: number,
  kind: VerticalTableStageKind,
  dateTimeMode: DateTimeFieldMode | null,
  flavorIsDateTime: boolean
): string {
  const hint = row.placeholderHints?.[stageIdx] ?? ''
  if (kind === 'subjective') {
    return hint.trim() !== '' ? hint : DEFAULT_VERTICAL_SUBJECTIVE_CELL_PLACEHOLDER
  }
  if (kind === 'date_time') {
    if (hint.trim() !== '') return hint
    if (dateTimeMode === 'time') return VT_TIME_PLACEHOLDER
    if (flavorIsDateTime) return '일정 선택'
    return VT_DATE_PLACEHOLDER
  }
  if (kind === 'file_attachment') {
    return DEFAULT_VERTICAL_FILE_ATTACHMENT_HEADER_LABEL
  }
  return VT_TEXT_CELL_PLACEHOLDER
}

function resolvePreviewStage(
  paragraph: VerticalTableParagraph,
  row: VerticalTableRow,
  rowIdx: number,
  stageIdx: number
): VerticalTablePreviewStage {
  const kinds = effectiveVerticalStageKinds(row, paragraph.verticalTableFlavor)
  const kind = kinds[stageIdx as 0 | 1] ?? 'text'
  const dateTimeMode =
    kind === 'date_time' ? (effectiveVerticalRowDateTimeModes(row)[stageIdx as 0 | 1] ?? 'date') : null
  const cell = row.cells[stageIdx] ?? ''
  return {
    header: row.headers[stageIdx] ?? '',
    headerPlaceholder: verticalTableHeaderPlaceholder(rowIdx, stageIdx, row.stageCount),
    cell,
    cellPlaceholder: resolveStagePlaceholder(
      row,
      stageIdx,
      kind,
      dateTimeMode,
      paragraph.verticalTableFlavor === 'date_time'
    ),
    kind,
    dateTimeMode,
    compositeTime: verticalCompositeTimeValue(row, stageIdx),
    compositeTimeHint: effectiveVerticalCompositeTimeHint(row, stageIdx as 0 | 1),
    multipleSelected: row.choiceMultipleSelections?.[stageIdx] ?? [],
    fileNames: kind === 'file_attachment' ? parseVerticalTableFileNames(cell) : [],
  }
}

export function resolveVerticalTablePreviewLayout(
  paragraph: VerticalTableParagraph
): VerticalTablePreviewLayout {
  const normalized = normalizeVerticalTableParagraph(paragraph)
  return {
    paragraph: normalized,
    choiceOptions: normalizeVerticalChoiceOptions(normalized.verticalChoiceOptions),
    rows: normalized.rows.map((row, rowIdx) => ({
      stageCount: row.stageCount,
      stages:
        row.stageCount === 1
          ? [resolvePreviewStage(normalized, row, rowIdx, 0)]
          : [0, 1].map(stageIdx => resolvePreviewStage(normalized, row, rowIdx, stageIdx)),
    })),
  }
}

function replaceRow(
  rows: VerticalTableRow[],
  rowIdx: number,
  patch: (row: VerticalTableRow) => VerticalTableRow
): VerticalTableRow[] {
  return rows.map((row, index) => (index === rowIdx ? patch(row) : row))
}

function withNormalizedVerticalTable(
  paragraph: VerticalTableParagraph,
  update: (normalized: VerticalTableParagraph) => VerticalTableParagraph
): VerticalTableParagraph {
  return normalizeVerticalTableParagraph(update(normalizeVerticalTableParagraph(paragraph)))
}

export function patchVerticalTableCell(
  paragraph: VerticalTableParagraph,
  rowIdx: number,
  stageIdx: number,
  value: string
): VerticalTableParagraph {
  return withNormalizedVerticalTable(paragraph, normalized => ({
    ...normalized,
    rows: replaceRow(normalized.rows, rowIdx, row => {
      if (row.stageCount === 1) {
        return { ...row, cells: [value] }
      }
      const cells: [string, string] = [...row.cells]
      cells[stageIdx] = value
      return { ...row, cells }
    }),
  }))
}

export function patchVerticalTableCompositeTime(
  paragraph: VerticalTableParagraph,
  rowIdx: number,
  stageIdx: number,
  value: string
): VerticalTableParagraph {
  return withNormalizedVerticalTable(paragraph, normalized => ({
    ...normalized,
    rows: replaceRow(normalized.rows, rowIdx, row => {
      if (row.stageCount === 1) {
        return { ...row, dateTimeStage0AuxTime: value, dateTimeStage1Time: value }
      }
      if (stageIdx === 0) {
        return { ...row, dateTimeStage0AuxTime: value }
      }
      return { ...row, dateTimeStage1Time: value }
    }),
  }))
}

export function patchVerticalTableMultipleChoice(
  paragraph: VerticalTableParagraph,
  rowIdx: number,
  stageIdx: number,
  values: string[]
): VerticalTableParagraph {
  return withNormalizedVerticalTable(paragraph, normalized => ({
    ...normalized,
    rows: replaceRow(normalized.rows, rowIdx, row => {
      if (row.stageCount === 1) {
        return { ...row, choiceMultipleSelections: [values] as [string[]] }
      }
      const current0 = row.choiceMultipleSelections?.[0] ?? []
      const current1 = row.choiceMultipleSelections?.[1] ?? []
      if (stageIdx === 0) {
        return { ...row, choiceMultipleSelections: [values, current1] as [string[], string[]] }
      }
      return { ...row, choiceMultipleSelections: [current0, values] as [string[], string[]] }
    }),
  }))
}

export function patchVerticalTableFileNames(
  paragraph: VerticalTableParagraph,
  rowIdx: number,
  stageIdx: number,
  fileNames: readonly string[]
): VerticalTableParagraph {
  return patchVerticalTableCell(paragraph, rowIdx, stageIdx, joinVerticalTableFileNames(fileNames))
}

export function patchVerticalTableBottomConsent(
  paragraph: VerticalTableParagraph,
  value: TableBottomConsent
): VerticalTableParagraph {
  return withNormalizedVerticalTable(paragraph, normalized => ({
    ...normalized,
    bottomConsent: value,
  }))
}

export function mergeFilledVerticalTable(
  current: VerticalTableParagraph,
  extra: VerticalTableParagraph
): VerticalTableParagraph {
  const currentTable = normalizeVerticalTableParagraph(current)
  const extraTable = normalizeVerticalTableParagraph(extra)
  const rowCount = Math.max(currentTable.rows.length, extraTable.rows.length, 1)
  const rows = Array.from({ length: rowCount }, (_, rowIndex) => {
    const currentRow = currentTable.rows[rowIndex]
    const extraRow = extraTable.rows[rowIndex]
    if (!extraRow) return currentRow ?? extraRow
    if (!currentRow) return extraRow
    const stageCount: 1 | 2 = currentRow.stageCount === 2 || extraRow.stageCount === 2 ? 2 : 1
    const mergedCells = Array.from({ length: stageCount }, (_, stageIdx) => {
      const currentText = currentRow.cells[stageIdx] ?? ''
      const extraText = extraRow.cells[stageIdx] ?? ''
      return extraText.trim().length > currentText.trim().length ? extraText : currentText
    })
    const mergedHeaders = Array.from({ length: stageCount }, (_, stageIdx) => {
      const currentHeader = currentRow.headers[stageIdx] ?? ''
      const extraHeader = extraRow.headers[stageIdx] ?? ''
      return extraHeader.trim().length > currentHeader.trim().length ? extraHeader : currentHeader
    })
    const mergedMultiple = Array.from({ length: stageCount }, (_, stageIdx) => {
      const currentSelected = currentRow.choiceMultipleSelections?.[stageIdx] ?? []
      const extraSelected = extraRow.choiceMultipleSelections?.[stageIdx] ?? []
      return extraSelected.length > currentSelected.length ? extraSelected : currentSelected
    })
    const currentTime0 = currentRow.dateTimeStage0AuxTime ?? ''
    const extraTime0 = extraRow.dateTimeStage0AuxTime ?? ''
    const currentTime1 = currentRow.dateTimeStage1Time ?? ''
    const extraTime1 = extraRow.dateTimeStage1Time ?? ''
    const kinds = extraRow.stageKinds ?? currentRow.stageKinds
    const dateTimeStage0AuxTime =
      extraTime0.trim().length > currentTime0.trim().length ? extraTime0 : currentTime0
    const dateTimeStage1Time =
      extraTime1.trim().length > currentTime1.trim().length ? extraTime1 : currentTime1
    if (stageCount === 2) {
      const row: VerticalTableRow = {
        stageCount: 2,
        headers: [mergedHeaders[0] ?? '', mergedHeaders[1] ?? ''],
        cells: [mergedCells[0] ?? '', mergedCells[1] ?? ''],
        choiceMultipleSelections: [mergedMultiple[0] ?? [], mergedMultiple[1] ?? []],
        dateTimeStage0AuxTime,
        dateTimeStage1Time,
      }
      if (kinds && kinds.length >= 2 && kinds[0] != null && kinds[1] != null) {
        row.stageKinds = [kinds[0], kinds[1]]
      }
      return row
    }
    const row: VerticalTableRow = {
      stageCount: 1,
      headers: [mergedHeaders[0] ?? ''],
      cells: [mergedCells[0] ?? ''],
      choiceMultipleSelections: [mergedMultiple[0] ?? []],
      dateTimeStage0AuxTime,
      dateTimeStage1Time,
    }
    if (kinds && kinds.length >= 1 && kinds[0] != null) {
      row.stageKinds = [kinds[0]]
    }
    return row
  })
  const extraConsent = extraTable.bottomConsent
  const currentConsent = currentTable.bottomConsent
  return normalizeVerticalTableParagraph({
    ...currentTable,
    rows,
    bottomConsent: extraConsent ?? currentConsent,
    bottomText:
      extraTable.bottomText.trim().length > currentTable.bottomText.trim().length
        ? extraTable.bottomText
        : currentTable.bottomText,
  })
}
