/**
 * 위젯 추가 다이얼로그
 */

import { Modal, List, Button, Empty } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { useWidgetEditorStore } from '../model/widget-editor-store'
import { getAvailableWidgets } from '../lib/widget-registry'
import { useAuthStore } from '@/features/auth/model/auth-store'
// uuid 생성 헬퍼
function generateId(): string {
  return crypto.randomUUID()
}

interface WidgetPickerDialogProps {
  open: boolean
  onClose: () => void
}

export function WidgetPickerDialog({ open, onClose }: WidgetPickerDialogProps) {
  const { user } = useAuthStore()
  const { draftState, addWidget } = useWidgetEditorStore()
  
  // 이미 추가된 위젯 키 목록
  const addedWidgetKeys = new Set(draftState.widgets.map(w => w.widgetKey))
  
  // 사용 가능한 위젯 목록 (이미 추가된 것 제외)
  const availableWidgets = getAvailableWidgets(user?.role || null).filter(
    widget => !addedWidgetKeys.has(widget.key)
  )

  const handleAddWidget = (widgetKey: string) => {
    const instanceId = generateId()
    addWidget(widgetKey, instanceId)
    onClose()
  }

  return (
    <Modal
      title="위젯 추가"
      open={open}
      onCancel={onClose}
      footer={null}
      width={600}
    >
      {availableWidgets.length === 0 ? (
        <Empty description="추가할 수 있는 위젯이 없습니다." />
      ) : (
        <List
          dataSource={availableWidgets}
          renderItem={widget => (
            <List.Item
              actions={[
                <Button
                  key="add"
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => handleAddWidget(widget.key)}
                >
                  추가
                </Button>,
              ]}
            >
              <List.Item.Meta title={widget.title} />
            </List.Item>
          )}
        />
      )}
    </Modal>
  )
}
