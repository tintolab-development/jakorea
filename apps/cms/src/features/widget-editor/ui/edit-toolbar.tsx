/**
 * 편집 모드 툴바
 */

import { Button, Space } from 'antd'
import { EditOutlined, SaveOutlined, CloseOutlined, PlusOutlined } from '@ant-design/icons'
import { useWidgetEditorStore } from '../model/widget-editor-store'
import { WidgetPickerDialog } from './widget-picker-dialog'
import { useState } from 'react'

export function EditToolbar() {
  const { editMode, isDirty, setEditMode, saveChanges, cancelChanges } = useWidgetEditorStore()
  const [pickerOpen, setPickerOpen] = useState(false)

  const handleEdit = () => {
    setEditMode(true)
  }

  const handleSave = () => {
    saveChanges()
  }

  const handleCancel = () => {
    cancelChanges()
  }

  if (editMode) {
    return (
      <>
        <Space>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setPickerOpen(true)}
          >
            위젯 추가
          </Button>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            onClick={handleSave}
            disabled={!isDirty}
          >
            저장
          </Button>
          <Button icon={<CloseOutlined />} onClick={handleCancel}>
            취소
          </Button>
        </Space>
        <WidgetPickerDialog open={pickerOpen} onClose={() => setPickerOpen(false)} />
      </>
    )
  }

  return (
    <Button type="primary" icon={<EditOutlined />} onClick={handleEdit}>
      대시보드 설정
    </Button>
  )
}
