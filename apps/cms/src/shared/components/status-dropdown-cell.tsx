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
   * 셀에 `STATUS_DROPDOWN_CELL_TAG_132_CLASSNAME`, 헤더에 `STATUS_DROPDOWN_CELL_TAG_132_HEADER_CLASSNAME`을 붙일 것.
   */
  tagLayout?: 'default' | 'tag132'
}

const DEFAULT_EMPTY = '-'

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
}: StatusDropdownCellProps<T>) {
  const menuItems: MenuProps['items'] = statusOptions.map(opt => ({
    key: opt,
    label: (
      <span className="status-dropdown-cell__dropdown-item">{renderBadge(opt)}</span>
    ),
    disabled: status != null && isItemDisabled?.(status, opt),
    className: getItemClassName?.(opt),
  }))

  if (status == null) {
    return (
      <span className="status-dropdown-cell__status-empty">{emptyPlaceholder}</span>
    )
  }

  if (onChange == null) {
    return <>{renderBadge(status)}</>
  }

  return (
    <Dropdown
      menu={{
        items: menuItems,
        onClick: ({ key }) => onChange(key as T),
      }}
      trigger={['click']}
      disabled={isUpdating}
      overlayClassName={
        tagLayout === 'tag132'
          ? 'status-dropdown-cell__dropdown-overlay status-dropdown-cell__dropdown-overlay--tag-132'
          : 'status-dropdown-cell__dropdown-overlay'
      }
      getPopupContainer={() => document.body}
      open={isOpen}
      onOpenChange={onOpenChange}
    >
      <span
        className={`status-dropdown-cell__status-trigger${tagLayout === 'tag132' ? ' status-dropdown-cell__status-trigger--tag-132' : ''}${isOpen ? ' status-dropdown-cell__status-trigger--open' : ''}`}
        onClick={e => e.stopPropagation()}
      >
        {renderBadge(status)}
        {isUpdating ? (
          <span className="status-dropdown-cell__status-updating"> …</span>
        ) : null}
      </span>
    </Dropdown>
  )
}
