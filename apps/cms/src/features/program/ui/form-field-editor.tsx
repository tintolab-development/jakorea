/**
 * 템플릿 필드 편집 컴포넌트
 * 프로그램별 신청서 폼 템플릿 커스터마이징 기능
 */

import { useState } from 'react'
import {
  Modal,
  Form,
  Input,
  Select,
  Button,
  Space,
  Table,
  Popconfirm,
  message,
  Typography,
  Switch,
  Card,
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
} from '@ant-design/icons'
import type { FormFieldDef, FormFieldType } from '@/types/form-template'

const { TextArea } = Input
const { Text } = Typography

interface FormFieldEditorProps {
  open: boolean
  fields: FormFieldDef[]
  onSave: (fields: FormFieldDef[]) => void
  onCancel: () => void
}

const fieldTypeOptions: { value: FormFieldType; label: string }[] = [
  { value: 'text', label: '텍스트' },
  { value: 'textarea', label: '텍스트 영역' },
  { value: 'number', label: '숫자' },
  { value: 'select', label: '선택' },
  { value: 'checkbox', label: '체크박스' },
  { value: 'date', label: '날짜' },
  { value: 'file', label: '파일' },
]

interface FieldRowProps {
  field: FormFieldDef
  index: number
  totalFields: number
  onEdit: (index: number) => void
  onDelete: (index: number) => void
  onMoveUp: (index: number) => void
  onMoveDown: (index: number) => void
}

function FieldRow({
  field,
  index,
  totalFields,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
}: FieldRowProps) {
  return (
    <tr>
      <td style={{ padding: '8px' }}>
        <Space>
          <Button
            type="text"
            size="small"
            icon={<ArrowUpOutlined />}
            onClick={() => onMoveUp(index)}
            disabled={index === 0}
          />
          <Button
            type="text"
            size="small"
            icon={<ArrowDownOutlined />}
            onClick={() => onMoveDown(index)}
            disabled={index === totalFields - 1}
          />
        </Space>
      </td>
      <td>{field.label || '(필드명 없음)'}</td>
      <td>{fieldTypeOptions.find(opt => opt.value === field.type)?.label || field.type}</td>
      <td>{field.required ? '필수' : '선택'}</td>
      <td>
        <Space>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => onEdit(index)}>
            수정
          </Button>
          <Popconfirm
            title="이 필드를 삭제하시겠습니까?"
            onConfirm={() => onDelete(index)}
            okText="삭제"
            cancelText="취소"
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              삭제
            </Button>
          </Popconfirm>
        </Space>
      </td>
    </tr>
  )
}

