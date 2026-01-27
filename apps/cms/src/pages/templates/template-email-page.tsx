/**
 * 템플릿 관리 - 메일(Email) 양식
 * Toast UI Editor 기반 작성/수정 + 클릭 미리보기(팝업)
 */

import '@toast-ui/editor/dist/toastui-editor.css'
import '@toast-ui/editor/dist/toastui-editor-viewer.css'

import { useMemo, useState } from 'react'
import { message } from 'antd'
import type { EmailTemplate, TemplateStatus } from '@/types/template'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { canPerformWriteAction } from '@/shared/utils/permissions'
import { mockEmailTemplates, extractTemplateVariables } from '@/data/mock/templates'
import { useTemplateCRUD } from '@/features/template/hooks/use-template-crud'
import { useClipboard } from '@/features/template/hooks/use-clipboard'
import { TemplateFilters } from '@/features/template/ui/template-filters'
import { MESSAGES } from '@/shared/constants'
import { EmailTemplateTable } from '@/features/template/ui/email-template-table'
import { EmailTemplateFormModal } from '@/features/template/ui/email-template-form-modal'
import { EmailTemplatePreviewModal } from '@/features/template/ui/email-template-preview-modal'
import { BulkSendEmailModal } from '@/features/template/ui/bulk-send-email-modal'
import dayjs from 'dayjs'

export default function TemplateEmailPage() {
  const { user } = useAuthStore()
  const canWrite = canPerformWriteAction(user)

  const [rows, setRows] = useState<EmailTemplate[]>(mockEmailTemplates)
  const {
    editing,
    open,
    openCreate,
    openEdit,
    closeModal,
    handleArchiveToggle,
    handleCopyTemplate,
  } = useTemplateCRUD(rows, setRows, () => `tpl-email-${String(rows.length + 1).padStart(3, '0')}`)
  const { copyText } = useClipboard()

  const [previewTarget, setPreviewTarget] = useState<EmailTemplate | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [bulkSendTarget, setBulkSendTarget] = useState<EmailTemplate | null>(null)
  const [bulkSendOpen, setBulkSendOpen] = useState(false)

  // 필터 상태 (임시)
  const [pendingFilters, setPendingFilters] = useState({
    query: '',
    status: 'all' as TemplateStatus | 'all',
  })

  // 적용된 필터 상태
  const [appliedFilters, setAppliedFilters] = useState({
    query: '',
    status: 'all' as TemplateStatus | 'all',
  })

  // Email 전용 필터링 (subject, markdown 포함)
  const emailFiltered = useMemo(() => {
    const q = appliedFilters.query.trim().toLowerCase()
    return rows
      .filter(r => (appliedFilters.status === 'all' ? true : r.status === appliedFilters.status))
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
  }, [appliedFilters, rows])

  // 조회 버튼 클릭 핸들러
  const handleSearch = () => {
    setAppliedFilters(pendingFilters)
  }

  // 필터 초기화 핸들러
  const handleFilterReset = () => {
    setPendingFilters({
      query: '',
      status: 'all',
    })
    setAppliedFilters({
      query: '',
      status: 'all',
    })
  }

  const handleCreate = () => {
    openCreate()
  }

  const handleSubmit = (values: {
    title: string
    description?: string
    tags: string[]
    audience: string[]
    status: string
    subject: string
    markdown: string
    html: string
  }) => {
    const now = new Date().toISOString()
    const vars = extractTemplateVariables(values.subject + '\n' + values.markdown)

    const next: EmailTemplate = editing
      ? {
          ...editing,
          title: values.title,
          description: values.description,
          tags: values.tags || [],
          audience: values.audience as EmailTemplate['audience'],
          status: values.status as EmailTemplate['status'],
          updatedAt: now,
          updatedBy: '관리자(운영)',
          content: {
            subject: values.subject,
            markdown: values.markdown,
            html: values.html,
            variables: vars,
          },
        }
      : {
          id: `tpl-email-${String(rows.length + 1).padStart(3, '0')}`,
          type: 'email',
          title: values.title,
          description: values.description,
          tags: values.tags || [],
          audience: values.audience as EmailTemplate['audience'],
          status: values.status as EmailTemplate['status'],
          updatedAt: now,
          updatedBy: '관리자(운영)',
          content: {
            subject: values.subject,
            markdown: values.markdown,
            html: values.html,
            variables: vars,
          },
        }

    setRows(prev => {
      if (editing) return prev.map(r => (r.id === editing.id ? next : r))
      return [next, ...prev]
    })

    message.success(
      editing ? MESSAGES.success.templateEmailUpdated : MESSAGES.success.templateEmailCreated
    )
    closeModal()
  }

  const openPreview = (row: EmailTemplate) => {
    setPreviewTarget(row)
    setPreviewOpen(true)
  }

  const closePreview = () => {
    setPreviewOpen(false)
    setPreviewTarget(null)
  }

  const openBulkSend = (row: EmailTemplate) => {
    setBulkSendTarget(row)
    setBulkSendOpen(true)
  }

  const closeBulkSend = () => {
    setBulkSendOpen(false)
    setBulkSendTarget(null)
  }

  return (
    <div>
      <TemplateFilters
        query={pendingFilters.query}
        onQueryChange={value => setPendingFilters(prev => ({ ...prev, query: value }))}
        status={pendingFilters.status}
        onStatusChange={value => setPendingFilters(prev => ({ ...prev, status: value }))}
        onSearch={handleSearch}
        onReset={handleFilterReset}
        onCreateClick={canWrite ? handleCreate : undefined}
        createButtonText="메일 양식 등록"
        searchPlaceholder="제목/설명/태그/subject/본문 검색"
      />

      <EmailTemplateTable
        dataSource={emailFiltered}
        onPreview={openPreview}
        onEdit={canWrite ? openEdit : undefined}
        onCopySubject={row => copyText(row.content.subject)}
        onCopyBody={row => copyText(row.content.markdown)}
        onCopyTemplate={canWrite ? handleCopyTemplate : undefined}
        onToggleArchive={canWrite ? handleArchiveToggle : undefined}
        onBulkSend={openBulkSend}
        canWrite={canWrite}
      />

      <EmailTemplateFormModal
        open={open}
        editing={editing}
        onCancel={closeModal}
        onSubmit={handleSubmit}
      />

      <EmailTemplatePreviewModal
        open={previewOpen}
        previewTarget={previewTarget}
        onClose={closePreview}
      />

      <BulkSendEmailModal
        open={bulkSendOpen}
        template={bulkSendTarget}
        onCancel={closeBulkSend}
        onSuccess={() => {
          message.success('단체 발송이 완료되었습니다')
        }}
      />
    </div>
  )
}
