import { useCallback, useEffect, useState } from 'react'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import type { MailTemplateItem } from '@/features/notifications/model/mail-template/types'
import type { MailPreviewRecipient } from '@/features/notifications/model/mail-template/preview'
import { MAIL_SEND_DEFAULT_PROGRAM_ID, MAIL_SEND_DEFAULT_SENDER } from '@/features/notifications/model/mail-send/mock'
import { mailSendUseTemplate } from '@/features/notifications/model/mail-send/flags'
import { buildMailSendPayload, validateMailSendDraft } from '@/features/notifications/model/mail-send/payload'
import {
  createManualRecipient,
  mergeMailSendRecipients,
} from '@/features/notifications/model/mail-send/recipients'
import { MAIL_SEND_PURPOSE, type MailSendRecipient, type MailSendTiming } from '@/features/notifications/model/mail-send/types'
import {
  EMPTY_MAIL_COMPOSE,
  useMailCompose,
  type MailComposeInitial,
} from '@/features/notifications/ui/mail-template/use-compose'

const VARIABLE_LOCKED_MESSAGE = '전체 프로그램 선택 시 변수값을 사용할 수 없습니다.'

export function useMailSendForm(open: boolean) {
  const [programId, setProgramId] = useState(MAIL_SEND_DEFAULT_PROGRAM_ID)
  const [templateId, setTemplateId] = useState<string | undefined>()
  const [senderName, setSenderName] = useState<string>(MAIL_SEND_DEFAULT_SENDER.name)
  const [senderEmail, setSenderEmail] = useState<string>(MAIL_SEND_DEFAULT_SENDER.email)
  const [sendTiming, setSendTiming] = useState<MailSendTiming>('immediate')
  const [scheduledAt, setScheduledAt] = useState<Dayjs | null>(null)
  const [composeInitial, setComposeInitial] = useState<MailComposeInitial>(EMPTY_MAIL_COMPOSE)
  const [composeNonce, setComposeNonce] = useState(0)
  const [recipients, setRecipients] = useState<MailSendRecipient[]>([])

  const resetKey = open ? `send-${composeNonce}` : 'closed'
  const compose = useMailCompose(open, resetKey, composeInitial)

  useEffect(() => {
    if (!open) return
    setProgramId(MAIL_SEND_DEFAULT_PROGRAM_ID)
    setTemplateId(undefined)
    setSenderName(MAIL_SEND_DEFAULT_SENDER.name)
    setSenderEmail(MAIL_SEND_DEFAULT_SENDER.email)
    setSendTiming('immediate')
    setScheduledAt(null)
    setComposeInitial(EMPTY_MAIL_COMPOSE)
    setComposeNonce(key => key + 1)
    setRecipients([])
  }, [open])

  const applyTemplate = useCallback((template: MailTemplateItem) => {
    setTemplateId(template.id)
    setSenderName(template.senderName)
    setSenderEmail(template.senderEmail)
    setComposeInitial({
      subject: template.subject,
      bodyHtml: template.bodyHtml,
      attachmentFileNames: [...template.attachmentFileNames],
    })
    setComposeNonce(key => key + 1)
  }, [])

  const addRecipients = useCallback((incoming: MailSendRecipient[]) => {
    setRecipients(prev => mergeMailSendRecipients(prev, incoming))
  }, [])

  const addManualEmails = useCallback((emails: string[]) => {
    setRecipients(prev => mergeMailSendRecipients(prev, emails.map(createManualRecipient)))
  }, [])

  const removeRecipients = useCallback((ids: string[]) => {
    const remove = new Set(ids)
    setRecipients(prev => prev.filter(item => !remove.has(item.id)))
  }, [])

  const getDraft = useCallback(() => {
    return buildMailSendPayload({
      programId,
      templateId,
      purpose: MAIL_SEND_PURPOSE,
      useTemplate: mailSendUseTemplate(templateId),
      senderName,
      senderEmail,
      sendTiming,
      scheduledAt: scheduledAt ? scheduledAt.toISOString() : null,
      subject: compose.subject,
      bodyHtml: compose.getBodyHtml(),
      attachmentFileNames: compose.attachmentFileNames,
      recipients,
    })
  }, [
    compose,
    programId,
    recipients,
    scheduledAt,
    sendTiming,
    senderEmail,
    senderName,
    templateId,
  ])

  const validateRequired = useCallback(() => validateMailSendDraft(getDraft()), [getDraft])

  const getPreviewRecipient = useCallback((): MailPreviewRecipient | undefined => {
    if (recipients.length === 0) return { name: '', email: '', extraCount: 0 }
    const first = recipients[0]
    if (!first) return { name: '', email: '', extraCount: 0 }
    return {
      name: first.name,
      email: first.email,
      extraCount: Math.max(0, recipients.length - 1),
    }
  }, [recipients])

  const getPreviewAt = useCallback(() => {
    if (sendTiming === 'scheduled' && scheduledAt) return scheduledAt.toISOString()
    return dayjs().toISOString()
  }, [scheduledAt, sendTiming])

  return {
    editor: compose.editor,
    editorMinHeight: compose.editorMinHeight,
    subjectMaxLength: compose.subjectMaxLength,
    variableLockedMessage: VARIABLE_LOCKED_MESSAGE,
    subjectInputRef: compose.subjectInputRef,
    programId,
    templateId,
    senderName,
    senderEmail,
    sendTiming,
    scheduledAt,
    subject: compose.subject,
    attachmentFileNames: compose.attachmentFileNames,
    recipients,
    setProgramId,
    setSenderName,
    setSenderEmail,
    setSendTiming,
    setScheduledAt,
    handleSubjectChange: compose.handleSubjectChange,
    rememberSubjectRange: compose.rememberSubjectRange,
    insertVariable: compose.insertVariable,
    handleAttachmentAdd: compose.handleAttachmentAdd,
    handleAttachmentRemove: compose.handleAttachmentRemove,
    applyTemplate,
    addRecipients,
    addManualEmails,
    removeRecipients,
    getDraft,
    getPreviewAttachments: compose.getPreviewAttachments,
    getPreviewRecipient,
    getPreviewAt,
    validateRequired,
  }
}
