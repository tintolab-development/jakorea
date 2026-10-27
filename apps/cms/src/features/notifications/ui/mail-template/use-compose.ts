import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { InputRef } from 'antd'
import type { Editor } from '@/shared/rich-text'
import { useRichTextEditor, type RichTextEditorApi } from '@/shared/rich-text'
import { isRealApiModuleEnabled } from '@/shared/config/real-api-modules'
import {
  mailTemplateInlineImageOwner,
  parseFileObjectId,
} from '@/shared/lib/admin-file-upload'
import {
  useHydrateRichTextInlineImages,
  useRichTextInlineImageSrc,
} from '@/shared/rich-text/use-rich-text-inline-image'
import {
  insertMailVariableInEditor,
  insertMailVariableInText,
  isMailEditorEmpty,
} from '@/features/notifications/model/mail-template/insert-variable'
import { mailBodyToEditorHtml } from '@/features/notifications/model/shared/mail-body-display-html'
import { MailVariable } from '@/features/notifications/model/mail-template/variable-node'
import {
  mailAttachmentRejectMessage,
  rejectMailAttachments,
} from '@/features/notifications/model/mail-template/attachments'
import { ensureMailTemplateLayoutMarker } from '@/features/notifications/model/mail-template/resolve-body'
import type { MailTemplateAttachment } from '@/features/notifications/model/mail-template/types'

export const MAIL_COMPOSE_SUBJECT_MAX_LENGTH = 1000
export const MAIL_COMPOSE_EDITOR_MIN_HEIGHT = '360px'

export type MailComposeInitial = {
  subject: string
  bodyHtml: string
  attachmentFileNames: string[]
  existingAttachments?: MailTemplateAttachment[]
}

type InsertTarget = 'subject' | 'body'

const EMPTY_COMPOSE: MailComposeInitial = {
  subject: '',
  bodyHtml: '',
  attachmentFileNames: [],
  existingAttachments: [],
}

