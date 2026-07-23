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
 * 4. 교재명 등 인라인 tag100은 STATUS_DROPDOWN_CELL_INLINE_TAG100_CLASSNAME 셸 + tagLayout="tag100"
 *    (레이아웃 폭 116px 고정 — 열림 시 테이블 가로 확장 방지). 재직 등 밀착형은 chrome="hug".
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
  useEffect,
  useId,
  useState,
  type CSSProperties,
  type ReactElement,
  type ReactNode,
} from 'react'
import './status-dropdown-cell.css'

/** 테이블 컬럼에 지정할 className — 행 높이 고정 등 레이아웃 스타일 적용용 */
export const STATUS_DROPDOWN_CELL_CLASSNAME = 'status-dropdown-cell__cell-status'

/**
 * 태그 132×33 + 트리거/오버레이 160px(border-box: 1px 테두리 + 가로 패딩 13px + 132 + 13px).
 * 테이블 열 스펙이 160px일 때 사용.
 */
export const STATUS_DROPDOWN_CELL_TAG_160_CLASSNAME = 'status-dropdown-cell__cell-status--tag-160'

/** 동일 열 `th` — `STATUS_DROPDOWN_CELL_TAG_160_CLASSNAME` 과 짝 */
export const STATUS_DROPDOWN_CELL_TAG_160_HEADER_CLASSNAME = 'status-dropdown-cell__header--tag-160'

/**
 * 편집 가능 상태 배지 100×32 + 트리거/오버레이 116px(border-box: 1 + 7 + 100 + 7 + 1).
 * 재직·권한·교재배송·서류평가 시안 4종용.
 */
export const STATUS_DROPDOWN_CELL_TAG_100_CLASSNAME = 'status-dropdown-cell__cell-status--tag-100'

/** 동일 열 `th` — `STATUS_DROPDOWN_CELL_TAG_100_CLASSNAME` 과 짝 */
export const STATUS_DROPDOWN_CELL_TAG_100_HEADER_CLASSNAME = 'status-dropdown-cell__header--tag-100'

/**
 * 교재명 등 인라인 tag100 — 항상 116×48 예약.
 * 열림 크롬/그림자가 테이블·flex 조상을 가로로 키우지 않도록 셸로 격리할 때 사용.
 */
export const STATUS_DROPDOWN_CELL_INLINE_TAG100_CLASSNAME = 'status-dropdown-cell__inline-tag100'

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
   * `tag100`: 편집 가능 상태 배지 100×32 — 트리거/오버레이 116px.
   * `tag160` / `paymentOrderLine`: 전용 오버레이·트리거 폭 — 셀/헤더에는 각 `STATUS_DROPDOWN_CELL_*_CLASSNAME` 병기.
   * `style`과 병행 가능(배지 폭·패널 변수).
   */
  tagLayout?: 'default' | 'tag100' | 'tag160' | 'paymentOrderLine'
  /**
   * `cell`(기본): 테이블 열용 패딩 크롬(tag100=116px 등).
   * `hug`: 폼·상세 인라인 — 배지·패널 밀착(padding 0). 열림 시 가로 UI shifting 방지.
   */
  chrome?: 'cell' | 'hug'
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

let activeStatusDropdownCellId: string | null = null
const activeStatusDropdownListeners = new Set<() => void>()

function setActiveStatusDropdownCellId(id: string | null) {
  activeStatusDropdownCellId = id
  activeStatusDropdownListeners.forEach(listener => listener())
}

function subscribeActiveStatusDropdown(listener: () => void): () => void {
  activeStatusDropdownListeners.add(listener)
  return () => activeStatusDropdownListeners.delete(listener)
}

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
  chrome = 'cell',
  style,
}: StatusDropdownCellProps<T>) {
  const dropdownCellId = useId()
  const [activeDropdownVersion, setActiveDropdownVersion] = useState(0)
  const isActiveDropdown = activeStatusDropdownCellId === dropdownCellId
  const controlledOpen = isOpen && isActiveDropdown

  useEffect(() => {
    return subscribeActiveStatusDropdown(() => setActiveDropdownVersion(v => v + 1))
  }, [])

  useEffect(() => {
    if (!isOpen || isActiveDropdown) return
    onOpenChange(false)
  }, [isOpen, isActiveDropdown, onOpenChange, activeDropdownVersion])

  useEffect(() => {
    if (!isOpen || activeStatusDropdownCellId === dropdownCellId) return
    setActiveStatusDropdownCellId(dropdownCellId)
  }, [dropdownCellId, isOpen])

  useEffect(
    () => () => {
      if (activeStatusDropdownCellId === dropdownCellId) {
        setActiveStatusDropdownCellId(null)
      }
    },
    [dropdownCellId]
  )

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

  // hug: 트리거·패널 모두 배지 밀착. cell: tagLayout 고정폭 패널.
  const overlayClassName = [
    'status-dropdown-cell__dropdown-overlay',
    chrome === 'hug'
      ? 'status-dropdown-cell__dropdown-overlay--hug'
      : tagLayout === 'tag100'
        ? 'status-dropdown-cell__dropdown-overlay--tag-100'
        : '',
    chrome === 'cell' && tagLayout === 'tag160'
      ? 'status-dropdown-cell__dropdown-overlay--tag-160'
      : '',
    chrome === 'cell' && tagLayout === 'paymentOrderLine'
      ? 'status-dropdown-cell__dropdown-overlay--payment-order-line'
      : '',
    chrome === 'cell' && style?.width != null ? OVERLAY_CELL_STYLE_CLASS : '',
  ]
    .filter(Boolean)
    .join(' ')

  const overlayStyle = overlayStyleFromCellStyle(style)

  const triggerLayoutClass =
    chrome === 'hug'
      ? ''
      : tagLayout === 'tag100'
        ? ' status-dropdown-cell__status-trigger--tag-100'
        : tagLayout === 'tag160'
          ? ' status-dropdown-cell__status-trigger--tag-160'
          : tagLayout === 'paymentOrderLine'
            ? ' status-dropdown-cell__status-trigger--payment-order-line'
            : ''

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
          if (activeStatusDropdownCellId === dropdownCellId) {
            setActiveStatusDropdownCellId(null)
          }
          onOpenChange?.(false)
        },
      }}
      trigger={['click']}
      placement="bottomCenter"
      disabled={isUpdating}
      overlayClassName={overlayClassName}
      overlayStyle={overlayStyle}
      getPopupContainer={() => document.body}
      open={controlledOpen}
      destroyOnHidden
      onOpenChange={open => {
        setActiveStatusDropdownCellId(open ? dropdownCellId : null)
        onOpenChange(open)
      }}
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
        className={`status-dropdown-cell__status-trigger${triggerLayoutClass}${
          chrome === 'hug' ? ' status-dropdown-cell__status-trigger--hug' : ''
        }${controlledOpen ? ' status-dropdown-cell__status-trigger--open' : ''}${
          style != null ? ` ${TRIGGER_CELL_STYLE_CLASS}` : ''
        }`}
        style={overlayStyle}
        // focus 시 조상 overflow 스크롤포트가 scrollIntoView 로 가로 밀림 — mousedown에서 포커스 차단
        onMouseDown={e => {
          e.preventDefault()
          e.stopPropagation()
        }}
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
