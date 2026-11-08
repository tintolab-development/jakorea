/**
 * 상태·역할 드롭다운 (공통) — 태그 클릭 시 드롭다운으로 값 변경.
 *
 * - 태그는 이 컴포넌트가 `StatusTag`로 직접 그린다. 호출부는 `getTag`로 라벨·색(tone/accentColor)만 넘긴다.
 * - 태그 크기·색·폰트는 `status-tag.css`, 트리거·패널은 `status-dropdown-cell.css`가 유일한 정본이다.
 *   화면별 CSS로 덮어쓰지 않는다.
 * - 테이블 열에는 `STATUS_DROPDOWN_CELL_CLASSNAME`만 지정한다(상하 패딩 0).
 *
 * @example
 * <StatusDropdownCell
 *   status={record.role}
 *   statusOptions={ROLE_ORDER}
 *   getTag={role => ({ label: ROLE_LABELS[role], tone: role === 'lead' ? 'blue' : 'gray' })}
 *   isItemDisabled={(cur, opt) => cur === opt}
 *   onChange={...}
 *   isOpen={openId === record.id}
 *   onOpenChange={open => setOpenId(open ? record.id : null)}
 * />
 */

import { Dropdown } from 'antd'
import type { MenuProps } from 'antd'
import { useEffect, useId, useState } from 'react'
import { CMS_CALENDAR_PREVIEW_TOOLTIP_Z_INDEX } from '@/shared/constants/modal-z-index'
import { StatusTag, type StatusTagSpec } from './status-tag'
import './status-dropdown-cell.css'

/** 테이블 컬럼(td)에 지정 — 상하 패딩 0·overflow visible */
export const STATUS_DROPDOWN_CELL_CLASSNAME = 'status-dropdown-cell__cell-status'

export interface StatusDropdownCellProps<T extends string = string> {
  /** 현재 값 (null이면 emptyPlaceholder 표시) */
  status: T | null
  /** 드롭다운에 표시할 값 목록 (순서 유지) */
  statusOptions: readonly T[]
  /** 값별 태그 라벨·색 — 크기·폰트는 공통 고정 */
  getTag: (status: T) => StatusTagSpec
  /** 옵션 비활성화 (현재 값, 옵션) => 선택 불가 시 true */
  isItemDisabled?: (currentStatus: T, optionStatus: T) => boolean
  /** true인 옵션 위에 그룹 구분 여백 */
  isGroupStart?: (optionStatus: T) => boolean
  /** 값 변경 시 호출 (없으면 드롭다운 없이 태그만 표시) */
  onChange?: (newStatus: T) => void | Promise<void>
  /** 변경 요청 중 여부 (트리거 비활성 + "…" 표시) */
  isUpdating?: boolean
  /** 드롭다운 열림 여부 (테이블에서는 openDropdownId === rowId) */
  isOpen: boolean
  /** 드롭다운 열기/닫기 */
  onOpenChange: (open: boolean) => void
  /** status가 null일 때 표시 (기본 '-') */
  emptyPlaceholder?: React.ReactNode
}

const DEFAULT_EMPTY = '-'

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

export function StatusDropdownCell<T extends string = string>({
  status,
  statusOptions,
  getTag,
  isItemDisabled,
  isGroupStart,
  onChange,
  isUpdating = false,
  isOpen,
  onOpenChange,
  emptyPlaceholder = DEFAULT_EMPTY,
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

  const renderTag = (value: T) => <StatusTag {...getTag(value)} />

  const menuItems: MenuProps['items'] = statusOptions.map(opt => {
    const isActive = status != null && status === opt
    const extraClass = isGroupStart?.(opt) ? 'status-dropdown-cell__dropdown-group-start' : ''
    return {
      key: opt,
      label: (
        <span
          className={[
            'status-dropdown-cell__dropdown-item',
            isActive ? 'status-dropdown-cell__dropdown-item--active' : '',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          {renderTag(opt)}
        </span>
      ),
      disabled: status != null && isItemDisabled?.(status, opt),
      className: [
        isActive ? 'status-dropdown-cell__menu-item--active' : '',
        extraClass,
      ]
        .filter(Boolean)
        .join(' ') || undefined,
    }
  })

  if (status == null) {
    return (
      <span className="status-dropdown-cell__status-empty">
        {emptyPlaceholder}
      </span>
    )
  }

  const triggerClassName = 'status-dropdown-cell__status-trigger'

  if (onChange == null) {
    return (
      <span className={`${triggerClassName} status-dropdown-cell__status-trigger--readonly`}>
        {renderTag(status)}
      </span>
    )
  }

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
      overlayClassName="status-dropdown-cell__dropdown-overlay"
      overlayStyle={{ zIndex: CMS_CALENDAR_PREVIEW_TOOLTIP_Z_INDEX }}
      getPopupContainer={() => document.body}
      open={controlledOpen}
      destroyOnHidden
      onOpenChange={open => {
        setActiveStatusDropdownCellId(open ? dropdownCellId : null)
        onOpenChange(open)
      }}
      popupRender={originNode => (
        <div
          className="status-dropdown-cell__popup-root"
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
        className={`${triggerClassName}${
          controlledOpen ? ' status-dropdown-cell__status-trigger--open' : ''
        }`}
        // focus 시 조상 overflow 스크롤포트가 scrollIntoView 로 가로 밀림 — mousedown에서 포커스 차단
        onMouseDown={e => {
          e.preventDefault()
          e.stopPropagation()
        }}
        onClick={e => e.stopPropagation()}
      >
        {renderTag(status)}
        {isUpdating ? (
          <span className="status-dropdown-cell__status-updating" aria-hidden>
            …
          </span>
        ) : null}
      </span>
    </Dropdown>
  )
}