export function useMailCompose(
  open: boolean,
  resetKey: string,
  initial: MailComposeInitial,
  templateId?: string | number | null
) {
  const apiRef = useRef<RichTextEditorApi | null>(null)
  const subjectInputRef = useRef<InputRef>(null)
  const lastTargetRef = useRef<InsertTarget>('body')
  const subjectRangeRef = useRef({ start: 0, end: 0 })
  const bodyRangeRef = useRef<{ from: number; to: number } | null>(null)
  const newFilesRef = useRef<File[]>([])
  const existingAttachmentsRef = useRef<MailTemplateAttachment[]>([])
  const removedAttachmentIdsRef = useRef<number[]>([])
  /**
   * 일반 TipTap 직렬화는 mail-client용 inline style을 모두 보존하지 않을 수 있다.
   * 원문이 존재하는 동안에는 이를 SSOT로 사용하고, 본문을 실제로 편집하면 editor HTML로 전환한다.
   */
  const rawBodyHtmlRef = useRef<string | null>(initial.bodyHtml.trim() ? initial.bodyHtml : null)
  const initialRef = useRef(initial)
  initialRef.current = initial

  const [subject, setSubject] = useState(initial.subject)
  const [attachmentFileNames, setAttachmentFileNames] = useState(initial.attachmentFileNames)
  const [newFiles, setNewFiles] = useState<File[]>([])
  const [removedAttachmentIds, setRemovedAttachmentIds] = useState<number[]>([])
  /**
   * 제목 SSOT = subjectRef.
   * 타이핑은 handleSubjectChange가 ref만 갱신하고 React subject state는 리셋/변수삽입 때만 올린다.
   * ❌ 매 렌더 `subjectRef.current = subject` 금지 — state가  lagged ''이면 UI(로컬)와 달리
   *    getSubject()가 비어 「제목을 작성하세요」가 난다.
   */
  const subjectRef = useRef(initial.subject)
  newFilesRef.current = newFiles
  removedAttachmentIdsRef.current = removedAttachmentIds

  /** 평문(\n) 템플릿은 에디터에서 줄바꿈이 사라지므로 <p> HTML로 변환해 로드 (저장 baseline은 원문 유지) */
  const initialEditorHtml = useMemo(() => mailBodyToEditorHtml(initial.bodyHtml), [initial.bodyHtml])
  const mailVariableExtensions = useMemo(() => [MailVariable], [])
  const fileUploadOwner = useMemo(
    () => mailTemplateInlineImageOwner(parseFileObjectId(templateId)),
    [templateId]
  )
  const resolveImageSrc = useRichTextInlineImageSrc(fileUploadOwner)

  const { editor, api } = useRichTextEditor({
    enabled: open,
    initialContent: initialEditorHtml,
    contentFormat: 'html',
    resetKey,
    placeholder: '내용을 작성하세요',
    autofocus: false,
    extraExtensions: mailVariableExtensions,
    shouldRerenderOnTransaction: false,
    resolveImageSrc:
      fileUploadOwner != null || isRealApiModuleEnabled('files')
        ? resolveImageSrc
        : undefined,
    onReady: readyApi => {
      apiRef.current = readyApi
    },
  })
  useHydrateRichTextInlineImages(editor, resetKey)

  useEffect(() => {
    if (!open) return
    const next = initialRef.current
    setSubject(next.subject)
    subjectRef.current = next.subject
    setAttachmentFileNames([...next.attachmentFileNames])
    setNewFiles([])
    setRemovedAttachmentIds([])
    existingAttachmentsRef.current = [...(next.existingAttachments ?? [])]
    rawBodyHtmlRef.current = next.bodyHtml.trim() ? next.bodyHtml : null
    lastTargetRef.current = 'body'
    subjectRangeRef.current = { start: 0, end: 0 }
    bodyRangeRef.current = null
  }, [open, resetKey])

  useEffect(() => {
    if (!editor) return
    const clearRawBodyAfterEdit = () => {
      rawBodyHtmlRef.current = null
    }
    editor.on('update', clearRawBodyAfterEdit)
    return () => {
      editor.off('update', clearRawBodyAfterEdit)
    }
  }, [editor])

  useEffect(() => {
    if (!editor) return
    const saveBodyRange = () => {
      lastTargetRef.current = 'body'
      bodyRangeRef.current = {
        from: editor.state.selection.from,
        to: editor.state.selection.to,
      }
    }
    editor.on('selectionUpdate', saveBodyRange)
    editor.on('focus', saveBodyRange)
    editor.on('blur', saveBodyRange)
    return () => {
      editor.off('selectionUpdate', saveBodyRange)
      editor.off('focus', saveBodyRange)
      editor.off('blur', saveBodyRange)
    }
  }, [editor])

  const rememberSubjectRange = useCallback((el: HTMLInputElement | null) => {
    if (!el) return
    lastTargetRef.current = 'subject'
    subjectRangeRef.current = {
      start: el.selectionStart ?? el.value.length,
      end: el.selectionEnd ?? el.value.length,
    }
  }, [])

  const handleSubjectChange = useCallback((value: string) => {
    // ref만 갱신 — 부모 리렌더(수신자 테이블·변수 패널)를 막는다.
    // UI 표시는 ComposeFields 로컬 state가 담당. insertVariable/리셋 시에만 setSubject.
    subjectRef.current = value.slice(0, MAIL_COMPOSE_SUBJECT_MAX_LENGTH)
  }, [])

  const insertVariable = useCallback((label: string) => {
    if (lastTargetRef.current === 'subject') {
      const range = subjectRangeRef.current
      const { next, caret } = insertMailVariableInText(
        subjectRef.current,
        label,
        range.start,
        range.end,
        MAIL_COMPOSE_SUBJECT_MAX_LENGTH
      )
      subjectRef.current = next
      setSubject(next)
      subjectRangeRef.current = { start: caret, end: caret }
      requestAnimationFrame(() => {
        const input = subjectInputRef.current?.input
        if (!input) return
        input.focus()
        input.setSelectionRange(caret, caret)
      })
      return
    }
    if (!editor) return
    insertMailVariableInEditor(editor, label, bodyRangeRef.current ?? undefined)
  }, [editor])

  const handleAttachmentAdd = useCallback(
    (files: File[]) => {
      const existingBytes = existingAttachmentsRef.current
        .filter(item => !removedAttachmentIdsRef.current.includes(item.attachmentId))
        .reduce((sum, item) => sum + (item.byteSize ?? 0), 0)
      const result = rejectMailAttachments({
        incoming: files,
        currentCount: attachmentFileNames.length,
        currentTotalBytes:
          existingBytes + newFilesRef.current.reduce((sum, file) => sum + file.size, 0),
      })
      if (result.reason) {
        return { ok: false as const, message: mailAttachmentRejectMessage(result.reason) }
      }
      if (result.accepted.length === 0) return { ok: true as const }
      setNewFiles(prev => [...prev, ...result.accepted])
      setAttachmentFileNames(prev => [...prev, ...result.accepted.map(file => file.name)])
      return { ok: true as const }
    },
    [attachmentFileNames.length]
  )

  const handleAttachmentRemove = useCallback((index: number) => {
    setAttachmentFileNames(prev => {
      const name = prev[index]
      if (!name) return prev

      setNewFiles(files => {
        const fileIndex = files.findIndex(file => file.name === name)
        if (fileIndex >= 0) {
          return files.filter((_, i) => i !== fileIndex)
        }
        const existing = existingAttachmentsRef.current.find(item => item.fileName === name)
        if (existing) {
          setRemovedAttachmentIds(ids =>
            ids.includes(existing.attachmentId) ? ids : [...ids, existing.attachmentId]
          )
        }
        return files
      })
      return prev.filter((_, i) => i !== index)
    })
  }, [])

  const getBodyHtml = useCallback(() => {
    if (rawBodyHtmlRef.current != null) return rawBodyHtmlRef.current
    const bodyHtml = apiRef.current?.getHTML() ?? api?.getHTML() ?? ''
    const plainText = apiRef.current?.getText() ?? api?.getText() ?? ''
    if (isMailEditorEmpty(bodyHtml, plainText)) return ''
    return ensureMailTemplateLayoutMarker(templateId, bodyHtml)
  }, [api, templateId])

  const getSubject = useCallback(() => subjectRef.current, [])

  const getPreviewAttachments = useCallback(
    () =>
      attachmentFileNames.map(name => {
        const file = newFilesRef.current.find(item => item.name === name)
        const existing = existingAttachmentsRef.current.find(item => item.fileName === name)
        return { name, sizeBytes: file?.size ?? existing?.byteSize }
      }),
    [attachmentFileNames]
  )

  const getNewFiles = useCallback(() => [...newFilesRef.current], [])
  const getRemovedAttachmentIds = useCallback(() => [...removedAttachmentIdsRef.current], [])

  return {
    editor: editor as Editor | null,
    editorMinHeight: MAIL_COMPOSE_EDITOR_MIN_HEIGHT,
    subjectMaxLength: MAIL_COMPOSE_SUBJECT_MAX_LENGTH,
    subjectInputRef,
    subject,
    attachmentFileNames,
    handleSubjectChange,
    rememberSubjectRange,
    insertVariable,
    handleAttachmentAdd,
    handleAttachmentRemove,
    getBodyHtml,
    getSubject,
    getPreviewAttachments,
    getNewFiles,
    getRemovedAttachmentIds,
    fileUploadOwner,
  }
}

export const EMPTY_MAIL_COMPOSE: MailComposeInitial = EMPTY_COMPOSE
