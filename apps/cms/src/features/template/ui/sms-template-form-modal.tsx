import { Button, Card, Col, Divider, Form, Input, Modal, Row, Select, Space, Typography } from 'antd'
import type { SmsTemplate } from '@/types/template'
import { audienceOptions, defaultSampleValues } from '../constants'
import { useClipboard } from '../hooks/use-clipboard'
import { applyTemplateVariables, estimateMessageBytes, extractTemplateVariables } from '@/data/mock/templates'
import { useEffect, useMemo } from 'react'
import { LAYOUT_CONSTANTS } from '@/shared/constants'

const { Text } = Typography

function getMessageType(bytes: number) {
  return bytes <= 90 ? 'SMS(단문)' : 'LMS(장문)'
}

interface SmsTemplateFormModalProps {
  open: boolean
  editing: SmsTemplate | null
  onCancel: () => void
  onSubmit: (values: {
    title: string
    description?: string
    tags: string[]
    audience: string[]
    status: string
    text: string
  }) => void
}

export function SmsTemplateFormModal({
  open,
  editing,
  onCancel,
  onSubmit,
}: SmsTemplateFormModalProps) {
  const [form] = Form.useForm()
  const { copyText } = useClipboard()

  const watchedText = Form.useWatch('text', form) || ''
  const watchedVars = useMemo(() => extractTemplateVariables(watchedText), [watchedText])
  const previewText = useMemo(() => applyTemplateVariables(watchedText, defaultSampleValues), [watchedText])
  const previewBytes = useMemo(() => estimateMessageBytes(previewText), [previewText])

  useEffect(() => {
    if (open) {
      if (editing) {
        form.setFieldsValue({
          title: editing.title,
          description: editing.description,
          tags: editing.tags,
          audience: editing.audience,
          status: editing.status,
          text: editing.content.text,
        })
      } else {
        form.resetFields()
        form.setFieldsValue({
          status: 'draft',
          audience: ['INDIVIDUAL'],
          tags: [],
          text: '안녕하세요 {{name}}님, {{date}}(금) {{time}} 일정 안내드립니다.\n상세: {{link}}',
        })
      }
    }
  }, [open, editing, form])

  const handleSubmit = async () => {
    const values = await form.validateFields()
    onSubmit(values)
  }

  return (
    <Modal
      title={editing ? '문자 양식 수정' : '문자 양식 등록'}
      open={open}
      onCancel={onCancel}
      onOk={handleSubmit}
      okText={editing ? '수정' : '등록'}
      width={960}
      destroyOnHidden
    >
      <Row gutter={16}>
        <Col span={14}>
          <Form form={form} layout="vertical">
            <Form.Item name="title" label="제목" rules={[{ required: true, message: '제목을 입력해주세요' }]}>
              <Input placeholder="예) [봉사단] 활동 일정 안내" />
            </Form.Item>
            <Form.Item name="description" label="설명">
              <Input.TextArea rows={2} placeholder="템플릿 용도/주의사항을 짧게 적어주세요" />
            </Form.Item>

            <Space size={12} style={{ display: 'flex' }}>
              <Form.Item
                name="status"
                label="상태"
                rules={[{ required: true, message: '상태를 선택해주세요' }]}
                style={{ flex: 1 }}
              >
                <Select
                  options={[
                    { value: 'draft', label: '초안' },
                    { value: 'review', label: '검토' },
                    { value: 'published', label: '게시' },
                    { value: 'archived', label: '아카이브' },
                  ]}
                />
              </Form.Item>
              <Form.Item
                name="audience"
                label="대상"
                rules={[{ required: true, message: '대상을 선택해주세요' }]}
                style={{ flex: 2 }}
              >
                <Select mode="multiple" options={audienceOptions} placeholder="대상 선택" />
              </Form.Item>
            </Space>

            <Form.Item name="tags" label="태그">
              <Select mode="tags" tokenSeparators={[',']} placeholder="태그를 입력하세요 (Enter)" />
            </Form.Item>

            <Form.Item
              name="text"
              label="문구"
              rules={[{ required: true, message: '문구를 입력해주세요' }]}
              extra="변수는 {{name}} 형태로 입력하세요. 예: {{date}}, {{time}}, {{link}}"
            >
              <Input.TextArea rows={10} placeholder="문자 내용을 입력하세요" />
            </Form.Item>
          </Form>
        </Col>

        <Col span={10}>
          <Card size="small" title="미리보기">
            <Space direction="vertical" style={{ width: '100%' }} size={10}>
              <Space direction="vertical" size={0} style={{ width: '100%' }}>
                <Text type="secondary" style={{ fontSize: LAYOUT_CONSTANTS.fontSizes.sm }}>
                  감지된 변수: {watchedVars.length ? watchedVars.join(', ') : '-'}
                </Text>
                <Text type="secondary" style={{ fontSize: LAYOUT_CONSTANTS.fontSizes.sm }}>
                  치환 후 길이: {previewBytes} bytes · {getMessageType(previewBytes)}
                </Text>
              </Space>
              <Divider style={{ margin: `${LAYOUT_CONSTANTS.margins.sm}px 0` }} />
              <div
                style={{
                  background: '#fafafa',
                  border: '1px solid #f0f0f0',
                  borderRadius: 8,
                  padding: LAYOUT_CONSTANTS.spacing.md,
                  whiteSpace: 'pre-wrap',
                  lineHeight: 1.6,
                }}
              >
                {previewText || <Text type="secondary">문구를 입력하면 미리보기가 표시됩니다.</Text>}
              </div>
              <Space>
                <Button onClick={() => copyText(watchedText || '')} disabled={!watchedText}>
                  원문 복사
                </Button>
                <Button onClick={() => copyText(previewText || '')} disabled={!previewText}>
                  샘플 치환 복사
                </Button>
              </Space>
              <Text type="secondary" style={{ fontSize: LAYOUT_CONSTANTS.fontSizes.sm }}>
                샘플 값: {Object.entries(defaultSampleValues).slice(0, 5).map(([k, v]) => `${k}=${v}`).join(', ')} ...
              </Text>
            </Space>
          </Card>
        </Col>
      </Row>
    </Modal>
  )
}
