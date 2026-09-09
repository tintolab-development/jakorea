import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { InputRef } from 'antd'
import type { TextAreaRef } from 'antd/es/input/TextArea'
import { insertMailVariableInText } from '@/features/notifications/model/mail-template/insert-variable'
import {
  rejectSmsMmsAttachments,
  smsMmsAttachmentRejectMessage,
} from '@/features/notifications/model/sms-template/attachments'
import {
  sanitizeSmsTemplateNameInput,
  validateSmsTemplateName,
} from '@/features/notifications/model/sms-template/template-name'
import {
  SMS_ROOT_CATEGORY_ID,
  type SmsTemplateAttachment,
  type SmsTemplateFormMode,
  type SmsTemplateItem,
} from '@/features/notifications/model/sms-template/types'

export type { SmsTemplateFormMode } from '@/features/notifications/model/sms-template/types'

export type SmsTemplateFormDraft = {
  categoryId: string
  templateName: string
  senderPhone: string
  messageType: 'SMS' | 'LMS' | 'MMS'
  subject: string
  bodyText: string
  attachmentFileNames: string[]
  newFiles: File[]
}

type InsertTarget = 'subject' | 'body'

type SelectionRange = {
  start: number
  end: number
}

const EMPTY_DRAFT: SmsTemplateFormDraft = {
  categoryId: SMS_ROOT_CATEGORY_ID,
  templateName: '',
  senderPhone: '',
  messageType: 'SMS',
  subject: '',
  bodyText: '',
  attachmentFileNames: [],
  newFiles: [],
}

export const SMS_SUBJECT_MAX_LENGTH = 40
const SMS_BODY_BYTE_LIMIT = 90
const LMS_MMS_BODY_BYTE_LIMIT = 2000

function normalizeCategoryId(value: string | null | undefined): string {
  const trimmed = value?.trim() ?? ''
  if (!trimmed || trimmed.startsWith('unclassified-')) return SMS_ROOT_CATEGORY_ID
  return trimmed
}

export function estimateSmsBodyBytes(text: string): number {
  let bytes = 0
  for (const ch of text) {
    bytes += ch.charCodeAt(0) <= 0x7f ? 1 : 2
  }
  return bytes
}

export function draftFromTemplate(
  template: SmsTemplateItem | null,
  categoryId?: string | null
): SmsTemplateFormDraft {
  if (!template) {
    return {
      ...EMPTY_DRAFT,
      categoryId: normalizeCategoryId(categoryId),
    }
  }
  return {
    categoryId: normalizeCategoryId(categoryId ?? template.categoryId),
    templateName: sanitizeSmsTemplateNameInput(template.templateName),
    senderPhone: template.senderPhone,
    messageType: template.messageType,
    subject: template.subject.slice(0, SMS_SUBJECT_MAX_LENGTH),
    bodyText: template.bodyText,
    attachmentFileNames: [...template.attachmentFileNames],
    newFiles: [],
  }
}

function getTextareaElement(ref: TextAreaRef | null): HTMLTextAreaElement | null {
  if (!ref) return null
  const textarea = (
    ref as TextAreaRef & {
      resizableTextArea?: { textArea?: HTMLTextAreaElement | null }
    }
  ).resizableTextArea?.textArea
  return textarea ?? null
}

