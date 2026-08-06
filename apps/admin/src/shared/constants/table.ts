/**
 * 테이블 컬럼·행 관련 상수 (CMS `apps/cms/src/shared/constants/table.ts` 미러)
 * 스타일 폭은 cms-data-table.css CSS 변수와 일치시킨다.
 */

/** Ant Design Table 컬럼 `className` — No. 열 폭을 CSS와 맞춤 */
export const CMS_TABLE_NO_COL_CLASS = 'cms-table-col--no'

/**
 * 비활성 tbody 행 — `rowClassName` / `onRow.className`
 * 스타일: shared/ui/cms-data-table.css `.cms-data-table__row--disabled`
 */
export const CMS_DATA_TABLE_ROW_DISABLED_CLASS = 'cms-data-table__row--disabled'

export const TABLE_COLUMN_WIDTHS = {
  status: 110,
  date: 120,
  action: 72,
  checkbox: 68,
  index: 80,
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
