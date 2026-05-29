/**
 * 테이블 관련 상수
 * 컬럼 너비, 기본 설정 등
 */

/** Ant Design Table `columns`의 No. 열 — `className`으로 th/td 폭을 CSS와 맞출 때 사용 */
export const CMS_TABLE_NO_COL_CLASS = 'cms-table-col--no'

/**
 * 비활성(활동 포기 등) tbody 행 — `rowClassName` / `onRow.className`에 부여.
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
    x: 'max-content',
  },
  size: 'middle' as const,
  bordered: false,
} as const
