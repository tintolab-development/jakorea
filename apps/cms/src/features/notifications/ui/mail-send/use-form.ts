import { useCallback, useEffect, useRef, useState } from 'react'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import type { MailTemplateItem } from '@/features/notifications/model/mail-template/types'
import type { MailPreviewRecipient } from '@/features/notifications/model/mail-template/preview'
import { mailSendUseTemplate } from '@/features/notifications/model/mail-send/flags'
import { buildMailSendPayload, validateMailSendDraft } from '@/features/notifications/model/mail-send/payload'
import {
  createManualRecipient,
  mergeMailSendRecipients,
} from '@/features/notifications/model/mail-send/recipients'
import {
  MAIL_SEND_DEFAULT_PROGRAM_ID,
  MAIL_SEND_DEFAULT_SENDER,
  MAIL_SEND_PURPOSE,
  type MailSendRecipient,
  type MailSendTiming,
} from '@/features/notifications/model/mail-send/types'
import {
  EMPTY_MAIL_COMPOSE,
  useMailCompose,
  type MailComposeInitial,
} from '@/features/notifications/ui/mail-template/use-compose'

export function useMailSendForm(open: boolean) {
  const [programId, setProgramId] = useState(MAIL_SEND_DEFAULT_PROGRAM_ID)
  const [templateId, setTemplateId] = useState<string | undefined>()
  /** 입력 중 부모(수신자 테이블 등) 리렌더 방지 */
  const senderNameRef = useRef<string>(MAIL_SEND_DEFAULT_SENDER.name)
  const [senderNameSeed, setSenderNameSeed] = useState<string>(MAIL_SEND_DEFAULT_SENDER.name)
  const [senderNameEpoch, setSenderNameEpoch] = useState(0)
  const [senderEmail, setSenderEmail] = useState<string>(MAIL_SEND_DEFAULT_SENDER.email)
  const [sendTiming, setSendTiming] = useState<MailSendTiming>('immediate')
  const [scheduledAt, setScheduledAt] = useState<Dayjs | null>(null)
  const [composeInitial, setComposeInitial] = useState<MailComposeInitial>(EMPTY_MAIL_COMPOSE)
  const [composeNonce, setComposeNonce] = useState(0)
  const [recipients, setRecipients] = useState<MailSendRecipient[]>([])

  const resetKey = open ? `send-${composeNonce}` : 'closed'
  const compose = useMailCompose(open, resetKey, composeInitial)

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
    setProgramId(MAIL_SEND_DEFAULT_PROGRAM_ID)
    setTemplateId(undefined)
    replaceSenderName(MAIL_SEND_DEFAULT_SENDER.name)
    setSenderEmail(MAIL_SEND_DEFAULT_SENDER.email)
    setSendTiming('immediate')
    setScheduledAt(null)
    setComposeInitial(EMPTY_MAIL_COMPOSE)
    setComposeNonce(key => key + 1)
    setRecipients([])
  }, [open, replaceSenderName])

  const applyTemplate = useCallback(
    (template: MailTemplateItem) => {
      setTemplateId(template.id)
      // senderName이 빈 템플릿이면 기존 harvest 시드를 지우지 않음 (fullpage에서 보강)
      if (template.senderName.trim()) {
        replaceSenderName(template.senderName)
      }
      if (template.senderEmail.trim()) {
        setSenderEmail(template.senderEmail)
      }
      setComposeInitial({
        subject: template.subject,
        bodyHtml: template.bodyHtml,
        attachmentFileNames: [...template.attachmentFileNames],
      })
      setComposeNonce(key => key + 1)
    },
    [replaceSenderName]
  )

  const clearTemplate = useCallback(() => {
    setTemplateId(undefined)
    setComposeInitial(EMPTY_MAIL_COMPOSE)
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

  const clearRecipients = useCallback(() => {
    setRecipients([])
  }, [])

  const getDraft = useCallback(() => {
    return buildMailSendPayload({
      programId,
      templateId,
      purpose: MAIL_SEND_PURPOSE,
      useTemplate: mailSendUseTemplate(templateId),
      senderName: senderNameRef.current,
      senderEmail,
      sendTiming,
      scheduledAt: scheduledAt ? scheduledAt.toISOString() : null,
      subject: compose.getSubject(),
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
    subjectInputRef: compose.subjectInputRef,
    programId,
    templateId,
    senderNameSeed,
    senderNameEpoch,
    senderEmail,
    sendTiming,
    scheduledAt,
    subject: compose.subject,
    attachmentFileNames: compose.attachmentFileNames,
    recipients,
    setProgramId,
    setSenderName,
    replaceSenderName,
    setSenderEmail,
    setSendTiming,
    setScheduledAt,
    handleSubjectChange: compose.handleSubjectChange,
    rememberSubjectRange: compose.rememberSubjectRange,
    insertVariable: compose.insertVariable,
    handleAttachmentAdd: compose.handleAttachmentAdd,
    handleAttachmentRemove: compose.handleAttachmentRemove,
    applyTemplate,
    clearTemplate,
    addRecipients,
    addManualEmails,
    removeRecipients,
    clearRecipients,
    getDraft,
    getPreviewAttachments: compose.getPreviewAttachments,
    getPreviewRecipient,
    getPreviewAt,
    validateRequired,
  }
}
