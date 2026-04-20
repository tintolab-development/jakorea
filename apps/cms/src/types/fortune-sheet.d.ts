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
    /** 2 / `"2"` = 줄바꿈 — 런타임은 문자열로 정규화 */
    tb?: number | string
    mc?: { r: number; c: number; rs?: number; cs?: number }
    /** inlineStr 등 — 줄바꿈(`\\n`) 렌더용 */
    ct?: {
      fa?: string
      t?: string
      s?: Array<{
        v?: string
        fc?: string
        fs?: number
        bl?: number
        [key: string]: unknown
      }>
    }
    /** 폰트 크기(pt) */
    fs?: number
    /** 0 일반, 1 굵게 */
    bl?: number
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
      /** 행 인덱스 문자열 → 픽셀 높이 */
      rowlen?: Record<string, number>
      /** 키 `"r_c"` → `{ r, c, rs, cs }` 병합 영역 */
      merge?: Record<string, { r: number; c: number; rs: number; cs: number }>
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
    /** 미지정 시 라이브러리 기본 열 수(큼)로 컨텍스트가 잡혀 빈 열이 보일 수 있음 */
    column?: number
    row?: number
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
