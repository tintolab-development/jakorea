/**
 * 템플릿 관리 - 문자(SMS) 양식
 * P1: 변수 치환/문자 길이 계산/복사 포함 (mock 기반)
 */

import { useMemo, useState } from 'react'
import {
  Button,
  Card,
  Col,
  Divider,
  Dropdown,
  Form,
  Input,
  Modal,
  Row,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { MenuProps } from 'antd'
import dayjs from 'dayjs'
import { MoreOutlined } from '@ant-design/icons'
import type { SmsTemplate, TemplateAudience, TemplateStatus } from '@/types/template'
import {
  mockSmsTemplates,
  extractTemplateVariables,
  applyTemplateVariables,
  estimateMessageBytes,
  getTemplateStatusColor,
  getTemplateStatusLabel,
} from '@/data/mock/templates'

const { Text } = Typography
const { Search } = Input

const audienceOptions: Array<{ value: TemplateAudience; label: string }> = [
  { value: 'ADMIN_INTERNAL', label: '운영(내부)' },
  { value: 'SCHOOL', label: '학교' },
  { value: 'INSTRUCTOR', label: '강사' },
  { value: 'VOLUNTEER', label: '봉사자' },
  { value: 'STUDENT', label: '수강자' },
]

const statusOptions: Array<{ value: TemplateStatus; label: string }> = [
  { value: 'draft', label: '초안' },
  { value: 'review', label: '검토' },
  { value: 'published', label: '게시' },
  { value: 'archived', label: '아카이브' },
]

const defaultSampleValues: Record<string, string> = {
  name: '홍길동',
  programTitle: '금융교육 봉사 프로그램',
  date: '2026-01-09',
  time: '10:00',
  location: '서울시 마포구 OO학교',
  link: 'https://example.com',
  startDate: '2026-01-09',
  endDate: '2026-02-27',
  message: '안내드립니다.',
}

function getMessageType(bytes: number) {
  // 아주 러프한 기준: SMS 90bytes 이하, 그 외 LMS
  return bytes <= 90 ? 'SMS(단문)' : 'LMS(장문)'
}

export default function TemplateSmsPage() {
  const [rows, setRows] = useState<SmsTemplate[]>(mockSmsTemplates)
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<TemplateStatus | 'all'>('all')
  const [editing, setEditing] = useState<SmsTemplate | null>(null)
  const [open, setOpen] = useState(false)
  const [previewTarget, setPreviewTarget] = useState<SmsTemplate | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [form] = Form.useForm()

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return rows
      .filter(r => (status === 'all' ? true : r.status === status))
      .filter(r => {
        if (!q) return true
        return (
          r.title.toLowerCase().includes(q) ||
          r.description?.toLowerCase().includes(q) ||
          r.tags.some(t => t.toLowerCase().includes(q)) ||
          r.content.text.toLowerCase().includes(q)
        )
      })
      .sort((a, b) => dayjs(b.updatedAt).valueOf() - dayjs(a.updatedAt).valueOf())
  }, [query, rows, status])

  const openCreate = () => {
    setEditing(null)
    setOpen(true)
    form.resetFields()
    form.setFieldsValue({
      status: 'draft',
      audience: ['VOLUNTEER'],
      tags: [],
      text:
        '안녕하세요 {{name}}님, {{date}}(금) {{time}} 일정 안내드립니다.\n상세: {{link}}',
    })
  }

  const openEdit = (row: SmsTemplate) => {
    setEditing(row)
    setOpen(true)
    form.setFieldsValue({
      title: row.title,
      description: row.description,
      tags: row.tags,
      audience: row.audience,
      status: row.status,
      text: row.content.text,
    })
  }

  const handleSubmit = async () => {
    const values = await form.validateFields()
    const now = new Date().toISOString()
    const vars = extractTemplateVariables(values.text)

    const next: SmsTemplate = editing
      ? {
          ...editing,
          title: values.title,
          description: values.description,
          tags: values.tags || [],
          audience: values.audience,
          status: values.status,
          updatedAt: now,
          updatedBy: '관리자(운영)',
          content: {
            text: values.text,
            variables: vars,
          },
        }
      : {
          id: `tpl-sms-${String(rows.length + 1).padStart(3, '0')}`,
          type: 'sms',
          title: values.title,
          description: values.description,
          tags: values.tags || [],
          audience: values.audience,
          status: values.status,
          updatedAt: now,
          updatedBy: '관리자(운영)',
          content: {
            text: values.text,
            variables: vars,
          },
        }

    setRows(prev => {
      if (editing) return prev.map(r => (r.id === editing.id ? next : r))
      return [next, ...prev]
    })

    message.success(editing ? '문자 양식이 수정되었습니다.' : '문자 양식이 등록되었습니다.')
    setOpen(false)
    setEditing(null)
  }

  const handleArchiveToggle = (row: SmsTemplate) => {
    setRows(prev =>
      prev.map(r =>
        r.id === row.id
          ? {
              ...r,
              status: r.status === 'archived' ? 'published' : 'archived',
              updatedAt: new Date().toISOString(),
            }
          : r
      )
    )
  }

  const copyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      message.success('클립보드에 복사되었습니다.')
    } catch {
      message.error('복사에 실패했습니다. 브라우저 권한을 확인해주세요.')
    }
  }

  const openPreview = (row: SmsTemplate) => {
    setPreviewTarget(row)
    setPreviewOpen(true)
  }

  const getRowMenuItems = (row: SmsTemplate): MenuProps['items'] => [
    {
      key: 'preview',
      label: '미리보기',
      onClick: () => openPreview(row),
    },
    { type: 'divider' },
    {
      key: 'copy-original',
      label: '원문 복사',
      onClick: () => copyText(row.content.text),
    },
    {
      key: 'copy-applied',
      label: '샘플 치환 복사',
      onClick: () => copyText(applyTemplateVariables(row.content.text, defaultSampleValues)),
    },
    { type: 'divider' },
    {
      key: 'edit',
      label: '수정',
      onClick: () => openEdit(row),
    },
    {
      key: 'toggle-archive',
      label: row.status === 'archived' ? '게시' : '아카이브',
      danger: row.status !== 'archived',
      onClick: () => handleArchiveToggle(row),
    },
  ]

  const columns: ColumnsType<SmsTemplate> = [
    {
      title: '제목',
      dataIndex: 'title',
      key: 'title',
      render: (v: string, row) => (
        <Space direction="vertical" size={2}>
          <Text strong>{v}</Text>
          {row.description && <Text type="secondary">{row.description}</Text>}
          <Space size={6} wrap>
            {row.tags.slice(0, 3).map(t => (
              <Tag key={t}>{t}</Tag>
            ))}
            {row.tags.length > 3 && <Tag>+{row.tags.length - 3}</Tag>}
          </Space>
        </Space>
      ),
    },
    {
      title: '문구(미리보기)',
      key: 'text',
      render: (_: unknown, row) => {
        const preview = row.content.text.replace(/\n/g, ' ')
        const bytes = estimateMessageBytes(row.content.text)
        return (
          <div
            role="button"
            tabIndex={0}
            onClick={() => openPreview(row)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') openPreview(row)
            }}
            style={{ cursor: 'pointer' }}
          >
            <Space direction="vertical" size={0}>
              <Text ellipsis style={{ maxWidth: 520 }}>
                {preview}
              </Text>
              <Text type="secondary" style={{ fontSize: 12 }}>
                변수: {row.content.variables.join(', ') || '-'} · {bytes} bytes · {getMessageType(bytes)}
              </Text>
              <Text type="secondary" style={{ fontSize: 12 }}>
                클릭하여 미리보기
              </Text>
            </Space>
          </div>
        )
      },
    },
    {
      title: '상태',
      dataIndex: 'status',
      key: 'status',
      width: 110,
      render: (s: TemplateStatus) => <Tag color={getTemplateStatusColor(s)}>{getTemplateStatusLabel(s)}</Tag>,
    },
    {
      title: '수정일',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 120,
      render: (v: string) => dayjs(v).format('YYYY-MM-DD'),
    },
    {
      title: '작업',
      key: 'action',
      width: 72,
      fixed: 'right' as const,
      render: (_: unknown, row) => (
        <div onClick={e => e.stopPropagation()}>
          <Dropdown menu={{ items: getRowMenuItems(row) }} trigger={['click']} placement="bottomRight">
            <Button type="text" icon={<MoreOutlined />} onClick={e => e.stopPropagation()} />
          </Dropdown>
        </div>
      ),
    },
  ]

  // 모달 내 미리보기 데이터
  const watchedText = Form.useWatch('text', form) || ''
  const watchedVars = useMemo(() => extractTemplateVariables(watchedText), [watchedText])
  const previewText = useMemo(
    () => applyTemplateVariables(watchedText, defaultSampleValues),
    [watchedText]
  )
  const previewBytes = useMemo(() => estimateMessageBytes(previewText), [previewText])

  return (
    <div>
      <Card style={{ marginBottom: 12 }}>
        <Space wrap>
          <Search
            placeholder="제목/설명/태그/내용 검색"
            allowClear
            onSearch={setQuery}
            onChange={e => setQuery(e.target.value)}
            value={query}
            style={{ width: 320 }}
          />
          <Select
            value={status}
            onChange={setStatus}
            style={{ width: 160 }}
            options={[
              { value: 'all', label: '전체 상태' },
              ...statusOptions.map(o => ({ value: o.value, label: o.label })),
            ]}
          />
          <Button type="primary" onClick={openCreate}>
            문자 양식 등록
          </Button>
        </Space>
      </Card>

      <Table
        columns={columns}
        dataSource={filtered}
        rowKey="id"
        scroll={{ x: 1200 }}
        pagination={{
          defaultPageSize: 10,
          showSizeChanger: true,
          showTotal: total => `총 ${total}개`,
        }}
      />

      <Modal
        title={editing ? '문자 양식 수정' : '문자 양식 등록'}
        open={open}
        onCancel={() => {
          setOpen(false)
          setEditing(null)
        }}
        onOk={handleSubmit}
        okText={editing ? '수정' : '등록'}
        width={960}
        destroyOnClose
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
                  <Select options={statusOptions} />
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
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    감지된 변수: {watchedVars.length ? watchedVars.join(', ') : '-'}
                  </Text>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    치환 후 길이: {previewBytes} bytes · {getMessageType(previewBytes)}
                  </Text>
                </Space>
                <Divider style={{ margin: '8px 0' }} />
                <div
                  style={{
                    background: '#fafafa',
                    border: '1px solid #f0f0f0',
                    borderRadius: 8,
                    padding: 12,
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
                <Text type="secondary" style={{ fontSize: 12 }}>
                  샘플 값: {Object.entries(defaultSampleValues).slice(0, 5).map(([k, v]) => `${k}=${v}`).join(', ')} ...
                </Text>
              </Space>
            </Card>
          </Col>
        </Row>
      </Modal>

      <Modal
        title="문자 양식 미리보기"
        open={previewOpen}
        onCancel={() => {
          setPreviewOpen(false)
          setPreviewTarget(null)
        }}
        footer={[
          <Button
            key="copy-original"
            onClick={() => previewTarget && copyText(previewTarget.content.text)}
            disabled={!previewTarget}
          >
            원문 복사
          </Button>,
          <Button
            key="copy-applied"
            type="primary"
            onClick={() =>
              previewTarget &&
              copyText(applyTemplateVariables(previewTarget.content.text, defaultSampleValues))
            }
            disabled={!previewTarget}
          >
            샘플 치환 복사
          </Button>,
          <Button
            key="close"
            onClick={() => {
              setPreviewOpen(false)
              setPreviewTarget(null)
            }}
          >
            닫기
          </Button>,
        ]}
        width={900}
        destroyOnClose
      >
        {previewTarget ? (
          <Row gutter={16}>
            <Col span={12}>
              <Card size="small" title="원문">
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {estimateMessageBytes(previewTarget.content.text)} bytes ·{' '}
                  {getMessageType(estimateMessageBytes(previewTarget.content.text))}
                </Text>
                <Divider style={{ margin: '8px 0' }} />
                <div
                  style={{
                    background: '#fafafa',
                    border: '1px solid #f0f0f0',
                    borderRadius: 8,
                    padding: 12,
                    whiteSpace: 'pre-wrap',
                    lineHeight: 1.6,
                    minHeight: 220,
                  }}
                >
                  {previewTarget.content.text}
                </div>
                <Divider style={{ margin: '12px 0' }} />
                <Text type="secondary" style={{ fontSize: 12 }}>
                  변수: {previewTarget.content.variables.join(', ') || '-'}
                </Text>
              </Card>
            </Col>
            <Col span={12}>
              <Card size="small" title="샘플 치환본">
                {(() => {
                  const applied = applyTemplateVariables(previewTarget.content.text, defaultSampleValues)
                  const bytes = estimateMessageBytes(applied)
                  return (
                    <>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {bytes} bytes · {getMessageType(bytes)}
                      </Text>
                      <Divider style={{ margin: '8px 0' }} />
                      <div
                        style={{
                          background: '#f6ffed',
                          border: '1px solid #b7eb8f',
                          borderRadius: 8,
                          padding: 12,
                          whiteSpace: 'pre-wrap',
                          lineHeight: 1.6,
                          minHeight: 220,
                        }}
                      >
                        {applied}
                      </div>
                    </>
                  )
                })()}
                <Divider style={{ margin: '12px 0' }} />
                <Text type="secondary" style={{ fontSize: 12 }}>
                  샘플 값: {Object.entries(defaultSampleValues).slice(0, 5).map(([k, v]) => `${k}=${v}`).join(', ')} ...
                </Text>
              </Card>
            </Col>
          </Row>
        ) : (
          <Text type="secondary">미리보기할 템플릿이 없습니다.</Text>
        )}
      </Modal>
    </div>
  )
}