export function useSmsTemplateForm(
  open: boolean,
  mode: SmsTemplateFormMode,
  template: SmsTemplateItem | null,
  initialCategoryId?: string | null
) {
  const initialDraft = useMemo(
    () => draftFromTemplate(mode === 'edit' ? template : null, initialCategoryId),
    [initialCategoryId, mode, template]
  )
  const resetKey = useMemo(
    () => (open ? `${mode}-${template?.id ?? 'new'}` : 'closed'),
    [mode, open, template?.id]
  )

  const [categoryId, setCategoryId] = useState(initialDraft.categoryId)
  const [templateName, setTemplateNameState] = useState(initialDraft.templateName)
  const [senderPhone, setSenderPhone] = useState(initialDraft.senderPhone)
  const [messageType, setMessageType] = useState<SmsTemplateFormDraft['messageType']>(
    initialDraft.messageType
  )
  const [subject, setSubjectState] = useState(initialDraft.subject)
  const [bodyText, setBodyText] = useState(initialDraft.bodyText)
  const [attachmentFileNames, setAttachmentFileNames] = useState(initialDraft.attachmentFileNames)
  const [newFiles, setNewFiles] = useState<File[]>([])

  const subjectInputRef = useRef<InputRef>(null)
  const bodyTextRef = useRef<TextAreaRef>(null)
  const lastTargetRef = useRef<InsertTarget>('body')
  const subjectRangeRef = useRef<SelectionRange>({ start: 0, end: 0 })
  const bodyRangeRef = useRef<SelectionRange>({ start: 0, end: 0 })
  const existingAttachmentsRef = useRef<SmsTemplateAttachment[]>(template?.attachments ?? [])
  const subjectRef = useRef(subject)
  const bodyTextRefValue = useRef(bodyText)
  const newFilesRef = useRef(newFiles)
  const attachmentFileNamesRef = useRef(attachmentFileNames)

  subjectRef.current = subject
  bodyTextRefValue.current = bodyText
  newFilesRef.current = newFiles
  attachmentFileNamesRef.current = attachmentFileNames

  const showSubject = messageType !== 'SMS'
  const showAttachments = messageType === 'MMS'
  const attachmentsEnabled = messageType === 'MMS'
  const bodyByteLength = useMemo(() => estimateSmsBodyBytes(bodyText), [bodyText])
  const bodyByteLimit = messageType === 'SMS' ? SMS_BODY_BYTE_LIMIT : LMS_MMS_BODY_BYTE_LIMIT
  const bodyCounterLabel = '문자내용'

  const setTemplateName = useCallback((value: string, options?: { composing?: boolean }) => {
    // IME 조합 중 sanitize하면 한글 자모가 지워져 입력이 막힘 → 조합 종료 후 sanitize
    if (options?.composing) {
      setTemplateNameState(value)
      return
    }
    setTemplateNameState(sanitizeSmsTemplateNameInput(value))
  }, [])

  const setSubject = useCallback((value: string) => {
    setSubjectState(value.slice(0, SMS_SUBJECT_MAX_LENGTH))
  }, [])

  useEffect(() => {
    if (!open) return
    const next = draftFromTemplate(mode === 'edit' ? template : null, initialCategoryId)
    existingAttachmentsRef.current = template?.attachments ?? []
    setCategoryId(next.categoryId)
    setTemplateNameState(next.templateName)
    setSenderPhone(next.senderPhone)
    setMessageType(next.messageType)
    setSubjectState(next.subject)
    setBodyText(next.bodyText)
    setAttachmentFileNames(next.attachmentFileNames)
    setNewFiles([])
    lastTargetRef.current = 'body'
    subjectRangeRef.current = { start: 0, end: 0 }
    bodyRangeRef.current = { start: 0, end: 0 }
    // 모달 세션(open/resetKey)이 바뀔 때만 리셋 — 입력 중 initialCategoryId·template 참조 변경으로 값이 지워지지 않게
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional session-scoped reset
  }, [open, resetKey])

  const rememberSubjectRange = useCallback((el: HTMLInputElement | null) => {
    if (!el) return
    lastTargetRef.current = 'subject'
    subjectRangeRef.current = {
      start: el.selectionStart ?? el.value.length,
      end: el.selectionEnd ?? el.value.length,
    }
  }, [])

  const rememberBodyRange = useCallback((el: HTMLTextAreaElement | null) => {
    if (!el) return
    lastTargetRef.current = 'body'
    bodyRangeRef.current = {
      start: el.selectionStart ?? el.value.length,
      end: el.selectionEnd ?? el.value.length,
    }
  }, [])

  const handleMessageTypeChange = useCallback((value: string) => {
    if (value === 'MMS' || value === 'LMS') {
      setMessageType(value)
      return
    }
    setMessageType('SMS')
  }, [])

  const handleAttachmentAdd = useCallback(
    (files: File[]) => {
      if (!attachmentsEnabled) {
        return {
          ok: false as const,
          message: '첨부파일은 MMS 유형에서만 추가할 수 있습니다.',
        }
      }
      const existingBytes = existingAttachmentsRef.current.reduce(
        (sum, item) => sum + (item.byteSize ?? 0),
        0
      )
      const result = rejectSmsMmsAttachments({
        incoming: files,
        currentCount: attachmentFileNamesRef.current.length,
        currentTotalBytes:
          existingBytes + newFilesRef.current.reduce((sum, file) => sum + file.size, 0),
      })
      if (result.reason) {
        return { ok: false as const, message: smsMmsAttachmentRejectMessage(result.reason) }
      }
      if (result.accepted.length === 0) return { ok: true as const }
      setNewFiles(prev => [...prev, ...result.accepted])
      setAttachmentFileNames(prev => [...prev, ...result.accepted.map(file => file.name)])
      return { ok: true as const }
    },
    [attachmentsEnabled]
  )

  const handleAttachmentRemove = useCallback((index: number) => {
    setAttachmentFileNames(prev => {
      const name = prev[index]
      if (!name) return prev
      setNewFiles(files => {
        const nextIndex = files.findIndex(file => file.name === name)
        if (nextIndex < 0) return files
        return files.filter((_, fileIndex) => fileIndex !== nextIndex)
      })
      return prev.filter((_, fileIndex) => fileIndex !== index)
    })
  }, [])

  const insertVariable = useCallback(
    (label: string) => {
      // 스펙: 제목에서는 변수값 사용 불가 — 본문에만 삽입
      const range = bodyRangeRef.current
      const { next, caret } = insertMailVariableInText(
        bodyTextRefValue.current,
        label,
        range.start,
        range.end
      )
      setBodyText(next)
      bodyRangeRef.current = { start: caret, end: caret }
      lastTargetRef.current = 'body'
      requestAnimationFrame(() => {
        const textarea = getTextareaElement(bodyTextRef.current)
        if (!textarea) return
        textarea.focus()
        textarea.setSelectionRange(caret, caret)
      })
    },
    []
  )

  const getDraft = useCallback((): SmsTemplateFormDraft => {
    return {
      categoryId: normalizeCategoryId(categoryId),
      templateName: templateName.trim(),
      senderPhone: senderPhone.trim(),
      messageType,
      // SMS는 제목을 발송 페이로드에서 제외 (UI는 시안대로 항상 노출)
      subject: messageType === 'SMS' ? '' : subject.trim(),
      bodyText,
      attachmentFileNames: messageType === 'MMS' ? attachmentFileNames : [],
      newFiles: messageType === 'MMS' ? [...newFilesRef.current] : [],
    }
  }, [attachmentFileNames, bodyText, categoryId, messageType, senderPhone, subject, templateName])

  const getPreviewAttachments = useCallback(
    () =>
      (messageType === 'MMS' ? attachmentFileNames : []).map(name => {
        const file = newFilesRef.current.find(item => item.name === name)
        const existing = existingAttachmentsRef.current.find(item => item.fileName === name)
        return { name, sizeBytes: file?.size ?? existing?.byteSize }
      }),
    [attachmentFileNames, messageType]
  )

  const validateRequired = useCallback((): string | null => {
    const draft = getDraft()
    const nameError = validateSmsTemplateName(draft.templateName)
    if (nameError) return nameError
    if (!draft.senderPhone) return '발신 번호를 선택하세요.'
    if (!draft.bodyText.trim()) return '내용을 작성하세요.'
    if (draft.messageType !== 'SMS' && !draft.subject) return '제목을 작성하세요.'
    if (estimateSmsBodyBytes(draft.bodyText) > bodyByteLimit) {
      return `내용은 ${bodyByteLimit.toLocaleString()}byte 이하로 입력하세요.`
    }
    return null
  }, [bodyByteLimit, getDraft])

  return {
    categoryId,
    templateName,
    senderPhone,
    messageType,
    subject,
    bodyText,
    attachmentFileNames,
    subjectInputRef,
    bodyTextRef,
    bodyByteLength,
    bodyByteLimit,
    bodyCounterLabel,
    subjectMaxLength: SMS_SUBJECT_MAX_LENGTH,
    showSubject,
    showAttachments,
    attachmentsEnabled,
    setCategoryId,
    setTemplateName,
    setSenderPhone,
    setSubject,
    setBodyText,
    handleMessageTypeChange,
    rememberSubjectRange,
    rememberBodyRange,
    insertVariable,
    handleAttachmentAdd,
    handleAttachmentRemove,
    getDraft,
    getPreviewAttachments,
    validateRequired,
  }
}
