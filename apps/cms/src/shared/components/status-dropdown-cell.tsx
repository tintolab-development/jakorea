/**
 * 테이블용 상태 드롭다운 셀 (공통)
 * - 여러 테이블에서 재사용: 배지 클릭 시 드롭다운으로 상태 변경
 * - 상태 목록·비활성 규칙·배지 렌더는 props로 주입해 도메인별 확장
 *
 * 다른 테이블에서 사용 시:
 * 1. 컬럼에 className: STATUS_DROPDOWN_CELL_CLASSNAME 지정 (행 높이 고정용)
 * 2. 테이블 CSS에 tr:has(td.status-dropdown-cell__cell-status), tr:has(td .status-dropdown-cell__status-trigger--open) 규칙 추가 (UI shifting 방지)
 * 3. 새 도메인은 renderBadge에 해당 배지 컴포넌트 전달; 드롭다운 내 배지 색상은 status-dropdown-cell.css에 도메인 클래스 추가
 *    (지급 조서 라인: PaymentOrderLineProcessingStatusBadge = TextbookStatusBadge payment-order-line, 신청자 프로그램 승인과 동일 계열)
 * 트리거 래퍼는 CSS에서 불투명 흰 배경 — 테이블 행 hover 시 rgba 배지가 배경색과 섞이지 않도록 함.
 *
 * @example
 * <StatusDropdownCell
 *   status={record.lifecycleStatus}
 *   statusOptions={LIFECYCLE_ORDER}
 *   renderBadge={(s) => <ProgramLifecycleStatusBadge status={s} />}
 *   isItemDisabled={(cur, opt) => cur === opt || ...}
 *   getItemClassName={(opt) => GROUP_START.has(opt) ? 'status-dropdown-cell__dropdown-group-start' : undefined}
 *   onChange={...}
 *   isOpen={openId === record.id}
 *   onOpenChange={(open) => setOpenId(open ? record.id : null)}
 *   isUpdating={...}
 *   emptyPlaceholder="-"
 * />
 */

import { Dropdown } from 'antd'
import type { MenuProps } from 'antd'
import {
  cloneElement,
  isValidElement,
  type CSSProperties,
  type ReactElement,
  type ReactNode,
} from 'react'
import './status-dropdown-cell.css'

/** 테이블 컬럼에 지정할 className — 행 높이 고정 등 레이아웃 스타일 적용용 */
export const STATUS_DROPDOWN_CELL_CLASSNAME = 'status-dropdown-cell__cell-status'

/**
 * 태그 132×33 + 트리거/오버레이 150px(border-box: 8+132+8 + 1px 테두리) — 담당자 권한·강사 역할 열용.
 * `onCell`에 `STATUS_DROPDOWN_CELL_CLASSNAME`과 함께 지정할 것.
 */
export const STATUS_DROPDOWN_CELL_TAG_132_CLASSNAME = 'status-dropdown-cell__cell-status--tag-132'

/** 동일 열 `th`에 지정 — 본문 `td`와 폭·좌우 패딩 맞춰 세로선 정렬 */
export const STATUS_DROPDOWN_CELL_TAG_132_HEADER_CLASSNAME = 'status-dropdown-cell__header--tag-132'

/**
 * 태그 132×33 + 트리거/오버레이 160px(border-box: 1px 테두리 + 가로 패딩 13px + 132 + 13px).
 * 테이블 열 스펙이 160px일 때 `tag132` 대신 사용.
 */
export const STATUS_DROPDOWN_CELL_TAG_160_CLASSNAME = 'status-dropdown-cell__cell-status--tag-160'

/** 동일 열 `th` — `STATUS_DROPDOWN_CELL_TAG_160_CLASSNAME` 과 짝 */
export const STATUS_DROPDOWN_CELL_TAG_160_HEADER_CLASSNAME = 'status-dropdown-cell__header--tag-160'

/**
 * 지급 조서 처리 현황 — 내부 태그 160px, 열·트리거·드롭다운 외곽 176px(패딩 8+태그+8, 기본 136px 규칙과 동일).
 * `onCell` / `onHeaderCell`에 각각 `STATUS_DROPDOWN_CELL_PAYMENT_ORDER_LINE_*` 병기.
 */
