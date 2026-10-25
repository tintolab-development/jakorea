import { useCallback, useEffect, useRef, useState } from 'react'
import type { Dayjs } from 'dayjs'
import type { SmsMessageType } from '@/features/notifications/api/adapters/sms-channel'
import {
  buildSmsSendPayload,
  validateSmsSendDraft,
} from '@/features/notifications/model/sms-send/payload'
import {
  smsBodyByteLimit,
  smsComposeBlocksSend,
  collectSmsComposeFieldIssues,
} from '@/features/notifications/model/sms-send/text-bytes'
import { insertMailVariableInText } from '@/features/notifications/model/mail-template/insert-variable'
import { mergeSmsSendRecipients } from '@/features/notifications/model/sms-send/recipients'
import {
  SMS_SEND_DEFAULT_PROGRAM_ID,
  type SmsSendDraft,
  type SmsSendRecipient,
  type SmsSendTiming,
} from '@/features/notifications/model/sms-send/types'
import type { SmsTemplateItem } from '@/features/notifications/model/sms-template/types'

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
  const [composeBlocking, setComposeBlocking] = useState(true)

  const subjectRef = useRef('')
  const bodyTextRef = useRef('')
  const messageTypeRef = useRef<SmsMessageType>('SMS')
  const attachmentFileNamesRef = useRef<string[]>([])

  useEffect(() => {
    messageTypeRef.current = messageType
  }, [messageType])

  useEffect(() => {
    attachmentFileNamesRef.current = attachmentFileNames
  }, [attachmentFileNames])

  const lastComposeTargetRef = useRef<'subject' | 'body'>('body')
  const subjectRangeRef = useRef({ start: 0, end: 0 })
  const bodyRangeRef = useRef({ start: 0, end: 0 })

  useEffect(() => {
    if (!open) return
    setProgramId(SMS_SEND_DEFAULT_PROGRAM_ID)
    setTemplateId(initialTemplateId)
    setSenderPhone('')
    setMessageType('SMS')
    messageTypeRef.current = 'SMS'
    setAttachmentFileNames([])
    attachmentFileNamesRef.current = []
    setSendTiming('immediate')
    setScheduledAt(null)
    setRecipients([])
    subjectRef.current = ''
    bodyTextRef.current = ''
    lastComposeTargetRef.current = 'body'
    subjectRangeRef.current = { start: 0, end: 0 }
    bodyRangeRef.current = { start: 0, end: 0 }
    setComposeSeed({ subject: '', bodyText: '' })
    setComposeBlocking(true)
    setComposeVersion(version => version + 1)
  }, [initialTemplateId, open])

  const applyMessageType = useCallback((next: SmsMessageType) => {
    if (next === messageTypeRef.current) return
    setMessageType(next)
    messageTypeRef.current = next
    const issues = collectSmsComposeFieldIssues({
      messageType: next,
      subject: subjectRef.current,
      bodyText: bodyTextRef.current,
      attachmentCount: attachmentFileNamesRef.current.length,
    })
    setComposeBlocking(smsComposeBlocksSend(issues))
  }, [])

  const applyTemplate = useCallback((template: SmsTemplateItem) => {
    setTemplateId(template.id)
    setSenderPhone(template.senderPhone)
    setMessageType(template.messageType)
    messageTypeRef.current = template.messageType
    setAttachmentFileNames([...template.attachmentFileNames])
    attachmentFileNamesRef.current = [...template.attachmentFileNames]
    subjectRef.current = template.subject
    bodyTextRef.current = template.bodyText
    setComposeSeed({ subject: template.subject, bodyText: template.bodyText })
    const issues = collectSmsComposeFieldIssues({
      messageType: template.messageType,
      subject: template.subject,
      bodyText: template.bodyText,
      attachmentCount: template.attachmentFileNames.length,
    })
    setComposeBlocking(smsComposeBlocksSend(issues))
    setComposeVersion(version => version + 1)
  }, [])

  const clearTemplate = useCallback(() => {
    setTemplateId(undefined)
    setMessageType('SMS')
    messageTypeRef.current = 'SMS'
    setAttachmentFileNames([])
    attachmentFileNamesRef.current = []
    subjectRef.current = ''
    bodyTextRef.current = ''
    setComposeSeed({ subject: '', bodyText: '' })
    setComposeBlocking(true)
    setComposeVersion(version => version + 1)
  }, [])

  const removeAttachmentAt = useCallback((index: number) => {
    setAttachmentFileNames(prev => {
      const next = prev.filter((_, fileIndex) => fileIndex !== index)
      attachmentFileNamesRef.current = next
      const issues = collectSmsComposeFieldIssues({
        messageType: messageTypeRef.current,
        subject: subjectRef.current,
        bodyText: bodyTextRef.current,
        attachmentCount: next.length,
      })
      setComposeBlocking(smsComposeBlocksSend(issues))
      return next
    })
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

  const clearRecipients = useCallback(() => {
    setRecipients([])
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

  const bodyByteLimit = smsBodyByteLimit(messageType)
  const showSubject = messageType !== 'SMS' || subjectRef.current.trim().length > 0
  const showAttachments = attachmentFileNames.length > 0

  const readComposeSnapshot = useCallback(
    () => ({
      subject: subjectRef.current,
      bodyText: bodyTextRef.current,
    }),
    []
  )

  const rememberSubjectRange = useCallback((el: HTMLInputElement | null) => {
    if (!el) return
    lastComposeTargetRef.current = 'subject'
    subjectRangeRef.current = {
      start: el.selectionStart ?? el.value.length,
      end: el.selectionEnd ?? el.value.length,
    }
  }, [])

  const rememberBodyRange = useCallback((el: HTMLTextAreaElement | null) => {
    if (!el) return
    lastComposeTargetRef.current = 'body'
    bodyRangeRef.current = {
      start: el.selectionStart ?? el.value.length,
      end: el.selectionEnd ?? el.value.length,
    }
  }, [])

  const insertVariable = useCallback((label: string) => {
    if (lastComposeTargetRef.current === 'subject') {
      lastComposeTargetRef.current = 'body'
    }

    const range = bodyRangeRef.current
    const { next, caret } = insertMailVariableInText(
      bodyTextRef.current,
      label,
      range.start,
      range.end
    )
    bodyTextRef.current = next
    bodyRangeRef.current = { start: caret, end: caret }
    lastComposeTargetRef.current = 'body'
    setComposeSeed(prev => ({ ...prev, bodyText: next }))
    const issues = collectSmsComposeFieldIssues({
      messageType: messageTypeRef.current,
      subject: subjectRef.current,
      bodyText: next,
      attachmentCount: attachmentFileNamesRef.current.length,
    })
    setComposeBlocking(smsComposeBlocksSend(issues))
    setComposeVersion(version => version + 1)
  }, [])

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
    showAttachments,
    composeVersion,
    composeSeed,
    composeBlocking,
    subjectRef,
    bodyTextRef,
    setProgramId,
    setSenderPhone,
    setSendTiming,
    setScheduledAt,
    setRecipients,
    applyMessageType,
    applyTemplate,
    clearTemplate,
    removeAttachmentAt,
    setComposeBlocking,
    addRecipients,
    replaceManualRecipients,
    removeRecipients,
    clearRecipients,
    getDraft,
    validateRequired,
    readComposeSnapshot,
    rememberSubjectRange,
    rememberBodyRange,
    insertVariable,
  }
}
