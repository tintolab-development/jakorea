import { Button, Card, Col, Divider, Form, Input, Modal, Row, Select, Space, Typography } from 'antd'
import type { EmailTemplate } from '@/types/template'
import { audienceOptions, commonVariables, defaultSampleValues } from '../constants'
import { useTemplateEditor } from '../hooks/use-template-editor'
import { useClipboard } from '../hooks/use-clipboard'
import { applyTemplateVariables, extractTemplateVariables } from '@/data/mock/templates'
import { useEffect, useMemo } from 'react'
import { LAYOUT_CONSTANTS } from '@/shared/constants'

const { Text } = Typography

interface EmailTemplateFormModalProps {
  open: boolean
  editing: EmailTemplate | null
  onCancel: () => void
  onSubmit: (values: {
    title: string
    description?: string
    tags: string[]
    audience: string[]
    status: string
    subject: string
    markdown: string
    html: string
  }) => void
}

export function EmailTemplateFormModal({
  open,
  editing,
  onCancel,
  onSubmit,
}: EmailTemplateFormModalProps) {
  const [form] = Form.useForm()
  const { copyText } = useClipboard()
  const { editorHostRef, editorRef: _editorRef, watchedMarkdown, insertVariable, getMarkdown, getHTML, setMarkdown } = // eslint-disable-line @typescript-eslint/no-unused-vars
    useTemplateEditor(open, editing?.content.markdown || '')

  const watchedVars = useMemo(() => extractTemplateVariables(watchedMarkdown), [watchedMarkdown])

  useEffect(() => {
    if (open) {
      if (editing) {
        form.setFieldsValue({
          title: editing.title,
          description: editing.description,
          tags: editing.tags,
          audience: editing.audience,
          status: editing.status,
          subject: editing.content.subject,
        })
        setMarkdown(editing.content.markdown || '')
      } else {
        form.resetFields()
        form.setFieldsValue({
          status: 'draft',
          audience: ['INDIVIDUAL'],
          tags: [],
          subject: '[JA Korea] {{name}}님 안내드립니다',
        })
        setMarkdown('안녕하세요 **{{name}}**님,\n\n내용을 입력해주세요.\n\n{{link}}')
      }
    }
  }, [open, editing, form, setMarkdown])

  const handleSubmit = async () => {
    const values = await form.validateFields()
    const md = getMarkdown()
    const html = getHTML()

    onSubmit({
      ...values,
      markdown: md,
      html,
    })
  }

  return (
    <Modal
      title={editing ? '메일 양식 수정' : '메일 양식 등록'}
      open={open}
      onCancel={onCancel}
      onOk={handleSubmit}
      okText={editing ? '수정' : '등록'}
      width={1100}
      destroyOnHidden
    >
      <Row gutter={16}>
        <Col span={9}>
          <Form form={form} layout="vertical">
            <Form.Item name="title" label="제목" rules={[{ required: true, message: '제목을 입력해주세요' }]}>
              <Input placeholder="예) [봉사단] 활동 안내 메일(기본)" />
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
              name="subject"
              label="메일 제목(Subject)"
              rules={[{ required: true, message: '메일 제목을 입력해주세요' }]}
              extra="변수는 {{name}} 형태로 입력하세요."
            >
              <Input placeholder="[JA Korea] {{name}}님 안내드립니다" />
            </Form.Item>

            <Divider style={{ margin: `${LAYOUT_CONSTANTS.margins.md}px 0` }} />
            <Text type="secondary" style={{ fontSize: LAYOUT_CONSTANTS.fontSizes.sm }}>
              감지된 변수(본문 기준): {watchedVars.length ? watchedVars.join(', ') : '-'}
            </Text>

            <Divider style={{ margin: `${LAYOUT_CONSTANTS.margins.md}px 0` }} />
            <Text strong style={{ fontSize: LAYOUT_CONSTANTS.fontSizes.sm }}>
              변수 삽입
            </Text>
            <Space wrap style={{ marginTop: LAYOUT_CONSTANTS.margins.sm }}>
              {commonVariables.map(v => (
                <Button key={v} size="small" onClick={() => insertVariable(v)}>
                  {`{{${v}}}`}
                </Button>
              ))}
            </Space>
          </Form>
        </Col>

        <Col span={15}>
          <Card size="small" title="본문(Toast UI Editor)">
            <div ref={editorHostRef} />
            <Divider style={{ margin: '12px 0' }} />
            <Space>
              <Button onClick={() => copyText(getMarkdown())} disabled={!watchedMarkdown}>
                본문(md) 복사
              </Button>
              <Button
                type="primary"
                onClick={() => copyText(applyTemplateVariables(getMarkdown(), defaultSampleValues))}
                disabled={!watchedMarkdown}
              >
                샘플 치환(md) 복사
              </Button>
            </Space>
            <Text type="secondary" style={{ fontSize: LAYOUT_CONSTANTS.fontSizes.sm, display: 'block', marginTop: LAYOUT_CONSTANTS.margins.sm }}>
              샘플 값: {Object.entries(defaultSampleValues).slice(0, 5).map(([k, v]) => `${k}=${v}`).join(', ')} ...
            </Text>
          </Card>
        </Col>
      </Row>
    </Modal>
  )
}
