/**
 * 수료증 텍스트 필드 편집 컴포넌트
 */

import { useState, useCallback } from 'react'
import { Input, InputNumber, Button, Space, ColorPicker, Select } from 'antd'
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons'
import type { CertificateTextField } from '@/types/template'

export interface CertificateTextFieldsEditorProps {
  value?: CertificateTextField[]
  onChange?: (fields: CertificateTextField[]) => void
  disabled?: boolean
}

const defaultFontSizes = [12, 14, 16, 18, 20, 24, 28, 32, 36, 40, 48]

export function CertificateTextFieldsEditor({
  value = [],
  onChange,
  disabled = false,
}: CertificateTextFieldsEditorProps) {
  const [fields, setFields] = useState<CertificateTextField[]>(value)

  const handleAddField = useCallback(() => {
    const newField: CertificateTextField = {
      id: `field-${Date.now()}`,
      label: '새 필드',
      key: `field${fields.length + 1}`,
      x: 100,
      y: 100,
      fontSize: 24,
      color: '#000000',
      align: 'left',
      fontFamily: 'Arial',
    }
    const newFields = [...fields, newField]
    setFields(newFields)
    onChange?.(newFields)
  }, [fields, onChange])

  const handleRemoveField = useCallback(
    (id: string) => {
      const newFields = fields.filter(f => f.id !== id)
      setFields(newFields)
      onChange?.(newFields)
    },
    [fields, onChange]
  )

  const handleFieldChange = useCallback(
    (id: string, updates: Partial<CertificateTextField>) => {
      const newFields = fields.map(f => (f.id === id ? { ...f, ...updates } : f))
      setFields(newFields)
      onChange?.(newFields)
    },
    [fields, onChange]
  )

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      {fields.map(field => (
        <div
          key={field.id}
          style={{
            padding: 16,
            border: '1px solid #d9d9d9',
            borderRadius: 4,
            backgroundColor: '#fafafa',
          }}
        >
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            <Space style={{ width: '100%', justifyContent: 'space-between' }}>
              <Input
                value={field.label}
                onChange={e => handleFieldChange(field.id, { label: e.target.value })}
                placeholder="필드 라벨"
                disabled={disabled}
                style={{ flex: 1 }}
              />
              <Button
                icon={<DeleteOutlined />}
                danger
                onClick={() => handleRemoveField(field.id)}
                disabled={disabled}
              />
            </Space>

            <Input
              value={field.key}
              onChange={e => handleFieldChange(field.id, { key: e.target.value })}
              placeholder="변수 키 (예: recipientName)"
              disabled={disabled}
            />

            <Space>
              <span style={{ width: 60 }}>X:</span>
              <InputNumber
                value={field.x}
                onChange={val => handleFieldChange(field.id, { x: val ?? 0 })}
                min={0}
                disabled={disabled}
                style={{ width: 100 }}
              />
              <span style={{ width: 60 }}>Y:</span>
              <InputNumber
                value={field.y}
                onChange={val => handleFieldChange(field.id, { y: val ?? 0 })}
                min={0}
                disabled={disabled}
                style={{ width: 100 }}
              />
            </Space>

            <Space>
              <span style={{ width: 80 }}>폰트 크기:</span>
              <Select
                value={field.fontSize}
                onChange={val => handleFieldChange(field.id, { fontSize: val })}
                options={defaultFontSizes.map(size => ({ value: size, label: `${size}px` }))}
                disabled={disabled}
                style={{ width: 120 }}
              />
              <span style={{ width: 40 }}>색상:</span>
              <ColorPicker
                value={field.color}
                onChange={color => handleFieldChange(field.id, { color: color.toHexString() })}
                disabled={disabled}
                showText
              />
              <span style={{ width: 40 }}>정렬:</span>
              <Select
                value={field.align}
                onChange={val => handleFieldChange(field.id, { align: val })}
                options={[
                  { value: 'left', label: '왼쪽' },
                  { value: 'center', label: '가운데' },
                  { value: 'right', label: '오른쪽' },
                ]}
                disabled={disabled}
                style={{ width: 100 }}
              />
            </Space>
          </Space>
        </div>
      ))}

      <Button
        type="dashed"
        icon={<PlusOutlined />}
        onClick={handleAddField}
        disabled={disabled}
        block
      >
        텍스트 필드 추가
      </Button>
    </Space>
  )
}
