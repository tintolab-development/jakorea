/**
 * 템플릿 관리 - 문자(SMS) 양식
 * P1: 변수 치환/문자 길이 계산/복사 포함 (mock 기반)
 */

import { useMemo, useState } from 'react'
import { message } from 'antd'
import type { SmsTemplate } from '@/types/template'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { canPerformWriteAction } from '@/shared/utils/permissions'
import { mockSmsTemplates, extractTemplateVariables, applyTemplateVariables } from '@/data/mock/templates'
import { useTemplateFilters } from '@/features/template/hooks/use-template-filters'
import { useTemplateCRUD } from '@/features/template/hooks/use-template-crud'
import { useClipboard } from '@/features/template/hooks/use-clipboard'
import { defaultSampleValues } from '@/features/template/constants'
import { TemplateFilters } from '@/features/template/ui/template-filters'
import { MESSAGES } from '@/shared/constants'
import { SmsTemplateTable } from '@/features/template/ui/sms-template-table'
import { SmsTemplateFormModal } from '@/features/template/ui/sms-template-form-modal'
import { SmsTemplatePreviewModal } from '@/features/template/ui/sms-template-preview-modal'

export default function TemplateSmsPage() {
  const { user } = useAuthStore()
  const canWrite = canPerformWriteAction(user)

  const [rows, setRows] = useState<SmsTemplate[]>(mockSmsTemplates)
  const { query, setQuery, status, setStatus, filtered } = useTemplateFilters(rows)
  const { editing, open, openCreate, openEdit, closeModal, handleArchiveToggle, handleCopyTemplate } =
    useTemplateCRUD(rows, setRows, () => `tpl-sms-${String(rows.length + 1).padStart(3, '0')}`)
  const { copyText } = useClipboard()

  const [previewTarget, setPreviewTarget] = useState<SmsTemplate | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)

  // SMS 전용 필터링 (text 포함)
  const smsFiltered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return filtered
    return filtered.filter(r => r.content.text.toLowerCase().includes(q))
  }, [filtered, query])

  const handleCreate = () => {
    openCreate()
  }

  const handleSubmit = (values: {
    title: string
    description?: string
    tags: string[]
    audience: string[]
    status: string
    text: string
  }) => {
    const now = new Date().toISOString()
    const vars = extractTemplateVariables(values.text)

        const next: SmsTemplate = editing
      ? {
          ...editing,
          title: values.title,
          description: values.description,
          tags: values.tags || [],
          audience: values.audience as SmsTemplate['audience'],
          status: values.status as SmsTemplate['status'],
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
          audience: values.audience as SmsTemplate['audience'],
          status: values.status as SmsTemplate['status'],
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

    message.success(editing ? MESSAGES.success.templateSmsUpdated : MESSAGES.success.templateSmsCreated)
    closeModal()
  }

  const openPreview = (row: SmsTemplate) => {
    setPreviewTarget(row)
    setPreviewOpen(true)
  }

  const closePreview = () => {
    setPreviewOpen(false)
    setPreviewTarget(null)
  }

  return (
    <div>
      <TemplateFilters
        query={query}
        onQueryChange={setQuery}
        status={status}
        onStatusChange={setStatus}
        onCreateClick={canWrite ? handleCreate : undefined}
        createButtonText="문자 양식 등록"
        searchPlaceholder="제목/설명/태그/내용 검색"
      />

      <SmsTemplateTable
        dataSource={smsFiltered}
        onPreview={openPreview}
        onEdit={canWrite ? openEdit : undefined}
        onCopyOriginal={(row) => copyText(row.content.text)}
        onCopyApplied={(row) => copyText(applyTemplateVariables(row.content.text, defaultSampleValues))}
        onCopyTemplate={canWrite ? handleCopyTemplate : undefined}
        onToggleArchive={canWrite ? handleArchiveToggle : undefined}
        canWrite={canWrite}
      />

      <SmsTemplateFormModal
        open={open}
        editing={editing}
        onCancel={closeModal}
        onSubmit={handleSubmit}
      />

      <SmsTemplatePreviewModal
        open={previewOpen}
        previewTarget={previewTarget}
        onClose={closePreview}
      />
    </div>
  )
}

