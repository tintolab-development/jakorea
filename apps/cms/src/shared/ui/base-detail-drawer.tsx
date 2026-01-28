/**
 * 공통 Detail Drawer 컴포넌트
 * Drawer의 공통 패턴을 추상화하여 코드 중복 감소
 */

import { Drawer, Space, Button } from 'antd'
import { EditOutlined, DeleteOutlined } from '@ant-design/icons'
import type { ReactNode } from 'react'

export interface DrawerAction {
  key: string
  label: string
  onClick: () => void
  icon?: ReactNode
  danger?: boolean
  disabled?: boolean
  loading?: boolean
}

export interface BaseDetailDrawerProps {
  open: boolean
  onClose: () => void
  title: string | ReactNode
  loading?: boolean
  width?: number | string
  placement?: 'left' | 'right' | 'top' | 'bottom'
  children: ReactNode
  actions?: DrawerAction[]
  /** 기본 Edit/Delete 액션을 사용할지 여부 */
  showDefaultActions?: boolean
  onEdit?: () => void
  onDelete?: () => void
  /** 액션 버튼 숨김 여부 */
  hideActions?: boolean
  extra?: ReactNode
  zIndex?: number
}

/**
 * 공통 Detail Drawer 컴포넌트
 * 
 * @example
 * ```tsx
 * <BaseDetailDrawer
 *   open={open}
 *   onClose={onClose}
 *   title="프로그램 상세"
 *   loading={loading}
 *   onEdit={handleEdit}
 *   onDelete={handleDelete}
 * >
 *   <Descriptions>
 *     <Descriptions.Item label="이름">{program.name}</Descriptions.Item>
 *   </Descriptions>
 * </BaseDetailDrawer>
 * ```
 */
export function BaseDetailDrawer({
  open,
  onClose,
  title,
  loading = false,
  width = 720,
  placement = 'right',
  children,
  actions,
  showDefaultActions = true,
  onEdit,
  onDelete,
  hideActions = false,
  extra,
  zIndex,
}: BaseDetailDrawerProps) {
  // 기본 액션 구성
  const defaultActions: DrawerAction[] = []
  
  if (showDefaultActions && onEdit) {
    defaultActions.push({
      key: 'edit',
      label: '수정',
      onClick: onEdit,
      icon: <EditOutlined />,
    })
  }

  if (showDefaultActions && onDelete) {
    defaultActions.push({
      key: 'delete',
      label: '삭제',
      onClick: onDelete,
      danger: true,
      icon: <DeleteOutlined />,
    })
  }

  // 커스텀 액션이 있으면 우선 사용, 없으면 기본 액션 사용
  const displayActions = actions || defaultActions

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={title}
      width={width}
      placement={placement}
      loading={loading}
      zIndex={zIndex}
      extra={
        !hideActions && (displayActions.length > 0 || extra) ? (
          <Space>
            {displayActions.map((action) => (
              <Button
                key={action.key}
                onClick={action.onClick}
                danger={action.danger}
                disabled={action.disabled}
                loading={action.loading}
                icon={action.icon}
              >
                {action.label}
              </Button>
            ))}
            {extra}
          </Space>
        ) : extra
      }
    >
      {children}
    </Drawer>
  )
}
