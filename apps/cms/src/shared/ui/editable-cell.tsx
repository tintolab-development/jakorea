/**
 * 인라인 편집 가능한 테이블 셀 컴포넌트
 * 테이블 행에서 직접 수정 가능한 필드에 사용
 */

import { useState, useEffect, useRef } from 'react'
import { Input, Select, Button, Space } from 'antd'
import { CheckOutlined, CloseOutlined, EditOutlined } from '@ant-design/icons'
import type { InputRef } from 'antd'

const { TextArea } = Input

interface EditableCellProps {
  value: string | number | undefined
  type?: 'text' | 'textarea' | 'select'
  options?: { value: string; label: string }[]
  onSave: (value: string | number) => Promise<void> | void
  placeholder?: string
  disabled?: boolean
}

export function EditableCell({
  value: initialValue,
  type = 'text',
  options,
  onSave,
  placeholder,
  disabled = false,
}: EditableCellProps) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState<string | number>(initialValue || '')
  const [saving, setSaving] = useState(false)
  const inputRef = useRef<InputRef>(null)

  useEffect(() => {
    setValue(initialValue || '')
  }, [initialValue])

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus()
    }
  }, [editing])

  const handleSave = async () => {
    try {
      setSaving(true)
      await onSave(value)
      setEditing(false)
    } catch (error) {
      console.error('Failed to save:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setValue(initialValue || '')
    setEditing(false)
  }

  if (disabled) {
    return <span>{value || '-'}</span>
  }

  if (!editing) {
    return (
      <Space>
        <span style={{ cursor: 'pointer' }} onClick={() => setEditing(true)}>
          {value || <span style={{ color: '#999' }}>{placeholder || '클릭하여 수정'}</span>}
        </span>
        <Button
          type="text"
          size="small"
          icon={<EditOutlined />}
          onClick={() => setEditing(true)}
          style={{ opacity: 0.6 }}
        />
      </Space>
    )
  }

  return (
    <Space.Compact style={{ width: '100%' }}>
      {type === 'text' && (
        <Input
          ref={inputRef}
          value={value}
          onChange={e => setValue(e.target.value)}
          onPressEnter={handleSave}
          onBlur={handleSave}
          placeholder={placeholder}
          disabled={saving}
        />
      )}
      {type === 'textarea' && (
        <TextArea
          value={value}
          onChange={e => setValue(e.target.value)}
          placeholder={placeholder}
          rows={2}
          disabled={saving}
          autoSize={{ minRows: 2, maxRows: 4 }}
        />
      )}
      {type === 'select' && options && (
        <Select
          value={value}
          onChange={v => setValue(v)}
          options={options}
          style={{ width: '100%' }}
          disabled={saving}
          autoFocus
        />
      )}
      <Button
        type="primary"
        size="small"
        icon={<CheckOutlined />}
        onClick={handleSave}
        loading={saving}
      />
      <Button size="small" icon={<CloseOutlined />} onClick={handleCancel} disabled={saving} />
    </Space.Compact>
  )
}