export function FormFieldEditor({
  open,
  fields: initialFields,
  onSave,
  onCancel,
}: FormFieldEditorProps) {
  const [fields, setFields] = useState<FormFieldDef[]>(initialFields)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [fieldForm] = Form.useForm()

  const handleAdd = () => {
    const newField: FormFieldDef = {
      id: `field-${Date.now()}`,
      label: '',
      type: 'text',
      required: false,
    }
    setFields([...fields, newField])
    setEditingIndex(fields.length)
    fieldForm.setFieldsValue(newField)
  }

  const handleEdit = (index: number) => {
    setEditingIndex(index)
    fieldForm.setFieldsValue(fields[index])
  }

  const handleSaveField = () => {
    fieldForm.validateFields().then(values => {
      if (editingIndex === null) return

      const updatedFields = [...fields]
      if (editingIndex >= fields.length) {
        // 새 필드 추가
        updatedFields.push(values as FormFieldDef)
      } else {
        // 기존 필드 수정
        updatedFields[editingIndex] = { ...updatedFields[editingIndex], ...values }
      }

      setFields(updatedFields)
      setEditingIndex(null)
      fieldForm.resetFields()
    })
  }

  const handleDelete = (index: number) => {
    const updatedFields = fields.filter((_, i) => i !== index)
    setFields(updatedFields)
    if (editingIndex === index) {
      setEditingIndex(null)
      fieldForm.resetFields()
    }
  }

  const handleMoveUp = (index: number) => {
    if (index === 0) return
    const newFields = [...fields]
    ;[newFields[index - 1], newFields[index]] = [newFields[index], newFields[index - 1]]
    setFields(newFields)
  }

  const handleMoveDown = (index: number) => {
    if (index === fields.length - 1) return
    const newFields = [...fields]
    ;[newFields[index], newFields[index + 1]] = [newFields[index + 1], newFields[index]]
    setFields(newFields)
  }

  const handleSave = () => {
    onSave(fields)
    message.success('필드가 저장되었습니다')
  }

  const handleCancel = () => {
    setFields(initialFields)
    setEditingIndex(null)
    fieldForm.resetFields()
    onCancel()
  }

  const columns = [
    {
      title: '순서',
      key: 'order',
      width: 80,
    },
    {
      title: '필드명',
      dataIndex: 'label',
      key: 'label',
    },
    {
      title: '타입',
      dataIndex: 'type',
      key: 'type',
      width: 120,
    },
    {
      title: '필수',
      dataIndex: 'required',
      key: 'required',
      width: 80,
    },
    {
      title: '작업',
      key: 'actions',
      width: 150,
    },
  ]

  return (
    <Modal
      title="신청서 폼 필드 커스터마이징"
      open={open}
      onCancel={handleCancel}
      width={900}
      footer={[
        <Button key="cancel" onClick={handleCancel}>
          취소
        </Button>,
        <Button key="save" type="primary" onClick={handleSave}>
          저장
        </Button>,
      ]}
    >
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <div>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAdd}
            style={{ marginBottom: 16 }}
          >
            필드 추가
          </Button>
        </div>

        {editingIndex !== null && (
          <Card title={editingIndex >= fields.length ? '필드 추가' : '필드 수정'}>
            <Form form={fieldForm} layout="vertical" onFinish={handleSaveField}>
              <Form.Item
                name="label"
                label="필드명"
                rules={[{ required: true, message: '필드명을 입력해주세요' }]}
              >
                <Input placeholder="예: 참가 목적" />
              </Form.Item>

              <Form.Item
                name="type"
                label="필드 타입"
                rules={[{ required: true, message: '필드 타입을 선택해주세요' }]}
              >
                <Select options={fieldTypeOptions} />
              </Form.Item>

              <Form.Item name="required" label="필수 여부" valuePropName="checked">
                <Switch />
              </Form.Item>

              <Form.Item name="placeholder" label="플레이스홀더">
                <Input placeholder="입력 안내 문구" />
              </Form.Item>

              <Form.Item
                noStyle
                shouldUpdate={(prevValues, currentValues) => prevValues.type !== currentValues.type}
              >
                {({ getFieldValue }) => {
                  const fieldType = getFieldValue('type')
                  if (fieldType === 'select') {
                    return (
                      <Form.Item
                        name="options"
                        label="선택 옵션"
                        rules={[{ required: true, message: '옵션을 입력해주세요' }]}
                        getValueFromEvent={e => {
                          const lines = e.target.value.split('\n').filter((l: string) => l.trim())
                          return lines.map((line: string, idx: number) => ({
                            value: `option-${idx}`,
                            label: line.trim(),
                          }))
                        }}
                        getValueProps={value => {
                          if (!value || !Array.isArray(value)) return { value: '' }
                          return {
                            value: value.map((opt: { label: string }) => opt.label).join('\n'),
                          }
                        }}
                      >
                        <TextArea
                          placeholder="각 줄에 하나씩 입력하세요.&#10;예:&#10;옵션1&#10;옵션2"
                          rows={4}
                        />
                      </Form.Item>
                    )
                  }
                  if (fieldType === 'file') {
                    return (
                      <>
                        <Form.Item name="fileAccept" label="허용 파일 형식">
                          <Input placeholder="예: .pdf,.docx 또는 image/*" />
                        </Form.Item>
                        <Form.Item
                          name="fileMaxSize"
                          label="최대 파일 크기 (MB)"
                          getValueFromEvent={e => {
                            const value = e.target.value
                            return value ? Number(value) * 1024 * 1024 : undefined
                          }}
                          getValueProps={value => {
                            return { value: value ? (value / (1024 * 1024)).toString() : '' }
                          }}
                        >
                          <Input type="number" placeholder="5" />
                        </Form.Item>
                      </>
                    )
                  }
                  return null
                }}
              </Form.Item>

              <Form.Item>
                <Space>
                  <Button type="primary" htmlType="submit">
                    {editingIndex >= fields.length ? '추가' : '수정'}
                  </Button>
                  <Button
                    onClick={() => {
                      setEditingIndex(null)
                      fieldForm.resetFields()
                    }}
                  >
                    취소
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </Card>
        )}

        <Card title="필드 목록">
          {fields.length === 0 ? (
            <Text type="secondary">
              추가된 필드가 없습니다. 위의 "필드 추가" 버튼을 클릭하여 필드를 추가하세요.
            </Text>
          ) : (
            <Table
              dataSource={fields}
              columns={columns}
              rowKey="id"
              pagination={false}
              components={{
                body: {
                  row: (props: any) => {
                    const index = fields.findIndex(f => f.id === props['data-row-key'])
                    return (
                      <FieldRow
                        field={fields[index]}
                        index={index}
                        totalFields={fields.length}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onMoveUp={handleMoveUp}
                        onMoveDown={handleMoveDown}
                      />
                    )
                  },
                },
              }}
            />
          )}
        </Card>
      </Space>
    </Modal>
  )
}