export const STATUS_DROPDOWN_CELL_PAYMENT_ORDER_LINE_CLASSNAME =
  'status-dropdown-cell__cell-status--payment-order-line'

export const STATUS_DROPDOWN_CELL_PAYMENT_ORDER_LINE_HEADER_CLASSNAME =
  'status-dropdown-cell__header--payment-order-line'

export interface StatusDropdownCellProps<T extends string = string> {
  /** 현재 상태 (null이면 emptyPlaceholder 표시) */
  status: T | null
  /** 드롭다운에 표시할 상태 목록 (순서 유지) */
  statusOptions: readonly T[]
  /** 각 상태를 배지로 렌더 (테이블/도메인별 배지 컴포넌트 사용) */
  renderBadge: (status: T) => React.ReactNode
  /** 옵션 비활성화 (현재 상태, 옵션) => 선택 불가 시 true */
  isItemDisabled?: (currentStatus: T, optionStatus: T) => boolean
  /** 드롭다운 메뉴 항목에 붙일 className (그룹 구분용 여백 등) */
  getItemClassName?: (optionStatus: T) => string | undefined
  /** 상태 변경 시 호출 (없으면 드롭다운 미표시, 배지만 표시) */
  onChange?: (newStatus: T) => void | Promise<void>
  /** 변경 요청 중 여부 (트리거 비활성 + "…" 표시) */
  isUpdating?: boolean
  /** 드롭다운이 열려 있는지 (테이블에서는 openDropdownId === rowId) */
  isOpen: boolean
  /** 드롭다운 열기/닫기 (테이블에서는 setOpenId(open ? rowId : null)) */
  onOpenChange: (open: boolean) => void
  /** status가 null일 때 표시 (기본 '-') */
  emptyPlaceholder?: React.ReactNode
  /**
   * `tag132`: 내부 태그 132×33, 민트 래퍼·드롭다운 150px(border-box, 가로 패딩 8px).
   * `tag160` / `paymentOrderLine`: 전용 오버레이·트리거 폭 — 셀/헤더에는 각 `STATUS_DROPDOWN_CELL_*_CLASSNAME` 병기.
   * `style`과 병행 가능(배지 폭·패널 변수).
   */
  tagLayout?: 'default' | 'tag132' | 'tag160' | 'paymentOrderLine'
  /**
   * 배지 카드(내부 Tag·`.app-status-badge` 루트)에 적용 — 드롭다운 트리거(흰 래퍼)가 아님.
   * `width`가 있으면 배지 폭에 맞추고, 드롭다운 패널은 트리거와 동일하게 배지+16px(좌우 padding 8px×2).
   */
  style?: CSSProperties
}

const DEFAULT_EMPTY = '-'

const BADGE_CELL_STYLE_CLASS = 'status-dropdown-cell__badge--cell-style'
const TRIGGER_CELL_STYLE_CLASS = 'status-dropdown-cell__trigger--cell-style'
const OVERLAY_CELL_STYLE_CLASS = 'status-dropdown-cell__dropdown-overlay--cell-style'

/** 배지 가로 크기용 변수 — 패널 폭은 CSS에서 `+ 16px`(트리거 좌우 padding 8px×2) */
function overlayStyleFromCellStyle(cellStyle: CSSProperties | undefined): CSSProperties | undefined {
  if (cellStyle?.width == null) return undefined
  const w = cellStyle.width
  const minw = cellStyle.minWidth ?? w
  const maxw = cellStyle.maxWidth ?? w
  return {
    ['--sdcb-overlay-w' as string]: w,
    ['--sdcb-overlay-minw' as string]: minw,
    ['--sdcb-overlay-maxw' as string]: maxw,
  } as CSSProperties
}

