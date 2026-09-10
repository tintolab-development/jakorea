import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { MailTemplateItem, MailTemplateFormMode } from '@/features/notifications/model/mail-template/types'
import {
  MAIL_TEMPLATE_DEFAULT_SENDER_EMAIL,
  validateMailSenderEmail,
  type ValidateMailSenderEmailOptions,
} from '@/features/notifications/model/mail-template/sender-email'
import {
  sanitizeMailTemplateNameInput,
  validateMailTemplateName,
} from '@/features/notifications/model/mail-template/template-name'
import { EMPTY_MAIL_COMPOSE, useMailCompose } from './use-compose'

export type { MailTemplateFormMode } from '@/features/notifications/model/mail-template/types'

export type MailTemplateFormDraft = {
  templateName: string
  senderName: string
  senderEmail: string
  subject: string
  bodyHtml: string
  attachmentFileNames: string[]
  newFiles: File[]
  removedAttachmentIds: number[]
}

const EMPTY_DRAFT: MailTemplateFormDraft = {
  templateName: '',
  senderName: '',
  senderEmail: MAIL_TEMPLATE_DEFAULT_SENDER_EMAIL,
  ...EMPTY_MAIL_COMPOSE,
  newFiles: [],
  removedAttachmentIds: [],
}

export function draftFromTemplate(template: MailTemplateItem | null): MailTemplateFormDraft {
  if (!template) return { ...EMPTY_DRAFT }
  return {
    templateName: sanitizeMailTemplateNameInput(template.templateName),
    senderName: template.senderName,
    senderEmail: template.senderEmail,
    subject: template.subject,
    bodyHtml: template.bodyHtml,
    attachmentFileNames: [...template.attachmentFileNames],
    newFiles: [],
    removedAttachmentIds: [],
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
      existingAttachments: mode === 'edit' ? template?.attachments ?? [] : [],
    }),
    [initialDraft, mode, template?.attachments]
  )

  const [templateName, setTemplateNameState] = useState(initialDraft.templateName)
  /** 입력 중 부모 리렌더 방지 — 제목(subject)과 동일하게 ref만 갱신 */
  const senderNameRef = useRef(initialDraft.senderName)
  const [senderNameSeed, setSenderNameSeed] = useState(initialDraft.senderName)
  const [senderNameEpoch, setSenderNameEpoch] = useState(0)
  const [senderEmail, setSenderEmail] = useState(initialDraft.senderEmail)
  const compose = useMailCompose(open, resetKey, composeInitial)

  const setTemplateName = useCallback((value: string, options?: { composing?: boolean }) => {
    if (options?.composing) {
      setTemplateNameState(value)
      return
    }
    setTemplateNameState(sanitizeMailTemplateNameInput(value))
  }, [])

  const setSenderName = useCallback((value: string) => {
    senderNameRef.current = value
  }, [])

  const replaceSenderName = useCallback((value: string) => {
    senderNameRef.current = value
    setSenderNameSeed(value)
    setSenderNameEpoch(key => key + 1)
  }, [])

  useEffect(() => {
    if (!open) return
    const next = draftFromTemplate(mode === 'edit' ? template : null)
    setTemplateNameState(next.templateName)
    replaceSenderName(next.senderName)
    setSenderEmail(next.senderEmail)
    // 모달 open / 편집 대상 변경 시에만 리셋
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional session-scoped reset
  }, [open, mode, template?.id])

  const getDraft = useCallback((): MailTemplateFormDraft => {
    return {
      templateName: templateName.trim(),
      senderName: senderNameRef.current.trim(),
      senderEmail: senderEmail.trim(),
      subject: compose.getSubject().trim(),
      bodyHtml: compose.getBodyHtml(),
      attachmentFileNames: compose.attachmentFileNames,
      newFiles: compose.getNewFiles(),
      removedAttachmentIds: compose.getRemovedAttachmentIds(),
    }
  }, [compose, senderEmail, templateName])

  const validateRequired = useCallback(
    (senderOptions?: ValidateMailSenderEmailOptions): string | null => {
      const draft = getDraft()
      const nameError = validateMailTemplateName(draft.templateName)
      if (nameError) return nameError
      const senderError = validateMailSenderEmail(draft.senderEmail, senderOptions)
      if (senderError) return senderError
      if (!draft.subject) return '제목을 작성하세요.'
      if (!draft.bodyHtml) return '내용을 작성하세요.'
      return null
    },
    [getDraft]
  )

  return {
    editor: compose.editor,
    editorMinHeight: compose.editorMinHeight,
    subjectMaxLength: compose.subjectMaxLength,
    subjectInputRef: compose.subjectInputRef,
    templateName,
    senderNameSeed,
    senderNameEpoch,
    senderEmail,
    subject: compose.subject,
    attachmentFileNames: compose.attachmentFileNames,
    setTemplateName,
    setSenderName,
    replaceSenderName,
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
