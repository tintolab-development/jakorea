/**
 * @fortune-sheet 패키지는 설치 환경에 따라 타입 엔트리가 없을 수 있어
 * 대량이체 미리보기·시트 빌더에서 쓰는 최소 형태만 선언합니다.
 */
declare module '@fortune-sheet/core' {
  export interface Cell {
    v?: string | number
    m?: string | number
    bg?: string
    fc?: string
    ht?: number
    vt?: number
    [key: string]: unknown
  }

  export interface CellWithRowAndCol {
    r: number
    c: number
    v: Cell
  }

  export interface Sheet {
    name?: string
    status?: number
    order?: number
    row?: number
    column?: number
    defaultRowHeight?: number
    defaultColWidth?: number
    celldata?: CellWithRowAndCol[]
    config?: {
      columnlen?: Record<string, number>
      authority?: Record<string, unknown>
      [key: string]: unknown
    }
    frozen?: {
      type?: string
      range?: { row_focus?: number; column_focus?: number }
      [key: string]: unknown
    }
    showGridLines?: number
    [key: string]: unknown
  }
}

declare module '@fortune-sheet/react' {
  import type { ComponentType } from 'react'

  export interface WorkbookProps {
    data?: import('@fortune-sheet/core').Sheet[]
    showToolbar?: boolean
    showFormulaBar?: boolean
    showSheetTabs?: boolean
    allowEdit?: boolean
    addRows?: number
    [key: string]: unknown
  }

  export const Workbook: ComponentType<WorkbookProps>
}
