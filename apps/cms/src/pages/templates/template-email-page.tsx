/**
 * 템플릿 관리 - 메일(Email) 양식
 * Toast UI Editor 기반 작성/수정 + 클릭 미리보기(팝업)
 */

import { useEffect, useMemo, useRef, useState } from 'react'
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
import Editor from '@toast-ui/editor'
import Viewer from '@toast-ui/editor/dist/toastui-editor-viewer'
import '@toast-ui/editor/dist/toastui-editor.css'
import '@toast-ui/editor/dist/toastui-editor-viewer.css'

import type { EmailTemplate, TemplateAudience, TemplateStatus } from '@/types/template'
import {
  mockEmailTemplates,
  extractTemplateVariables,
  applyTemplateVariables,
  getTemplateStatusColor,
  getTemplateStatusLabel,
} from '@/data/mock/templates'

const { Text } = Typography
const { Search } = Input

const audienceOptions: Array<{ value: TemplateAudience; label: string }> = [
  { value: 'ADMIN_INTERNAL', label: '운영(내부)' },
  { value: 'SCHOOL', label: '학교' },
  { value: 'INSTRUCTOR', label: '강사' },
  { value: 'INDIVIDUAL', label: '개인(참여자)' },
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

const commonVariables = [
  'name',
  'programTitle',
  'date',
  'time',
  'location',
  'startDate',
  'endDate',
  'link',
  'message',
]

export default function TemplateEmailPage() {
  const [rows, setRows] = useState<EmailTemplate[]>(mockEmailTemplates)
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<TemplateStatus | 'all'>('all')

  const [editing, setEditing] = useState<EmailTemplate | null>(null)
  const [open, setOpen] = useState(false)
  const [form] = Form.useForm()

  const editorHostRef = useRef<HTMLDivElement | null>(null)
  const editorRef = useRef<Editor | null>(null)
  const [watchedMarkdown, setWatchedMarkdown] = useState<string>('')

  const [previewTarget, setPreviewTarget] = useState<EmailTemplate | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const viewerHostRef = useRef<HTMLDivElement | null>(null)
  const viewerRef = useRef<Viewer | null>(null)

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
          r.content.subject.toLowerCase().includes(q) ||
          r.content.markdown.toLowerCase().includes(q)
        )
      })
      .sort((a, b) => dayjs(b.updatedAt).valueOf() - dayjs(a.updatedAt).valueOf())
  }, [query, rows, status])

  const watchedVars = useMemo(() => extractTemplateVariables(watchedMarkdown), [watchedMarkdown])

  const openCreate = () => {
    setEditing(null)
    setOpen(true)
    form.resetFields()
    form.setFieldsValue({
      status: 'draft',
      audience: ['INDIVIDUAL'],
      tags: [],
      subject: '[JA Korea] {{name}}님 안내드립니다',
    })
    setWatchedMarkdown('안녕하세요 **{{name}}**님,\n\n내용을 입력해주세요.\n\n{{link}}')
  }

  const openEdit = (row: EmailTemplate) => {
    setEditing(row)
    setOpen(true)
    form.setFieldsValue({
      title: row.title,
      description: row.description,
      tags: row.tags,
      audience: row.audience,
      status: row.status,
      subject: row.content.subject,
    })
    setWatchedMarkdown(row.content.markdown || '')
  }

  const destroyEditor = () => {
    if (editorRef.current) {
      editorRef.current.destroy()
      editorRef.current = null
    }
  }

  useEffect(() => {
    if (!open) {
      destroyEditor()
      return
    }
    if (!editorHostRef.current) return

    // 모달 열릴 때마다 새 인스턴스 생성 (destroyOnHidden과 동일한 효과)
    destroyEditor()

    const instance = new Editor({
      el: editorHostRef.current,
      height: '420px',
      initialEditType: 'wysiwyg',
      previewStyle: 'vertical',
      usageStatistics: false,
      initialValue: watchedMarkdown || '',
      events: {
        change: () => {
          const md = instance.getMarkdown()
          setWatchedMarkdown(md)
        },
      },
    })

    editorRef.current = instance
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const copyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      message.success('클립보드에 복사되었습니다.')
    } catch {
      message.error('복사에 실패했습니다. 브라우저 권한을 확인해주세요.')
    }
  }

  const insertVariable = (key: string) => {
    if (!editorRef.current) return
    editorRef.current.insertText(`{{${key}}}`)
  }

  const handleSubmit = async () => {
    const values = await form.validateFields()
    const now = new Date().toISOString()
    const md = editorRef.current ? editorRef.current.getMarkdown() : watchedMarkdown
    const html = editorRef.current ? editorRef.current.getHTML() : ''
    const vars = extractTemplateVariables(values.subject + '\n' + md)

    const next: EmailTemplate = editing
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
            subject: values.subject,
            markdown: md,
            html,
            variables: vars,
          },
        }
      : {
          id: `tpl-email-${String(rows.length + 1).padStart(3, '0')}`,
          type: 'email',
          title: values.title,
          description: values.description,
          tags: values.tags || [],
          audience: values.audience,
          status: values.status,
          updatedAt: now,
          updatedBy: '관리자(운영)',
          content: {
            subject: values.subject,
            markdown: md,
            html,
            variables: vars,
          },
        }

    setRows(prev => {
      if (editing) return prev.map(r => (r.id === editing.id ? next : r))
      return [next, ...prev]
    })

    message.success(editing ? '메일 양식이 수정되었습니다.' : '메일 양식이 등록되었습니다.')
    setOpen(false)
    setEditing(null)
  }

  const handleArchiveToggle = (row: EmailTemplate) => {
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

  const openPreview = (row: EmailTemplate) => {
    setPreviewTarget(row)
    setPreviewOpen(true)
  }

  const destroyViewer = () => {
    if (viewerRef.current) {
      viewerRef.current.destroy()
      viewerRef.current = null
    }
  }

  useEffect(() => {
    if (!previewOpen || !previewTarget) {
      destroyViewer()
      return
    }
    if (!viewerHostRef.current) return

    destroyViewer()
    const appliedSubject = applyTemplateVariables(previewTarget.content.subject, defaultSampleValues)
    const appliedMarkdown = applyTemplateVariables(previewTarget.content.markdown, defaultSampleValues)

    // viewer에 렌더
    const instance = new Viewer({
      el: viewerHostRef.current,
      initialValue: `# ${appliedSubject}\n\n${appliedMarkdown}`,
      usageStatistics: false,
    })
    viewerRef.current = instance
  }, [previewOpen, previewTarget])

  const getRowMenuItems = (row: EmailTemplate): MenuProps['items'] => [
    {
      key: 'preview',
      label: '미리보기',
      onClick: () => openPreview(row),
    },
    { type: 'divider' },
    {
      key: 'copy-subject',
      label: 'Subject 복사',
      onClick: () => copyText(row.content.subject),
    },
    {
      key: 'copy-body-md',
      label: '본문(md) 복사',
      onClick: () => copyText(row.content.markdown),
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

  const columns: ColumnsType<EmailTemplate> = [
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
      title: '제목(메일 Subject)',
      key: 'subject',
      render: (_: unknown, row) => (
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
              {row.content.subject}
            </Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              변수: {row.content.variables.join(', ') || '-'} · 클릭하여 미리보기
            </Text>
          </Space>
        </div>
      ),
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

  return (
    <div>
      <Card style={{ marginBottom: 12 }}>
        <Space wrap>
          <Search
            placeholder="제목/설명/태그/subject/본문 검색"
            allowClear
            onSearch={setQuery}
            onChange={e => setQuery(e.target.value)}
            value={query}
            style={{ width: 340 }}
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
            메일 양식 등록
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
        title={editing ? '메일 양식 수정' : '메일 양식 등록'}
        open={open}
        onCancel={() => {
          setOpen(false)
          setEditing(null)
        }}
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
                name="subject"
                label="메일 제목(Subject)"
                rules={[{ required: true, message: '메일 제목을 입력해주세요' }]}
                extra="변수는 {{name}} 형태로 입력하세요."
              >
                <Input placeholder="[JA Korea] {{name}}님 안내드립니다" />
              </Form.Item>

              <Divider style={{ margin: '12px 0' }} />
              <Text type="secondary" style={{ fontSize: 12 }}>
                감지된 변수(본문 기준): {watchedVars.length ? watchedVars.join(', ') : '-'}
              </Text>

              <Divider style={{ margin: '12px 0' }} />
              <Text strong style={{ fontSize: 12 }}>
                변수 삽입
              </Text>
              <Space wrap style={{ marginTop: 8 }}>
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
                <Button onClick={() => copyText(editorRef.current?.getMarkdown() || watchedMarkdown)} disabled={!watchedMarkdown}>
                  본문(md) 복사
                </Button>
                <Button
                  type="primary"
                  onClick={() =>
                    copyText(applyTemplateVariables(editorRef.current?.getMarkdown() || watchedMarkdown, defaultSampleValues))
                  }
                  disabled={!watchedMarkdown}
                >
                  샘플 치환(md) 복사
                </Button>
              </Space>
              <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 8 }}>
                샘플 값: {Object.entries(defaultSampleValues).slice(0, 5).map(([k, v]) => `${k}=${v}`).join(', ')} ...
              </Text>
            </Card>
          </Col>
        </Row>
      </Modal>

      <Modal
        title="메일 양식 미리보기"
        open={previewOpen}
        onCancel={() => {
          setPreviewOpen(false)
          setPreviewTarget(null)
        }}
        footer={[
          <Button
            key="copy-subject"
            onClick={() =>
              previewTarget &&
              copyText(applyTemplateVariables(previewTarget.content.subject, defaultSampleValues))
            }
            disabled={!previewTarget}
          >
            Subject(치환) 복사
          </Button>,
          <Button
            key="copy-md"
            type="primary"
            onClick={() =>
              previewTarget &&
              copyText(applyTemplateVariables(previewTarget.content.markdown, defaultSampleValues))
            }
            disabled={!previewTarget}
          >
            본문(치환 md) 복사
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
        destroyOnHidden
      >
        <Card size="small" title="렌더링 미리보기">
          <div ref={viewerHostRef} />
        </Card>
      </Modal>
    </div>
  )
}

