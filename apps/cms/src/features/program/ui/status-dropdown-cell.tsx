/**
 * 테이블 셀 내 상태 드롭다운 공통 컴포넌트
 * - 클릭 시 Dropdown으로 상태 변경
 * - 행 클릭(상세 모달) 이벤트와 충돌 방지 (stopPropagation)
 */

import { Dropdown } from 'antd'
import type { MenuProps } from 'antd'

interface StatusDropdownCellProps<T extends string> {
  status: T
  statusKeys: T[]
  renderBadge: (status: T) => React.ReactNode
  onChange: (status: T) => void
  cellClassName: string
  triggerClassName: string
}

export function StatusDropdownCell<T extends string>({
  status,
  statusKeys,
  renderBadge,
  onChange,
  cellClassName,
  triggerClassName,
}: StatusDropdownCellProps<T>) {
  const items = statusKeys.map(key => ({
    key,
    label: renderBadge(key),
    onClick: ({ domEvent }: { domEvent?: { stopPropagation?: () => void } }) => {
      domEvent?.stopPropagation?.()
      onChange(key)
    },
  })) as MenuProps['items']

  return (
    <div className={cellClassName} onClick={e => e.stopPropagation()}>
      <Dropdown menu={{ items }} trigger={['click']} getPopupContainer={() => document.body}>
        <span className={triggerClassName} onClick={e => e.stopPropagation()}>
          {renderBadge(status)}
        </span>
      </Dropdown>
    </div>
  )
}
