/**
 * 테이블 컬럼·행 관련 상수
 * 스타일 폭은 cms-data-table.css CSS 변수와 일치시킨다.
 *
 * 공통 고정 열 (시안·화면 공통):
 * - 체크박스 60 · 순서 80 · No. 80 · 사용 여부 100
 */

/** Ant Design Table 컬럼 `className` — No. 열 폭을 CSS와 맞춤 */
export const CMS_TABLE_NO_COL_CLASS = 'cms-table-col--no'

/** 사용 여부(Switch) 열 폭을 CSS와 맞춤 */
export const CMS_TABLE_USAGE_COL_CLASS = 'cms-table-col--usage'

/** 순서(드래그 핸들) 열 폭을 CSS와 맞춤 */
export const CMS_TABLE_SORT_COL_CLASS = 'cms-table-col--sort'

/**
 * 비활성 tbody 행 — `rowClassName` / `onRow.className`
 * 스타일: shared/ui/cms-data-table.css `.cms-data-table__row--disabled`
 */
export const CMS_DATA_TABLE_ROW_DISABLED_CLASS = 'cms-data-table__row--disabled'

export const TABLE_COLUMN_WIDTHS = {
  status: 110,
  date: 120,
  action: 72,
  /** 행 선택 체크박스 열 */
  checkbox: 60,
  /** 순서(드래그) 열 */
  sort: 80,
  /** No. 열 */
  index: 80,
  /** 사용 여부 열 (Switch) */
  usage: 100,
  name: 120,
  email: 200,
  phone: 130,
  id: 100,
} as const

export const TABLE_CONFIG = {
  scroll: {
    x: 'max-content' as const,
  },
  size: 'middle' as const,
  bordered: false,
} as const
