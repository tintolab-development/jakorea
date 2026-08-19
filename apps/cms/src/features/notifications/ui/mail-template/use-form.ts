import { useCallback, useEffect, useMemo, useState } from 'react'
import type { MailTemplateItem, MailTemplateFormMode } from '@/features/notifications/model/mail-template/types'
import { EMPTY_MAIL_COMPOSE, useMailCompose } from './use-compose'

export type { MailTemplateFormMode } from '@/features/notifications/model/mail-template/types'

export type MailTemplateFormDraft = {
  templateName: string
  senderName: string
  senderEmail: string
  subject: string
  bodyHtml: string
  attachmentFileNames: string[]
}

const EMPTY_DRAFT: MailTemplateFormDraft = {
  templateName: '',
  senderName: '',
  senderEmail: '',
  ...EMPTY_MAIL_COMPOSE,
}

export function draftFromTemplate(template: MailTemplateItem | null): MailTemplateFormDraft {
  if (!template) return { ...EMPTY_DRAFT }
  return {
    templateName: template.templateName,
    senderName: template.senderName,
    senderEmail: template.senderEmail,
    subject: template.subject,
    bodyHtml: template.bodyHtml,
    attachmentFileNames: [...template.attachmentFileNames],
  }
}

export function useMailTemplateForm(
  open: boolean,
  mode: MailTemplateFormMode,
  template: MailTemplateItem | null
) {
  const initialDraft = useMemo(
    () => draftFromTemplate(mode === 'edit' ? template : null),
    [mode, template]
  )
  const resetKey = useMemo(
    () => (open ? `${mode}-${template?.id ?? 'new'}` : 'closed'),
    [open, mode, template?.id]
  )
  const composeInitial = useMemo(
    () => ({
      subject: initialDraft.subject,
      bodyHtml: initialDraft.bodyHtml,
      attachmentFileNames: initialDraft.attachmentFileNames,
    }),
    [initialDraft]
  )

  const [templateName, setTemplateName] = useState(initialDraft.templateName)
  const [senderName, setSenderName] = useState(initialDraft.senderName)
  const [senderEmail, setSenderEmail] = useState(initialDraft.senderEmail)
  const compose = useMailCompose(open, resetKey, composeInitial)

  useEffect(() => {
    if (!open) return
    const next = draftFromTemplate(mode === 'edit' ? template : null)
    setTemplateName(next.templateName)
    setSenderName(next.senderName)
    setSenderEmail(next.senderEmail)
  }, [open, mode, template])

  const getDraft = useCallback((): MailTemplateFormDraft => {
    return {
      templateName: templateName.trim(),
      senderName: senderName.trim(),
      senderEmail: senderEmail.trim(),
      subject: compose.subject.trim(),
      bodyHtml: compose.getBodyHtml(),
      attachmentFileNames: compose.attachmentFileNames,
    }
  }, [compose, senderEmail, senderName, templateName])

  const validateRequired = useCallback((): string | null => {
    const draft = getDraft()
    if (!draft.templateName) return '템플릿명을 입력하세요.'
    if (!draft.senderEmail) return '발신 메일을 입력하세요.'
    if (!draft.subject) return '제목을 작성하세요.'
    if (!draft.bodyHtml) return '내용을 작성하세요.'
    return null
  }, [getDraft])

  return {
    editor: compose.editor,
    editorMinHeight: compose.editorMinHeight,
    subjectMaxLength: compose.subjectMaxLength,
    subjectInputRef: compose.subjectInputRef,
    templateName,
    senderName,
    senderEmail,
    subject: compose.subject,
    attachmentFileNames: compose.attachmentFileNames,
    setTemplateName,
    setSenderName,
    setSenderEmail,
    handleSubjectChange: compose.handleSubjectChange,
    rememberSubjectRange: compose.rememberSubjectRange,
    insertVariable: compose.insertVariable,
    handleAttachmentAdd: compose.handleAttachmentAdd,
    handleAttachmentRemove: compose.handleAttachmentRemove,
    getDraft,
    getPreviewAttachments: compose.getPreviewAttachments,
    validateRequired,
  }
}
