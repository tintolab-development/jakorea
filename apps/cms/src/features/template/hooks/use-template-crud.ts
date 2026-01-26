import { useState } from 'react'
import { message } from 'antd'
import { MESSAGES } from '@/shared/constants/messages'
import type { EmailTemplate, SmsTemplate } from '@/types/template'

type TemplateType = EmailTemplate | SmsTemplate

export function useTemplateCRUD<T extends TemplateType>(
  _initialRows: T[],
  setRows: (updater: (prev: T[]) => T[]) => void,
  getNextId: () => string
) {
  const [editing, setEditing] = useState<T | null>(null)
  const [open, setOpen] = useState(false)

  const openCreate = () => {
    setEditing(null)
    setOpen(true)
  }

  const openEdit = (row: T) => {
    setEditing(row)
    setOpen(true)
  }

  const closeModal = () => {
    setOpen(false)
    setEditing(null)
  }

  const handleArchiveToggle = (row: T) => {
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

  const handleCopyTemplate = (row: T) => {
    const now = new Date().toISOString()
    const copiedTemplate: T = {
      ...row,
      id: getNextId(),
      title: `${row.title} (복사본)`,
      status: 'draft',
      updatedAt: now,
      updatedBy: '관리자(운영)',
    } as T

    setRows(prev => [copiedTemplate, ...prev])
    message.success(MESSAGES.success.templateCopied)
    openEdit(copiedTemplate)
  }

  return {
    editing,
    open,
    openCreate,
    openEdit,
    closeModal,
    handleArchiveToggle,
    handleCopyTemplate,
  }
}
