import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Dayjs } from 'dayjs'
import { SMS_SEND_DEFAULT_PROGRAM_ID } from '@/features/notifications/model/sms-send/mock'
import {
  buildSmsSendPayload,
  estimateSmsSendBodyBytes,
  validateSmsSendDraft,
} from '@/features/notifications/model/sms-send/payload'
import { mergeSmsSendRecipients } from '@/features/notifications/model/sms-send/recipients'
import type {
  SmsSendDraft,
  SmsSendRecipient,
  SmsSendTiming,
} from '@/features/notifications/model/sms-send/types'
import type { SmsTemplateItem } from '@/features/notifications/model/sms-template/types'

const SMS_BODY_BYTE_LIMIT = 90
const LMS_MMS_BODY_BYTE_LIMIT = 2000

export function useSmsSendForm(open: boolean, initialTemplateId?: string) {
  const [programId, setProgramId] = useState(SMS_SEND_DEFAULT_PROGRAM_ID)
  const [templateId, setTemplateId] = useState<string | undefined>(initialTemplateId)
  const [senderPhone, setSenderPhone] = useState('')
  const [messageType, setMessageType] = useState<SmsTemplateItem['messageType']>('SMS')
  const [subject, setSubject] = useState('')
  const [bodyText, setBodyText] = useState('')
  const [attachmentFileNames, setAttachmentFileNames] = useState<string[]>([])
  const [sendTiming, setSendTiming] = useState<SmsSendTiming>('immediate')
  const [scheduledAt, setScheduledAt] = useState<Dayjs | null>(null)
  const [recipients, setRecipients] = useState<SmsSendRecipient[]>([])

  useEffect(() => {
    if (!open) return
    setProgramId(SMS_SEND_DEFAULT_PROGRAM_ID)
    setTemplateId(initialTemplateId)
    setSenderPhone('')
    setMessageType('SMS')
    setSubject('')
    setBodyText('')
    setAttachmentFileNames([])
    setSendTiming('immediate')
    setScheduledAt(null)
    setRecipients([])
  }, [initialTemplateId, open])

  const applyTemplate = useCallback((template: SmsTemplateItem) => {
    setTemplateId(template.id)
    setSenderPhone(template.senderPhone)
    setMessageType(template.messageType)
    setSubject(template.subject)
    setBodyText(template.bodyText)
    setAttachmentFileNames([...template.attachmentFileNames])
  }, [])

  const addRecipients = useCallback((incoming: SmsSendRecipient[]) => {
    setRecipients(prev => mergeSmsSendRecipients(prev, incoming))
  }, [])

  const replaceManualRecipients = useCallback((manualRecipients: SmsSendRecipient[]) => {
    setRecipients(prev => {
      const withoutManual = prev.filter(item => item.source !== 'manual')
      return mergeSmsSendRecipients(withoutManual, manualRecipients)
    })
  }, [])

  const removeRecipients = useCallback((ids: string[]) => {
    const removeIds = new Set(ids)
    setRecipients(prev => prev.filter(item => !removeIds.has(item.id)))
  }, [])

  const getDraft = useCallback((): SmsSendDraft => {
    return buildSmsSendPayload({
      programId,
      templateId,
      senderPhone,
      messageType,
      subject,
      bodyText,
      attachmentFileNames,
      sendTiming,
      scheduledAt: scheduledAt ? scheduledAt.toISOString() : null,
      recipients,
    })
  }, [
    attachmentFileNames,
    bodyText,
    messageType,
    programId,
    recipients,
    scheduledAt,
    sendTiming,
    senderPhone,
    subject,
    templateId,
  ])

  const validateRequired = useCallback(() => validateSmsSendDraft(getDraft()), [getDraft])

  const bodyByteLength = useMemo(() => estimateSmsSendBodyBytes(bodyText), [bodyText])
  const bodyByteLimit = messageType === 'SMS' ? SMS_BODY_BYTE_LIMIT : LMS_MMS_BODY_BYTE_LIMIT
  const showSubject = messageType !== 'SMS'

  return {
    programId,
    templateId,
    senderPhone,
    messageType,
    subject,
    bodyText,
    attachmentFileNames,
    sendTiming,
    scheduledAt,
    recipients,
    bodyByteLength,
    bodyByteLimit,
    showSubject,
    setProgramId,
    setSenderPhone,
    setSubject,
    setBodyText,
    setSendTiming,
    setScheduledAt,
    setRecipients,
    applyTemplate,
    addRecipients,
    replaceManualRecipients,
    removeRecipients,
    getDraft,
    validateRequired,
  }
}