/** `renderBadge` 루트 엘리먼트에 `style`·크기용 CSS 변수 병합 (단일 ReactElement일 때) */
function injectBadgeCellStyle(node: ReactNode, cellStyle: CSSProperties | undefined): ReactNode {
  if (cellStyle == null) return node
  if (!isValidElement(node)) {
    return <span style={cellStyle}>{node}</span>
  }

  type BadgeRootProps = { style?: CSSProperties; className?: string }
  const el = node as ReactElement<BadgeRootProps>
  const prevStyle = el.props.style ?? {}
  const prevClass = el.props.className ?? ''

  const nextStyle: Record<string, string | number | undefined> = { ...prevStyle, ...cellStyle }
  if (cellStyle.width != null) {
    const w = cellStyle.width
    nextStyle['--sdcb-badge-w'] = w
    nextStyle['--sdcb-badge-minw'] = (cellStyle.minWidth ?? w) as string | number
    nextStyle['--sdcb-badge-maxw'] = (cellStyle.maxWidth ?? w) as string | number
  }

  return cloneElement(el, {
    className: `${prevClass} ${BADGE_CELL_STYLE_CLASS}`.trim(),
    style: nextStyle as CSSProperties,
  } as Partial<BadgeRootProps>)
}

export function StatusDropdownCell<T extends string = string>({
  status,
  statusOptions,
  renderBadge,
  isItemDisabled,
  getItemClassName,
  onChange,
  isUpdating = false,
  isOpen,
  onOpenChange,
  emptyPlaceholder = DEFAULT_EMPTY,
  tagLayout = 'default',
  style,
}: StatusDropdownCellProps<T>) {
  const menuItems: MenuProps['items'] = statusOptions.map(opt => ({
    key: opt,
    label: (
      <span className="status-dropdown-cell__dropdown-item">
        {injectBadgeCellStyle(renderBadge(opt), style)}
      </span>
    ),
    disabled: status != null && isItemDisabled?.(status, opt),
    className: getItemClassName?.(opt),
  }))

  if (status == null) {
    return (
      <span className="status-dropdown-cell__status-empty" style={style}>
        {emptyPlaceholder}
      </span>
    )
  }

  if (onChange == null) {
    return injectBadgeCellStyle(renderBadge(status), style)
  }

  const overlayClassName = [
    'status-dropdown-cell__dropdown-overlay',
    tagLayout === 'tag132' ? 'status-dropdown-cell__dropdown-overlay--tag-132' : '',
    tagLayout === 'tag160' ? 'status-dropdown-cell__dropdown-overlay--tag-160' : '',
    tagLayout === 'paymentOrderLine'
      ? 'status-dropdown-cell__dropdown-overlay--payment-order-line'
      : '',
    style?.width != null ? OVERLAY_CELL_STYLE_CLASS : '',
  ]
    .filter(Boolean)
    .join(' ')

  const overlayStyle = overlayStyleFromCellStyle(style)

  return (
    <Dropdown
      menu={{
        items: menuItems,
        onClick: ({ key, domEvent }) => {
          // 테이블 행 onClick과 겹침 방지: 메뉴 항목 선택 직후 포털이 닫히며
          // mouseup/click이 아래 행으로 떨어져 상세로 이동하는 경우가 있음
          domEvent.stopPropagation()
          domEvent.preventDefault()
          onChange(key as T)
        },
      }}
      trigger={['click']}
      disabled={isUpdating}
      overlayClassName={overlayClassName}
      overlayStyle={overlayStyle}
      getPopupContainer={() => document.body}
      open={isOpen}
      onOpenChange={onOpenChange}
      popupRender={originNode => (
        <div
          onMouseDown={e => {
            e.preventDefault()
            e.stopPropagation()
          }}
        >
          {originNode}
        </div>
      )}
    >
      <span
        className={`status-dropdown-cell__status-trigger${
          tagLayout === 'tag132' ? ' status-dropdown-cell__status-trigger--tag-132' : ''
        }${tagLayout === 'tag160' ? ' status-dropdown-cell__status-trigger--tag-160' : ''}${
          tagLayout === 'paymentOrderLine' ? ' status-dropdown-cell__status-trigger--payment-order-line' : ''
        }${isOpen ? ' status-dropdown-cell__status-trigger--open' : ''}${
          style != null ? ` ${TRIGGER_CELL_STYLE_CLASS}` : ''
        }`}
        onClick={e => e.stopPropagation()}
      >
        {injectBadgeCellStyle(renderBadge(status), style)}
        {isUpdating ? (
          <span className="status-dropdown-cell__status-updating" aria-hidden>
            …
          </span>
        ) : null}
      </span>
    </Dropdown>
  )
}
