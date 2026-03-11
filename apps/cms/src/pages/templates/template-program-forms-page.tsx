/**
 * 템플릿 관리 - 프로그램 양식 (유동 템플릿)
 * 프로그램별로 항목 수정 가능한 템플릿 관리
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
  Switch,
} from 'antd'
import { UnifiedFilterCard } from '@/shared/ui/unified-filter-card'
import type { ColumnsType } from 'antd/es/table'
import type { MenuProps } from 'antd'
import dayjs from 'dayjs'
import { MoreOutlined } from '@ant-design/icons'
import type {
  ProgramFormTemplate,
  ProgramFormTemplateType,
  TemplateAudience,
  TemplateStatus,
} from '@/types/template'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { canPerformWriteAction } from '@/shared/utils/permissions'
import { getTemplateStatusColor, getTemplateStatusLabel } from '@/data/mock/templates'
import { MESSAGES } from '@/shared/constants'
import { FormFieldEditor } from '@/features/program/ui/form-field-editor'
import type { FormFieldDef } from '@/types/form-template'

const { Text } = Typography
const { TextArea } = Input

const audienceOptions: Array<{ value: TemplateAudience; label: string }> = [
  { value: 'ADMIN_INTERNAL', label: '운영(내부)' },
  { value: 'SCHOOL', label: '학교' },
  { value: 'INSTRUCTOR', label: '강사' },
  { value: 'INDIVIDUAL', label: '학생' },
]

const formTypeOptions: Array<{ value: ProgramFormTemplateType; label: string }> = [
  { value: 'application', label: '신청 기본 템플릿' },
  { value: 'survey', label: '설문조사 템플릿' },
  { value: 'satisfaction', label: '만족도조사 템플릿' },
  { value: 'assignment', label: '과제 제출 템플릿' },
]

// Mock 데이터
const mockProgramFormTemplates: ProgramFormTemplate[] = [
  {
    id: 'tpl-pf-001',
    type: 'program-forms',
    title: '기본 신청서 템플릿',
    description: '일반적인 프로그램 신청에 사용되는 기본 템플릿',
    tags: ['기본', '신청'],
    audience: ['INDIVIDUAL', 'SCHOOL'],
    status: 'published',
    updatedAt: '2025-01-15T10:00:00Z',
    updatedBy: '관리자(운영)',
    content: {
      formType: 'application',
      fields: [
        {
          id: 'field-1',
          label: '참가 목적',
          type: 'textarea',
          required: true,
          placeholder: '이 프로그램에 참여하려는 목적을 구체적으로 적어주세요.',
        },
        {
          id: 'field-2',
          label: '관련 경험',
          type: 'textarea',
          required: false,
          placeholder: '관련 경험이 있다면 간단히 적어주세요.',
        },
      ],
      isEditable: true,
    },
  },
  {
    id: 'tpl-pf-002',
    type: 'program-forms',
    title: '만족도 조사 템플릿',
    description: '프로그램 종료 후 만족도 조사에 사용',
    tags: ['만족도', '조사'],
    audience: ['INDIVIDUAL', 'SCHOOL', 'INSTRUCTOR'],
    status: 'published',
    updatedAt: '2025-01-20T10:00:00Z',
    updatedBy: '관리자(운영)',
    content: {
      formType: 'satisfaction',
      fields: [
        {
          id: 'field-3',
          label: '전체 만족도',
          type: 'select',
          required: true,
          options: [
            { value: '5', label: '매우 만족' },
            { value: '4', label: '만족' },
            { value: '3', label: '보통' },
            { value: '2', label: '불만족' },
            { value: '1', label: '매우 불만족' },
          ],
        },
        {
          id: 'field-4',
          label: '개선 사항',
          type: 'textarea',
          required: false,
          placeholder: '개선이 필요한 사항을 적어주세요.',
        },
      ],
      isEditable: true,
    },
  },
]

function statusLabel(status: TemplateStatus) {
  return getTemplateStatusLabel(status)
}

export default function TemplateProgramFormsPage() {
  const { user } = useAuthStore()
  const canWrite = canPerformWriteAction(user)

  const [rows, setRows] = useState<ProgramFormTemplate[]>(mockProgramFormTemplates)
  const [pendingFilters, setPendingFilters] = useState({
    query: '',
    status: 'all' as TemplateStatus | 'all',
    formType: 'all' as ProgramFormTemplateType | 'all',
  })
  const [appliedFilters, setAppliedFilters] = useState({
    query: '',
    status: 'all' as TemplateStatus | 'all',
    formType: 'all' as ProgramFormTemplateType | 'all',
  })
  const [editing, setEditing] = useState<ProgramFormTemplate | null>(null)
  const [open, setOpen] = useState(false)
  const [fieldEditorOpen, setFieldEditorOpen] = useState(false)
  const [form] = Form.useForm()

  const filtered = useMemo(() => {
    const q = appliedFilters.query.trim().toLowerCase()
    return rows
      .filter(r => (appliedFilters.status === 'all' ? true : r.status === appliedFilters.status))
      .filter(r =>
        appliedFilters.formType === 'all' ? true : r.content.formType === appliedFilters.formType
      )
      .filter(r => {
        if (!q) return true
        return (
          r.title.toLowerCase().includes(q) ||
          r.description?.toLowerCase().includes(q) ||
          r.tags.some(t => t.toLowerCase().includes(q))
        )
      })
      .sort((a, b) => dayjs(b.updatedAt).valueOf() - dayjs(a.updatedAt).valueOf())
  }, [appliedFilters, rows])

  const handleSearch = () => {
    setAppliedFilters(pendingFilters)
  }

  const openCreate = () => {
    setEditing(null)
    setOpen(true)
    form.resetFields()
    form.setFieldsValue({
      status: 'draft',
      audience: ['ADMIN_INTERNAL', 'SCHOOL', 'INSTRUCTOR', 'INDIVIDUAL'],
      tags: [],
      formType: 'application',
      isEditable: true,
      fields: [],
    })
  }

  const openEdit = (row: ProgramFormTemplate) => {
    setEditing(row)
    setOpen(true)
    form.setFieldsValue({
      title: row.title,
      description: row.description,
      tags: row.tags,
      audience: row.audience,
      status: row.status,
      formType: row.content.formType,
      isEditable: row.content.isEditable,
    })
  }

  const handleSubmit = async () => {
    const values = await form.validateFields()
    const now = new Date().toISOString()

    const next: ProgramFormTemplate = editing
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
            formType: values.formType,
            isEditable: values.isEditable,
          },
        }
      : {
          id: `tpl-pf-${String(rows.length + 1).padStart(3, '0')}`,
          type: 'program-forms',
          title: values.title,
          description: values.description,
          tags: values.tags || [],
          audience: values.audience,
          status: values.status,
          updatedAt: now,
          updatedBy: '관리자(운영)',
          content: {
            formType: values.formType,
            fields: [],
            isEditable: values.isEditable,
          },
        }

    setRows(prev => {
      if (editing) return prev.map(r => (r.id === editing.id ? next : r))
      return [next, ...prev]
    })

    message.success(editing ? '템플릿이 수정되었습니다' : '템플릿이 생성되었습니다')
    setOpen(false)
    setEditing(null)
  }

  const handleArchiveToggle = (row: ProgramFormTemplate) => {
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

  const handleCopyTemplate = (row: ProgramFormTemplate) => {
    const now = new Date().toISOString()
    const copiedTemplate: ProgramFormTemplate = {
      ...row,
      id: `tpl-pf-${String(rows.length + 1).padStart(3, '0')}`,
      title: `${row.title} (복사본)`,
      status: 'draft',
      updatedAt: now,
      updatedBy: '관리자(운영)',
    }

    setRows(prev => [copiedTemplate, ...prev])
    message.success(MESSAGES.success.templateCopied)
    openEdit(copiedTemplate)
  }

  const handleFieldsSave = (fields: FormFieldDef[]) => {
    if (!editing) return

    const now = new Date().toISOString()
    const updated: ProgramFormTemplate = {
      ...editing,
      content: {
        ...editing.content,
        fields,
      },
      updatedAt: now,
    }

    setRows(prev => prev.map(r => (r.id === editing.id ? updated : r)))
    setEditing(updated)
    setFieldEditorOpen(false)
    message.success('필드가 저장되었습니다')
  }

  const getRowMenuItems = (row: ProgramFormTemplate): MenuProps['items'] => {
    const baseItems: MenuProps['items'] = []

    if (canWrite) {
      baseItems.push(
        {
          key: 'edit-fields',
          label: '필드 편집',
          onClick: () => {
            setEditing(row)
            setFieldEditorOpen(true)
          },
        },
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

  const columns: ColumnsType<ProgramFormTemplate> = [
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
      title: '양식 종류',
      key: 'formType',
      width: 180,
      render: (_: unknown, row) => (
        <Tag color="blue">{formTypeOptions.find(o => o.value === row.content.formType)?.label}</Tag>
      ),
    },
    {
      title: '필드 수',
      key: 'fieldCount',
      width: 100,
      render: (_: unknown, row) => <Text>{row.content.fields.length}개</Text>,
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
      width: 100,
      render: (status: TemplateStatus) => (
        <Tag color={getTemplateStatusColor(status)}>{statusLabel(status)}</Tag>
      ),
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
      key: 'actions',
      width: 80,
      fixed: 'right',
      render: (_: unknown, row) => (
        <Dropdown menu={{ items: getRowMenuItems(row) }} trigger={['click']}>
          <Button type="text" icon={<MoreOutlined />} />
        </Dropdown>
      ),
    },
  ]

  return (
    <div>
      <UnifiedFilterCard
        fields={[
          {
            key: 'query',
            type: 'search',
            label: '검색',
            placeholder: '제목, 설명, 태그 검색',
            defaultValue: pendingFilters.query,
          },
          {
            key: 'formType',
            type: 'select',
            label: '양식 종류',
            placeholder: '전체',
            options: [
              { label: '전체', value: 'all' },
              ...formTypeOptions.map(o => ({ label: o.label, value: o.value })),
            ],
            defaultValue: pendingFilters.formType,
          },
          {
            key: 'status',
            type: 'select',
            label: '상태',
            placeholder: '전체',
            options: [
              { label: '전체', value: 'all' },
              { label: '게시', value: 'published' },
              { label: '초안', value: 'draft' },
              { label: '아카이브', value: 'archived' },
            ],
            defaultValue: pendingFilters.status,
          },
        ]}
        filters={pendingFilters}
        onFilterChange={(key, value) => {
          setPendingFilters(prev => ({ ...prev, [key]: value }))
        }}
        onSearch={handleSearch}
        extra={
          <Button type="primary" onClick={openCreate} disabled={!canWrite}>
            새 템플릿
          </Button>
        }
      />
      <Table
        dataSource={filtered}
        columns={columns}
        rowKey="id"
        pagination={{
          pageSize: 20,
          showSizeChanger: true,
          showTotal: (total, range) => `${range[0]}-${range[1]} / ${total}개`,
        }}
      />
      {/* 기존 필터 UI 제거하고 UnifiedFilterCard로 대체 */}
      {/*       <UnifiedFilterCard
        fields={[
          {
            key: 'query',
            type: 'search',
            label: '검색',
            placeholder: '제목, 설명, 태그 검색',
            defaultValue: pendingFilters.query,
          },
          {
            key: 'formType',
            type: 'select',
            label: '양식 종류',
            placeholder: '전체',
            options: [
              { label: '전체', value: 'all' },
              ...formTypeOptions.map(o => ({ label: o.label, value: o.value })),
            ],
            defaultValue: pendingFilters.formType,
          },
          {
            key: 'status',
            type: 'select',
            label: '상태',
            placeholder: '전체',
            options: [
              { label: '전체', value: 'all' },
              { label: '초안', value: 'draft' },
              { label: '검토', value: 'review' },
              { label: '게시', value: 'published' },
              { label: '아카이브', value: 'archived' },
            ],
            defaultValue: pendingFilters.status,
          },
        ]}
        filters={pendingFilters}
        onFilterChange={(key, value) => {
          setPendingFilters(prev => ({ ...prev, [key]: value }))
        }}
        onSearch={handleSearch}
        extra={
          canWrite ? (
            <Button type="primary" onClick={openCreate}>
              템플릿 등록
            </Button>
          ) : null
        }
      />

      <Card>
        <Table
          columns={columns}
          dataSource={filtered}
          rowKey="id"
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showTotal: total => `총 ${total}개`,
          }}
        />
      </Card>

      {/* 템플릿 등록/수정 모달 */}
      <Modal
        title={editing ? '템플릿 수정' : '템플릿 등록'}
        open={open}
        onCancel={() => {
          setOpen(false)
          setEditing(null)
          form.resetFields()
        }}
        onOk={handleSubmit}
        width={600}
        okText="저장"
        cancelText="취소"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="title"
            label="제목"
            rules={[{ required: true, message: '제목을 입력해주세요' }]}
          >
            <Input placeholder="템플릿 제목" />
          </Form.Item>

          <Form.Item name="description" label="설명">
            <TextArea rows={3} placeholder="템플릿 설명" />
          </Form.Item>

          <Form.Item
            name="formType"
            label="양식 종류"
            rules={[{ required: true, message: '양식 종류를 선택해주세요' }]}
          >
            <Select options={formTypeOptions} />
          </Form.Item>

          <Form.Item
            name="audience"
            label="대상"
            rules={[{ required: true, message: '대상을 선택해주세요' }]}
          >
            <Select mode="multiple" options={audienceOptions} />
          </Form.Item>

          <Form.Item name="tags" label="태그">
            <Select
              mode="tags"
              placeholder="태그를 입력하고 Enter를 누르세요"
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item name="status" label="상태" rules={[{ required: true }]}>
            <Select>
              <Select.Option value="draft">초안</Select.Option>
              <Select.Option value="review">검토</Select.Option>
              <Select.Option value="published">게시</Select.Option>
              <Select.Option value="archived">아카이브</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item name="isEditable" label="프로그램별 수정 가능" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>

      {/* 필드 편집 모달 */}
      {editing && (
        <FormFieldEditor
          open={fieldEditorOpen}
          fields={editing.content.fields}
          onSave={handleFieldsSave}
          onCancel={() => {
            setFieldEditorOpen(false)
            setEditing(null)
          }}
        />
      )}
    </div>
  )
}
