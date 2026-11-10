import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { InputRef } from 'antd'
import type { TextAreaRef } from 'antd/es/input/TextArea'
import { insertMailVariableInText } from '@/features/notifications/model/mail-template/insert-variable'
import {
  collectSmsComposeFieldIssues,
  estimateSmsBodyBytes,
  LMS_MMS_BODY_BYTE_LIMIT,
  SMS_BODY_BYTE_LIMIT,
  SMS_SUBJECT_BYTE_LIMIT,
} from '@/features/notifications/model/sms-send/text-bytes'
import {
  rejectSmsMmsAttachments,
  smsMmsAttachmentRejectMessage,
} from '@/features/notifications/model/sms-template/attachments'
import {
  sanitizeSmsTemplateNameInput,
  validateSmsTemplateName,
} from '@/features/notifications/model/sms-template/template-name'
import {
  validateSmsSenderPhone,
  type ValidateSmsSenderPhoneOptions,
} from '@/features/notifications/model/sms-template/sender-phone'
import {
  SMS_MESSAGE_TYPE_REQUIRED_MESSAGE,
  type SmsComposeMessageType,
} from '@/features/notifications/model/sms-template/message-type'
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
  /** 저장 시 DELETE할 기존 템플릿 첨부 attachmentId (MMS가 아니면 기존 첨부 전부) */
  removedAttachmentIds: number[]
  /** 삭제 후 남는 기존 첨부 — 신규 첨부 개수·합계 사전 검증용 */
  remainingAttachments: { count: number; totalBytes: number }
}

/** 화면에 남은 파일명 기준으로 유지/삭제할 기존 템플릿 첨부를 나눈다. */
export function splitSmsTemplateExistingAttachments(input: {
  existing: SmsTemplateAttachment[]
  attachmentFileNames: string[]
  messageType: SmsTemplateFormDraft['messageType']
}): { kept: SmsTemplateAttachment[]; removedAttachmentIds: number[] } {
  if (input.messageType !== 'MMS') {
    return { kept: [], removedAttachmentIds: input.existing.map(item => item.attachmentId) }
  }
  const remainingNames = [...input.attachmentFileNames]
  const kept: SmsTemplateAttachment[] = []
  const removedAttachmentIds: number[] = []
  for (const item of input.existing) {
    const index = remainingNames.indexOf(item.fileName)
    if (index >= 0) {
      remainingNames.splice(index, 1)
      kept.push(item)
    } else {
      removedAttachmentIds.push(item.attachmentId)
    }
  }
  return { kept, removedAttachmentIds }
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
  removedAttachmentIds: [],
  remainingAttachments: { count: 0, totalBytes: 0 },
}

export const SMS_SUBJECT_MAX_LENGTH = SMS_SUBJECT_BYTE_LIMIT

function normalizeCategoryId(value: string | null | undefined): string {
  const trimmed = value?.trim() ?? ''
  if (!trimmed || trimmed.startsWith('unclassified-')) return SMS_ROOT_CATEGORY_ID
  return trimmed
}

export { estimateSmsBodyBytes }

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
    subject: template.subject,
    bodyText: template.bodyText,
    attachmentFileNames: [...template.attachmentFileNames],
    newFiles: [],
    removedAttachmentIds: [],
    remainingAttachments: {
      count: template.attachments?.length ?? 0,
      totalBytes: (template.attachments ?? []).reduce((sum, item) => sum + (item.byteSize ?? 0), 0),
    },
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
  // 시안(템플릿 등록): 발송 유형은 처음에 미선택. 수정은 저장된 유형.
  const [messageType, setMessageType] = useState<SmsComposeMessageType>(
    mode === 'edit' && template ? initialDraft.messageType : ''
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

  const showSubject = messageType !== 'SMS' || subject.trim().length > 0
  // 시안(템플릿 등록): 미선택 상태에서도 제목·첨부 행을 보인다. SMS는 NHN에 제목·첨부가 없어 숨김.
  const showAttachments =
    messageType === 'MMS' || messageType === '' || attachmentFileNames.length > 0
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
    setSubjectState(value)
  }, [])

  useEffect(() => {
    if (!open) return
    const next = draftFromTemplate(mode === 'edit' ? template : null, initialCategoryId)
    existingAttachmentsRef.current = template?.attachments ?? []
    setCategoryId(next.categoryId)
    setTemplateNameState(next.templateName)
    setSenderPhone(next.senderPhone)
    setMessageType(mode === 'edit' && template ? next.messageType : '')
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
    async (files: File[]) => {
      if (!attachmentsEnabled) {
        return {
          ok: false as const,
          message: '첨부파일은 MMS 유형에서만 추가할 수 있습니다.',
        }
      }
      const { kept } = splitSmsTemplateExistingAttachments({
        existing: existingAttachmentsRef.current,
        attachmentFileNames: attachmentFileNamesRef.current,
        messageType: 'MMS',
      })
      const existingBytes = kept.reduce((sum, item) => sum + (item.byteSize ?? 0), 0)
      const result = await rejectSmsMmsAttachments({
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
      // 제목에는 자동입력 변수 사용 불가 — 본문에만 삽입
      if (lastTargetRef.current === 'subject') {
        lastTargetRef.current = 'body'
      }

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
    // 미선택('')은 validateRequired가 먼저 막는다. draft 타입만 맞추기 위한 기본값.
    const draftMessageType = messageType || 'SMS'
    const { kept, removedAttachmentIds } = splitSmsTemplateExistingAttachments({
      existing: existingAttachmentsRef.current,
      attachmentFileNames,
      messageType: draftMessageType,
    })
    return {
      categoryId: normalizeCategoryId(categoryId),
      templateName: templateName.trim(),
      senderPhone: senderPhone.trim(),
      messageType: draftMessageType,
      subject,
      bodyText,
      attachmentFileNames,
      newFiles: [...newFilesRef.current],
      removedAttachmentIds,
      remainingAttachments: {
        count: kept.length,
        totalBytes: kept.reduce((sum, item) => sum + (item.byteSize ?? 0), 0),
      },
    }
  }, [attachmentFileNames, bodyText, categoryId, messageType, senderPhone, subject, templateName])

  const getPreviewAttachments = useCallback(
    () =>
      attachmentFileNames.map(name => {
        const file = newFilesRef.current.find(item => item.name === name)
        const existing = existingAttachmentsRef.current.find(item => item.fileName === name)
        return { name, sizeBytes: file?.size ?? existing?.byteSize }
      }),
    [attachmentFileNames, messageType]
  )

  const validateRequired = useCallback(
    (senderOptions?: ValidateSmsSenderPhoneOptions): string | null => {
      const draft = getDraft()
      const nameError = validateSmsTemplateName(draft.templateName)
      if (nameError) return nameError
      const senderError = validateSmsSenderPhone(draft.senderPhone, senderOptions)
      if (senderError) return senderError
      if (!messageType) return SMS_MESSAGE_TYPE_REQUIRED_MESSAGE
      const issues = collectSmsComposeFieldIssues({
        messageType: draft.messageType,
        subject: draft.subject,
        bodyText: draft.bodyText,
        attachmentCount: draft.attachmentFileNames.length,
      })
      if (issues.bodyError) return issues.bodyError
      if (draft.messageType !== 'SMS' && issues.subjectError) return issues.subjectError
      return null
    },
    [getDraft, messageType]
  )

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
