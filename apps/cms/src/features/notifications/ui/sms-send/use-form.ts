import { useCallback, useEffect, useRef, useState } from 'react'
import type { Dayjs } from 'dayjs'
import type { SmsMessageType } from '@/features/notifications/api/adapters/sms-channel'
import {
  buildSmsSendPayload,
  estimateSmsSendBodyBytes,
  resolveSmsSendMessageTypeForBody,
  SMS_SEND_BODY_BYTE_LIMIT,
  SMS_SEND_LMS_MMS_BODY_BYTE_LIMIT,
  validateSmsSendDraft,
} from '@/features/notifications/model/sms-send/payload'
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
    setComposeVersion(version => version + 1)
  }, [initialTemplateId, open])

  const applyMessageType = useCallback((next: SmsMessageType) => {
    if (next === messageTypeRef.current) return
    setMessageType(next)
    messageTypeRef.current = next
    if (next === 'SMS') {
      subjectRef.current = ''
      setComposeSeed(prev => ({ ...prev, subject: '' }))
    }
  }, [])

  const applyTemplate = useCallback(
    (template: SmsTemplateItem) => {
      const hasAttachments = template.attachmentFileNames.length > 0
      const bodyBytes = estimateSmsSendBodyBytes(template.bodyText)
      const nextType = resolveSmsSendMessageTypeForBody({
        current: template.messageType,
        bodyBytes,
        hasAttachments,
      })
      setTemplateId(template.id)
      setSenderPhone(template.senderPhone)
      setMessageType(nextType)
      messageTypeRef.current = nextType
      setAttachmentFileNames([...template.attachmentFileNames])
      attachmentFileNamesRef.current = [...template.attachmentFileNames]
      subjectRef.current = template.subject
      bodyTextRef.current = template.bodyText
      setComposeSeed({ subject: template.subject, bodyText: template.bodyText })
      setComposeVersion(version => version + 1)
    },
    []
  )

  const clearTemplate = useCallback(() => {
    setTemplateId(undefined)
    setMessageType('SMS')
    messageTypeRef.current = 'SMS'
    setAttachmentFileNames([])
    attachmentFileNamesRef.current = []
    subjectRef.current = ''
    bodyTextRef.current = ''
    setComposeSeed({ subject: '', bodyText: '' })
    setComposeVersion(version => version + 1)
  }, [])

  /** 읽기 전용 유형 필드 — 본문 바이트·첨부에 맞춰 표시값만 갱신 */
  const syncMessageTypeToBodyBytes = useCallback(
    (bodyText: string) => {
      const next = resolveSmsSendMessageTypeForBody({
        current: messageTypeRef.current,
        bodyBytes: estimateSmsSendBodyBytes(bodyText),
        hasAttachments: attachmentFileNamesRef.current.length > 0,
      })
      applyMessageType(next)
    },
    [applyMessageType]
  )

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

  const bodyByteLimit =
    messageType === 'SMS' ? SMS_SEND_BODY_BYTE_LIMIT : SMS_SEND_LMS_MMS_BODY_BYTE_LIMIT
  const showSubject = messageType !== 'SMS'

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

  const insertVariable = useCallback(
    (label: string) => {
      if (lastComposeTargetRef.current === 'subject' && showSubject) {
        const range = subjectRangeRef.current
        const { next, caret } = insertMailVariableInText(
          subjectRef.current,
          label,
          range.start,
          range.end
        )
        subjectRef.current = next
        subjectRangeRef.current = { start: caret, end: caret }
        setComposeSeed(prev => ({ ...prev, subject: next }))
        setComposeVersion(version => version + 1)
        return
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
      setComposeVersion(version => version + 1)
      syncMessageTypeToBodyBytes(next)
    },
    [showSubject, syncMessageTypeToBodyBytes]
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
    clearTemplate,
    syncMessageTypeToBodyBytes,
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
