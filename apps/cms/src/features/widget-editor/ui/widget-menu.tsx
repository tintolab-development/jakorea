/**
 * 위젯 메뉴 컴포넌트 (⋯ 메뉴)
 */

import { Dropdown, Button } from 'antd'
import type { MenuProps } from 'antd'
import { MoreOutlined } from '@ant-design/icons'
import { useWidgetEditorStore } from '../model/widget-editor-store'
import { getWidgetDefinition } from '../lib/widget-registry'
import type { WidgetInstance } from '../model/widget-types'

interface WidgetMenuProps {
  widgetInstance: WidgetInstance
}

export function WidgetMenu({ widgetInstance }: WidgetMenuProps) {
  const { removeWidget, toggleWidgetSize } = useWidgetEditorStore()
  const widgetDef = getWidgetDefinition(widgetInstance.widgetKey)

  if (!widgetDef) {
    return null
  }

  const menuItems: MenuProps['items'] = []

  // 크기 조정 메뉴 (지원하는 위젯만)
  if (widgetDef.supportsSize) {
    const sizeLabel = widgetInstance.size === 'small' ? '위젯 크게' : '위젯 작게'
    menuItems.push({
      key: 'toggle-size',
      label: sizeLabel,
      onClick: () => {
        toggleWidgetSize(widgetInstance.id)
      },
    })
  }

  // 위젯 제거 메뉴
  menuItems.push({
    key: 'remove',
    label: '위젯 제거',
    danger: true,
    onClick: () => {
      removeWidget(widgetInstance.id)
    },
  })

  return (
    <Dropdown menu={{ items: menuItems }} trigger={['click']}>
      <Button
        type="text"
        icon={<MoreOutlined />}
        size="small"
        className="widget-menu-button"
        onClick={e => e.stopPropagation()}
      />
    </Dropdown>
  )
}
