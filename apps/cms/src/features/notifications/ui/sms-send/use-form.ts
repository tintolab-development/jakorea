import { useCallback, useEffect, useRef, useState } from 'react'
import type { Dayjs } from 'dayjs'
import {
  buildSmsSendPayload,
  validateSmsSendDraft,
} from '@/features/notifications/model/sms-send/payload'
import { mergeSmsSendRecipients } from '@/features/notifications/model/sms-send/recipients'
import {
  SMS_SEND_DEFAULT_PROGRAM_ID,
  type SmsSendDraft,
  type SmsSendRecipient,
  type SmsSendTiming,
} from '@/features/notifications/model/sms-send/types'
import type { SmsTemplateItem } from '@/features/notifications/model/sms-template/types'

const SMS_BODY_BYTE_LIMIT = 90
const LMS_MMS_BODY_BYTE_LIMIT = 2000

export function useSmsSendForm(open: boolean, initialTemplateId?: string) {
  const [programId, setProgramId] = useState(SMS_SEND_DEFAULT_PROGRAM_ID)
  const [templateId, setTemplateId] = useState<string | undefined>(initialTemplateId)
  const [senderPhone, setSenderPhone] = useState('')
  const [messageType, setMessageType] = useState<SmsTemplateItem['messageType']>('SMS')
  const [attachmentFileNames, setAttachmentFileNames] = useState<string[]>([])
  const [sendTiming, setSendTiming] = useState<SmsSendTiming>('immediate')
  const [scheduledAt, setScheduledAt] = useState<Dayjs | null>(null)
  const [recipients, setRecipients] = useState<SmsSendRecipient[]>([])
  /** 템플릿 적용·모달 오픈 리셋 시에만 증가 (타이핑과 무관) */
  const [composeVersion, setComposeVersion] = useState(0)
  const [composeSeed, setComposeSeed] = useState({ subject: '', bodyText: '' })

  const subjectRef = useRef('')
  const bodyTextRef = useRef('')

  useEffect(() => {
    if (!open) return
    setProgramId(SMS_SEND_DEFAULT_PROGRAM_ID)
    setTemplateId(initialTemplateId)
    setSenderPhone('')
    setMessageType('SMS')
    setAttachmentFileNames([])
    setSendTiming('immediate')
    setScheduledAt(null)
    setRecipients([])
    subjectRef.current = ''
    bodyTextRef.current = ''
    setComposeSeed({ subject: '', bodyText: '' })
    setComposeVersion(version => version + 1)
  }, [initialTemplateId, open])

  const applyTemplate = useCallback((template: SmsTemplateItem) => {
    setTemplateId(template.id)
    setSenderPhone(template.senderPhone)
    setMessageType(template.messageType)
    setAttachmentFileNames([...template.attachmentFileNames])
    subjectRef.current = template.subject
    bodyTextRef.current = template.bodyText
    setComposeSeed({ subject: template.subject, bodyText: template.bodyText })
    setComposeVersion(version => version + 1)
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
      subject: subjectRef.current,
      bodyText: bodyTextRef.current,
      attachmentFileNames,
      sendTiming,
      scheduledAt: scheduledAt ? scheduledAt.toISOString() : null,
      recipients,
    })
  }, [
    attachmentFileNames,
    messageType,
    programId,
    recipients,
    scheduledAt,
    sendTiming,
    senderPhone,
    templateId,
  ])

  const validateRequired = useCallback(() => validateSmsSendDraft(getDraft()), [getDraft])

  const bodyByteLimit = messageType === 'SMS' ? SMS_BODY_BYTE_LIMIT : LMS_MMS_BODY_BYTE_LIMIT
  const showSubject = messageType !== 'SMS'

  const readComposeSnapshot = useCallback(
    () => ({
      subject: subjectRef.current,
      bodyText: bodyTextRef.current,
    }),
    []
  )

  return {
    programId,
    templateId,
    senderPhone,
    messageType,
    attachmentFileNames,
    sendTiming,
    scheduledAt,
    recipients,
    bodyByteLimit,
    showSubject,
    composeVersion,
    composeSeed,
    subjectRef,
    bodyTextRef,
    setProgramId,
    setSenderPhone,
    setSendTiming,
    setScheduledAt,
    setRecipients,
    applyTemplate,
    addRecipients,
    replaceManualRecipients,
    removeRecipients,
    getDraft,
    validateRequired,
    readComposeSnapshot,
  }
}
