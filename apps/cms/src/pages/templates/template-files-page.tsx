/**
 * 템플릿 관리 - 파일 양식
 * P0: 목록/검색/등록/수정/상태변경(아카이브)까지 mock 기반
 */

import { useMemo, useState } from 'react'
import {
  Button,
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
import { UnifiedFilterCard } from '@/shared/ui/unified-filter-card'
import { PageHeader } from '@/shared/ui/page-header'
import type { ColumnsType } from 'antd/es/table'
import type { MenuProps } from 'antd'
import dayjs from 'dayjs'
import { MoreOutlined, DownloadOutlined } from '@ant-design/icons'
import type {
  FileTemplate,
  FileTemplateCategory,
  TemplateAudience,
  TemplateStatus,
} from '@/types/template'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { canPerformWriteAction } from '@/shared/utils/permissions'
import {
  mockFileTemplates,
  getTemplateStatusColor,
  getTemplateStatusLabel,
} from '@/data/mock/templates'
import { MESSAGES } from '@/shared/constants'
import { downloadBlob } from '@/shared/utils/file-download'

const { Text } = Typography

const audienceOptions: Array<{ value: TemplateAudience; label: string }> = [
  { value: 'ADMIN_INTERNAL', label: '운영(내부)' },
  { value: 'SCHOOL', label: '학교' },
  { value: 'INSTRUCTOR', label: '강사' },
  { value: 'INDIVIDUAL', label: '학생' },
]

const categoryOptions: Array<{ value: FileTemplateCategory | 'all'; label: string }> = [
  { value: 'all', label: '전체 카테고리' },
  { value: 'instructor-resume', label: '강사 이력서' },
  { value: 'lecture-report', label: '강의 보고서' },
  { value: 'education-plan', label: '교육계획서' },
  { value: 'certificate', label: '수료증' },
  { value: 'activity-confirmation', label: '활동확인서' },
  { value: 'receipt', label: '영수증' },
  { value: 'payment-statement', label: '지급조서' },
  { value: 'employment-certificate', label: '경력증명서' },
  { value: 'other', label: '기타' },
]

function statusLabel(status: TemplateStatus) {
  return getTemplateStatusLabel(status)
}

export default function TemplateFilesPage() {
  const { user } = useAuthStore()
  // Phase 0.5.2: GENERAL 관리자는 쓰기 작업 불가
  const canWrite = canPerformWriteAction(user)

  const [rows, setRows] = useState<FileTemplate[]>(mockFileTemplates)
  const [pendingFilters, setPendingFilters] = useState({
    query: '',
    status: 'all' as TemplateStatus | 'all',
    category: 'all' as FileTemplateCategory | 'all',
  })
  const [appliedFilters, setAppliedFilters] = useState({
    query: '',
    status: 'all' as TemplateStatus | 'all',
    category: 'all' as FileTemplateCategory | 'all',
  })
  const [editing, setEditing] = useState<FileTemplate | null>(null)
  const [open, setOpen] = useState(false)
  const [form] = Form.useForm()

  const filtered = useMemo(() => {
    const q = appliedFilters.query.trim().toLowerCase()
    return rows
      .filter(r => (appliedFilters.status === 'all' ? true : r.status === appliedFilters.status))
      .filter(r =>
        appliedFilters.category === 'all' ? true : r.content.category === appliedFilters.category
      )
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
  }, [appliedFilters, rows])

  // 조회 버튼 클릭 시 필터 적용
  const handleSearch = () => {
    setAppliedFilters(pendingFilters)
  }

  // 필터 초기화
  const handleFilterReset = () => {
    setPendingFilters({
      query: '',
      status: 'all',
      category: 'all',
    })
    setAppliedFilters({
      query: '',
      status: 'all',
      category: 'all',
    })
  }

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
      category: undefined,
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
      category: row.content.category,
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
            category: values.category,
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
            category: values.category,
          },
        }

    setRows(prev => {
      if (editing) return prev.map(r => (r.id === editing.id ? next : r))
      return [next, ...prev]
    })

    message.success(
      editing ? MESSAGES.success.templateFileUpdated : MESSAGES.success.templateFileCreated
    )
    setOpen(false)
    setEditing(null)
  }

  const handleArchiveToggle = (row: FileTemplate) => {
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

  const handleDownload = async (row: FileTemplate) => {
    const downloadUrl = row.content.downloadUrl
    const fileName = row.content.fileName
    const mimeType = row.content.mimeType

    try {
      // URL이 유효한지 확인 (# 또는 빈 문자열이 아닌 경우)
      if (downloadUrl && downloadUrl !== '#' && downloadUrl.trim() !== '') {
        // 실제 URL인 경우: 서버에서 파일 다운로드
        try {
          const response = await fetch(downloadUrl)
          if (response.ok) {
            const blob = await response.blob()
            downloadBlob(blob, fileName)
            message.success(`${fileName} 다운로드를 완료했습니다`)
          } else {
            throw new Error('파일을 가져올 수 없습니다')
          }
        } catch (error) {
          // URL이 유효하지 않거나 CORS 문제인 경우, 링크로 열기 시도
          const link = document.createElement('a')
          link.href = downloadUrl
          link.download = fileName
          link.target = '_blank'
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          message.success(`${fileName} 다운로드를 시작합니다`)
        }
      } else {
        // Mock 데이터인 경우: 파일명과 MIME 타입 기반으로 빈 파일 생성하여 다운로드
        // 실제 구현 시에는 서버에서 파일을 가져와서 다운로드해야 함
        const mockContent = `이 파일은 ${row.title}의 템플릿 파일입니다.\n파일명: ${fileName}\n버전: ${row.content.version}\n\n실제 파일은 서버에서 제공됩니다.`
        const blob = new Blob([mockContent], { type: mimeType || 'application/octet-stream' })
        downloadBlob(blob, fileName)
        message.success(`${fileName} 다운로드를 완료했습니다 (Mock 데이터)`)
      }
    } catch (error) {
      console.error('Download failed:', error)
      message.error('다운로드 중 오류가 발생했습니다')
    }
  }

  const getRowMenuItems = (row: FileTemplate): MenuProps['items'] => {
    const baseItems: MenuProps['items'] = [
      {
        key: 'download',
        label: '다운로드',
        icon: <DownloadOutlined />,
        onClick: () => handleDownload(row),
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
      title: '카테고리',
      key: 'category',
      width: 140,
      render: (_: unknown, row) => {
        const category = row.content.category
        if (!category) return <Text type="secondary">-</Text>
        const option = categoryOptions.find(o => o.value === category)
        return <Tag color="blue">{option?.label || category}</Tag>
      },
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
          <Dropdown
            menu={{ items: getRowMenuItems(row) }}
            trigger={['click']}
            placement="bottomRight"
          >
            <Button type="text" icon={<MoreOutlined />} onClick={e => e.stopPropagation()} />
          </Dropdown>
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="파일 양식"
        actions={
          canWrite ? (
            <Button type="primary" onClick={openCreate}>
              파일 양식 등록
            </Button>
          ) : undefined
        }
      />

      <UnifiedFilterCard
        fields={[
          {
            key: 'query',
            type: 'search',
            label: '검색',
            placeholder: '제목/설명/태그/파일명 검색',
          },
          {
            key: 'category',
            type: 'select',
            label: '카테고리',
            placeholder: '전체 카테고리',
            options: categoryOptions,
          },
          {
            key: 'status',
            type: 'select',
            label: '상태',
            placeholder: '전체 상태',
            options: [
              { label: '전체 상태', value: 'all' },
              { label: '초안', value: 'draft' },
              { label: '검토', value: 'review' },
              { label: '게시', value: 'published' },
              { label: '아카이브', value: 'archived' },
            ],
          },
        ]}
        filters={pendingFilters}
        onFilterChange={(key, value) => {
          setPendingFilters(prev => ({ ...prev, [key]: value }))
        }}
        onSearch={handleSearch}
        onReset={handleFilterReset}
      />

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
        destroyOnHidden
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="title"
            label="제목"
            rules={[{ required: true, message: '제목을 입력해주세요' }]}
          >
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
            <Form.Item
              name="version"
              label="버전"
              rules={[{ required: true, message: '버전을 입력해주세요' }]}
              style={{ flex: 1 }}
            >
              <Input placeholder="v1.0" />
            </Form.Item>
          </Space>

          <Form.Item
            name="category"
            label="카테고리"
            tooltip="파일 양식의 카테고리를 선택하세요 (선택사항)"
          >
            <Select
              placeholder="카테고리 선택 (선택사항)"
              allowClear
              options={categoryOptions.filter(o => o.value !== 'all')}
            />
          </Form.Item>

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
            <Form.Item
              name="fileName"
              label="파일명"
              rules={[{ required: true, message: '파일명을 입력해주세요' }]}
              style={{ flex: 1 }}
            >
              <Input placeholder="예) 안내문_v1.pdf" />
            </Form.Item>
            <Form.Item
              name="mimeType"
              label="MIME Type"
              rules={[{ required: true, message: 'MIME Type을 입력해주세요' }]}
              style={{ flex: 1 }}
            >
              <Input placeholder="application/pdf" />
            </Form.Item>
          </Space>

          <Form.Item
            name="downloadUrl"
            label="다운로드 URL(임시)"
            rules={[{ required: true, message: 'URL을 입력해주세요' }]}
          >
            <Input placeholder="초기에는 # 사용, 추후 스토리지 연동" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
