/**
 * 테이블 관련 상수
 * 컬럼 너비, 기본 설정 등
 */

/** Ant Design Table `columns`의 No. 열 — `className`으로 th/td 폭을 CSS와 맞출 때 사용 */
export const CMS_TABLE_NO_COL_CLASS = 'cms-table-col--no'

/** 사용 여부 열 — `className`으로 th/td 폭을 80px 고정 (`cms-data-table.css`) */
export const CMS_TABLE_USAGE_COL_CLASS = 'cms-table-col--usage'

/**
 * 비활성(활동 포기 등) tbody 행 — `rowClassName` / `onRow.className`에 부여.
 * 스타일: shared/ui/cms-data-table.css `.cms-data-table__row--disabled`
 */
export const CMS_DATA_TABLE_ROW_DISABLED_CLASS = 'cms-data-table__row--disabled'

/**
 * 52px 고정 행 + h40(40px) 단일 버튼 셀 — tbody padding 6×12 (8+40+8>52 hover shift 방지).
 * `columns[].onCell` / `onHeaderCell` className에 추가.
 */
export const CMS_DATA_TABLE_CELL_H40_ACTION_CLASS = 'cms-data-table__cell--h40-action'

/** h40 버튼 세로 스택(2개+) — height auto · min-height 52px */
export const CMS_DATA_TABLE_CELL_H40_ACTION_STACK_CLASS = 'cms-data-table__cell--h40-action-stack'

/**
 * 열 종류별 공통 폭 (px) — 같은 종류 열은 화면이 달라도 같은 폭.
 * `CmsDataTable`은 열 `width`를 그대로 쓰고(넓은 화면 균등 분배 없음), 남는 폭은 width 미지정(유연) 열이 흡수한다.
 * 유연 열(일정·제목 등)은 `width` 대신 `minWidth`만 지정.
 */
export const TABLE_COLUMN_WIDTHS = {
  status: 110,
  date: 120,
  action: 72,
  checkbox: 80,
  /** No. 열 — 고정 80px · flex-shrink 0 */
  index: 80,
  /** 사용 여부 열 — 고정 80px */
  usage: 80,
  name: 120,
  email: 200,
  phone: 130,
  id: 100,
  /** 자택 주소지 등 — `시/도 구 도로명 ***` 한 줄 + 좌우 패딩, 넘치면 말줄임 */
  address: 260,
  /** 기관과의 거리 등 짧은 수치 */
  distance: 120,
  /** 기관명·소속·배정 기관 */
  institution: 160,
  /** 학년 */
  grade: 100,
  /** 유연 열(진행 일정 등) 최소 폭 — `minWidth`로 사용 */
  scheduleMin: 360,
} as const

export const TABLE_CONFIG = {
  size: 'middle' as const,
  bordered: false,
} as const
