import type { RefObject } from 'react'
import {
  computeDocScreeningTableScrollX,
  type UjatEssayColumnKey,
  type UjatEssayColumnWidths,
} from './ujat-volunteer-doc-screening-columns'

const ESSAY_COL_ATTR = 'data-essay-col-key'

function toPx(width: number): string {
  return `${Math.round(width)}px`
}

/** 드래그 중 React 리렌더 없이 col/th/td 너비만 동기화 */
export function syncEssayColumnWidthDom(
  tableRoot: HTMLElement,
  colKey: UjatEssayColumnKey,
  width: number
): void {
  const px = toPx(width)
  const headers = tableRoot.querySelectorAll<HTMLElement>(`th[${ESSAY_COL_ATTR}="${colKey}"]`)
  if (headers.length === 0) return

  headers.forEach(th => {
    th.style.width = px
    th.style.minWidth = px
    th.style.maxWidth = px
  })

  const tables = tableRoot.querySelectorAll<HTMLTableElement>('.ant-table table')
  tables.forEach(table => {
    const headerRow = table.querySelector<HTMLTableRowElement>('.ant-table-thead tr')
    if (!headerRow) return
    const th = headerRow.querySelector<HTMLElement>(`th[${ESSAY_COL_ATTR}="${colKey}"]`)
    if (!th) return
    const index = Array.from(headerRow.children).indexOf(th)
    if (index < 0) return

    const col = table.querySelectorAll('colgroup col')[index] as HTMLTableColElement | undefined
    if (col) col.style.width = px

    table.querySelectorAll<HTMLTableRowElement>('.ant-table-tbody tr').forEach(tr => {
      const td = tr.children[index] as HTMLElement | undefined
      if (!td) return
      td.style.width = px
      td.style.minWidth = px
      td.style.maxWidth = px
    })
  })

}

export function clearEssayColumnWidthDom(tableRoot: HTMLElement, colKey: UjatEssayColumnKey): void {
  const clearStyle = (el: HTMLElement) => {
    el.style.width = ''
    el.style.minWidth = ''
    el.style.maxWidth = ''
  }

  tableRoot.querySelectorAll<HTMLElement>(`th[${ESSAY_COL_ATTR}="${colKey}"]`).forEach(clearStyle)
  tableRoot.querySelectorAll<HTMLTableElement>('.ant-table table').forEach(table => {
    const headerRow = table.querySelector<HTMLTableRowElement>('.ant-table-thead tr')
    if (!headerRow) return
    const th = headerRow.querySelector<HTMLElement>(`th[${ESSAY_COL_ATTR}="${colKey}"]`)
    if (!th) return
    const index = Array.from(headerRow.children).indexOf(th)
    if (index < 0) return

    const col = table.querySelectorAll('colgroup col')[index] as HTMLTableColElement | undefined
    if (col) col.style.width = ''

    table.querySelectorAll<HTMLTableRowElement>('.ant-table-tbody tr').forEach(tr => {
      const td = tr.children[index] as HTMLElement | undefined
      if (td) clearStyle(td)
    })
  })
}

export function syncTableScrollWidthDom(
  tableRoot: HTMLElement,
  essayWidths: UjatEssayColumnWidths
): void {
  const minW = computeDocScreeningTableScrollX(essayWidths)
  const wrapW = tableRoot.getBoundingClientRect().width
  const scrollX = Math.max(minW, Math.floor(wrapW))
  const px = toPx(scrollX)

  tableRoot.querySelectorAll<HTMLTableElement>('.ant-table table').forEach(table => {
    table.style.minWidth = px
  })
}

export function getTableWrapElement(ref: RefObject<HTMLElement | null>): HTMLElement | null {
  return ref.current
}
