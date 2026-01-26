/**
 * 템플릿 관리 - 파일 양식
 * P0: 목록/검색/등록/수정/상태변경(아카이브)까지 mock 기반
 */

import { useMemo, useState } from 'react'
import {
  Button,
  Card,
  Dropdown,
  Form,
  Input,
  Modal,
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
import type { FileTemplate, TemplateAudience, TemplateStatus } from '@/types/template'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { canPerformWriteAction } from '@/shared/utils/permissions'
import { mockFileTemplates, getTemplateStatusColor, getTemplateStatusLabel } from '@/data/mock/templates'
import { MESSAGES } from '@/shared/constants'

const { Text } = Typography
const { Search } = Input

const audienceOptions: Array<{ value: TemplateAudience; label: string }> = [
  { value: 'ADMIN_INTERNAL', label: '운영(내부)' },
  { value: 'SCHOOL', label: '학교' },
  { value: 'INSTRUCTOR', label: '강사' },
  { value: 'INDIVIDUAL', label: '개인(참여자)' },
]

function statusLabel(status: TemplateStatus) {
  return getTemplateStatusLabel(status)
}

export default function TemplateFilesPage() {
  const { user } = useAuthStore()
  // Phase 0.5.2: GENERAL 관리자는 쓰기 작업 불가
  const canWrite = canPerformWriteAction(user)

  const [rows, setRows] = useState<FileTemplate[]>(mockFileTemplates)
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<TemplateStatus | 'all'>('all')
  const [editing, setEditing] = useState<FileTemplate | null>(null)
  const [open, setOpen] = useState(false)
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
          r.content.fileName.toLowerCase().includes(q)
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
      audience: ['ADMIN_INTERNAL', 'SCHOOL', 'INSTRUCTOR', 'INDIVIDUAL'],
      tags: [],
      mimeType: 'application/pdf',
      version: 'v1.0',
      downloadUrl: '#',
    })
  }

  const openEdit = (row: FileTemplate) => {
    setEditing(row)
    setOpen(true)
    form.setFieldsValue({
      title: row.title,
      description: row.description,
      tags: row.tags,
      audience: row.audience,
      status: row.status,
      fileName: row.content.fileName,
      mimeType: row.content.mimeType,
      version: row.content.version,
      downloadUrl: row.content.downloadUrl,
    })
  }

  const handleSubmit = async () => {
    const values = await form.validateFields()
    const now = new Date().toISOString()

    const next: FileTemplate = editing
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
            ...editing.content,
            fileName: values.fileName,
            mimeType: values.mimeType,
            version: values.version,
            downloadUrl: values.downloadUrl,
          },
        }
      : {
          id: `tpl-file-${String(rows.length + 1).padStart(3, '0')}`,
          type: 'files',
          title: values.title,
          description: values.description,
          tags: values.tags || [],
          audience: values.audience,
          status: values.status,
          updatedAt: now,
          updatedBy: '관리자(운영)',
          content: {
            fileName: values.fileName,
            mimeType: values.mimeType,
            version: values.version,
            downloadUrl: values.downloadUrl,
          },
        }

    setRows(prev => {
      if (editing) return prev.map(r => (r.id === editing.id ? next : r))
      return [next, ...prev]
    })

    message.success(editing ? MESSAGES.success.templateFileUpdated : MESSAGES.success.templateFileCreated)
    setOpen(false)
    setEditing(null)
  }

  const handleArchiveToggle = (row: FileTemplate) => {
    setRows(prev =>
      prev.map(r =>
        r.id === row.id
          ? { ...r, status: r.status === 'archived' ? 'published' : 'archived', updatedAt: new Date().toISOString() }
          : r
      )
    )
  }

  // 템플릿 복사 기능 (FR-H01)
  const handleCopyTemplate = (row: FileTemplate) => {
    const now = new Date().toISOString()
    const copiedTemplate: FileTemplate = {
      ...row,
      id: `tpl-file-${String(rows.length + 1).padStart(3, '0')}`,
      title: `${row.title} (복사본)`,
      status: 'draft',
      updatedAt: now,
      updatedBy: '관리자(운영)',
    }

    setRows(prev => [copiedTemplate, ...prev])
    message.success(MESSAGES.success.templateCopied)
    openEdit(copiedTemplate)
  }

  const getRowMenuItems = (row: FileTemplate): MenuProps['items'] => {
    const baseItems: MenuProps['items'] = [
      {
        key: 'download',
        label: '다운로드',
        onClick: () => {
          message.info(MESSAGES.info.downloadLinkComingSoon)
          window.open(row.content.downloadUrl || '#', '_blank')
        },
      },
    ]

    // Phase 0.5.2: GENERAL 관리자는 쓰기 작업 불가
    if (canWrite) {
      baseItems.push(
        { type: 'divider' },
        {
          key: 'copy',
          label: '복사',
          onClick: () => handleCopyTemplate(row),
        },
        {
          key: 'edit',
          label: '수정',
          onClick: () => openEdit(row),
        },
        { type: 'divider' },
        {
          key: 'toggle-archive',
          label: row.status === 'archived' ? '게시' : '아카이브',
          danger: row.status !== 'archived',
          onClick: () => handleArchiveToggle(row),
        }
      )
    }

    return baseItems
  }

  const columns: ColumnsType<FileTemplate> = [
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
      title: '파일',
      key: 'file',
      width: 260,
      render: (_: unknown, row) => (
        <Space direction="vertical" size={0}>
          <Text>{row.content.fileName}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {row.content.mimeType} · {row.content.version}
          </Text>
        </Space>
      ),
    },
    {
      title: '대상',
      dataIndex: 'audience',
      key: 'audience',
      width: 220,
      render: (audience: TemplateAudience[]) => (
        <Space size={6} wrap>
          {audience.slice(0, 3).map(a => (
            <Tag key={a}>{audienceOptions.find(o => o.value === a)?.label || a}</Tag>
          ))}
          {audience.length > 3 && <Tag>+{audience.length - 3}</Tag>}
        </Space>
      ),
    },
    {
      title: '상태',
      dataIndex: 'status',
      key: 'status',
      width: 110,
      render: (s: TemplateStatus) => <Tag color={getTemplateStatusColor(s)}>{statusLabel(s)}</Tag>,
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
            placeholder="제목/설명/태그/파일명 검색"
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
              { value: 'draft', label: '초안' },
              { value: 'review', label: '검토' },
              { value: 'published', label: '게시' },
              { value: 'archived', label: '아카이브' },
            ]}
          />
          {/* Phase 0.5.2: GENERAL 관리자는 쓰기 작업 불가 */}
          {canWrite && (
            <Button type="primary" onClick={openCreate}>
              파일 양식 등록
            </Button>
          )}
        </Space>
      </Card>

      <Table
        columns={columns}
        dataSource={filtered}
        rowKey="id"
        scroll={{ x: 1100 }}
        pagination={{
          defaultPageSize: 10,
          showSizeChanger: true,
          showTotal: total => `총 ${total}개`,
        }}
      />

      <Modal
        title={editing ? '파일 양식 수정' : '파일 양식 등록'}
        open={open}
        onCancel={() => {
          setOpen(false)
          setEditing(null)
        }}
        onOk={handleSubmit}
        okText={editing ? '수정' : '등록'}
        width={720}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item name="title" label="제목" rules={[{ required: true, message: '제목을 입력해주세요' }]}>
            <Input placeholder="예) 봉사활동 안내문(기본)" />
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
            <Form.Item name="version" label="버전" rules={[{ required: true, message: '버전을 입력해주세요' }]} style={{ flex: 1 }}>
              <Input placeholder="v1.0" />
            </Form.Item>
          </Space>

          <Form.Item
            name="audience"
            label="대상"
            rules={[{ required: true, message: '대상을 선택해주세요' }]}
          >
            <Select mode="multiple" options={audienceOptions} placeholder="대상 선택" />
          </Form.Item>

          <Form.Item name="tags" label="태그">
            <Select mode="tags" tokenSeparators={[',']} placeholder="태그를 입력하세요 (Enter)" />
          </Form.Item>

          <Space size={12} style={{ display: 'flex' }}>
            <Form.Item name="fileName" label="파일명" rules={[{ required: true, message: '파일명을 입력해주세요' }]} style={{ flex: 1 }}>
              <Input placeholder="예) 안내문_v1.pdf" />
            </Form.Item>
            <Form.Item name="mimeType" label="MIME Type" rules={[{ required: true, message: 'MIME Type을 입력해주세요' }]} style={{ flex: 1 }}>
              <Input placeholder="application/pdf" />
            </Form.Item>
          </Space>

          <Form.Item name="downloadUrl" label="다운로드 URL(임시)" rules={[{ required: true, message: 'URL을 입력해주세요' }]}>
            <Input placeholder="초기에는 # 사용, 추후 스토리지 연동" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

