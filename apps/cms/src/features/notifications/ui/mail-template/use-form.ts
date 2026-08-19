import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { InputRef } from 'antd'
import type { Editor } from '@/shared/rich-text'
import {
  useRichTextEditor,
  type RichTextEditorApi,
} from '@/shared/rich-text'
import type { MailTemplateItem, MailTemplateFormMode } from '@/features/notifications/model/mail-template/types'
import {
  insertMailVariableInEditor,
  insertMailVariableInText,
  isMailEditorEmpty,
} from '@/features/notifications/model/mail-template/insert-variable'
import { MailVariable } from '@/features/notifications/model/mail-template/variable-node'
import {
  mailAttachmentRejectMessage,
  rejectMailAttachments,
} from '@/features/notifications/model/mail-template/attachments'

export type { MailTemplateFormMode } from '@/features/notifications/model/mail-template/types'

export type MailTemplateFormDraft = {
  templateName: string
  senderName: string
  senderEmail: string
  subject: string
  bodyHtml: string
  attachmentFileNames: string[]
}

const SUBJECT_MAX_LENGTH = 1000
const EDITOR_MIN_HEIGHT = '360px'
const EMPTY_DRAFT: MailTemplateFormDraft = {
  templateName: '',
  senderName: '',
  senderEmail: '',
  subject: '',
  attachmentFileNames: [],
  bodyHtml: '',
}

type InsertTarget = 'subject' | 'body'

export function draftFromTemplate(template: MailTemplateItem | null): MailTemplateFormDraft {
  if (!template) return { ...EMPTY_DRAFT }
  return {
    templateName: template.templateName,
    senderName: template.senderName,
    senderEmail: template.senderEmail,
    subject: template.subject,
    bodyHtml: template.bodyHtml,
    attachmentFileNames: [...template.attachmentFileNames],
  }
}

export function useMailTemplateForm(
  open: boolean,
  mode: MailTemplateFormMode,
  template: MailTemplateItem | null
) {
  const apiRef = useRef<RichTextEditorApi | null>(null)
  const subjectInputRef = useRef<InputRef>(null)
  const lastTargetRef = useRef<InsertTarget>('body')
  const subjectRangeRef = useRef({ start: 0, end: 0 })
  const bodyRangeRef = useRef<{ from: number; to: number } | null>(null)
  const newFilesRef = useRef<File[]>([])

  const initialDraft = useMemo(
    () => draftFromTemplate(mode === 'edit' ? template : null),
    [mode, template]
  )
  const resetKey = useMemo(
    () => (open ? `${mode}-${template?.id ?? 'new'}` : 'closed'),
    [open, mode, template?.id]
  )

  const [templateName, setTemplateName] = useState(initialDraft.templateName)
  const [senderName, setSenderName] = useState(initialDraft.senderName)
  const [senderEmail, setSenderEmail] = useState(initialDraft.senderEmail)
  const [subject, setSubject] = useState(initialDraft.subject)
  const [attachmentFileNames, setAttachmentFileNames] = useState(initialDraft.attachmentFileNames)
  const [newFiles, setNewFiles] = useState<File[]>([])
  newFilesRef.current = newFiles

  const mailVariableExtensions = useMemo(() => [MailVariable], [])

  const { editor, api } = useRichTextEditor({
    enabled: open,
    initialContent: initialDraft.bodyHtml,
    contentFormat: 'html',
    resetKey,
    placeholder: '내용을 작성하세요',
    autofocus: false,
    extraExtensions: mailVariableExtensions,
    onReady: readyApi => {
      apiRef.current = readyApi
    },
  })

  useEffect(() => {
    if (!open) return
    const next = draftFromTemplate(mode === 'edit' ? template : null)
    setTemplateName(next.templateName)
    setSenderName(next.senderName)
    setSenderEmail(next.senderEmail)
    setSubject(next.subject)
    setAttachmentFileNames(next.attachmentFileNames)
    setNewFiles([])
    lastTargetRef.current = 'body'
    subjectRangeRef.current = { start: 0, end: 0 }
    bodyRangeRef.current = null
  }, [open, mode, template])

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
    setSubject(value.slice(0, SUBJECT_MAX_LENGTH))
  }, [])

  const insertVariable = useCallback(
    (label: string) => {
      if (lastTargetRef.current === 'subject') {
        const range = subjectRangeRef.current
        const { next, caret } = insertMailVariableInText(
          subject,
          label,
          range.start,
          range.end,
          SUBJECT_MAX_LENGTH
        )
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
    },
    [editor, subject]
  )

  const handleAttachmentAdd = useCallback((files: File[]) => {
    const result = rejectMailAttachments({
      incoming: files,
      currentCount: attachmentFileNames.length,
      currentTotalBytes: newFilesRef.current.reduce((sum, file) => sum + file.size, 0),
    })
    if (result.reason) {
      return { ok: false as const, message: mailAttachmentRejectMessage(result.reason) }
    }
    if (result.accepted.length === 0) return { ok: true as const }
    setNewFiles(prev => [...prev, ...result.accepted])
    setAttachmentFileNames(prev => [...prev, ...result.accepted.map(file => file.name)])
    return { ok: true as const }
  }, [attachmentFileNames.length])

  const handleAttachmentRemove = useCallback((index: number) => {
    setAttachmentFileNames(prev => {
      const name = prev[index]
      setNewFiles(files => {
        const fileIndex = files.findIndex(file => file.name === name)
        if (fileIndex < 0) return files
        return files.filter((_, i) => i !== fileIndex)
      })
      return prev.filter((_, i) => i !== index)
    })
  }, [])

  const getDraft = useCallback((): MailTemplateFormDraft => {
    const bodyHtml = apiRef.current?.getHTML() ?? api?.getHTML() ?? ''
    const plainText = editor?.getText() ?? ''
    return {
      templateName: templateName.trim(),
      senderName: senderName.trim(),
      senderEmail: senderEmail.trim(),
      subject: subject.trim(),
      bodyHtml,
      attachmentFileNames,
      ...(isMailEditorEmpty(bodyHtml, plainText) ? { bodyHtml: '' } : {}),
    }
  }, [api, attachmentFileNames, editor, senderEmail, senderName, subject, templateName])

  const validateRequired = useCallback((): string | null => {
    const draft = getDraft()
    if (!draft.templateName) return '템플릿명을 입력하세요.'
    if (!draft.senderEmail) return '발신 메일을 입력하세요.'
    if (!draft.subject) return '제목을 작성하세요.'
    if (!draft.bodyHtml) return '내용을 작성하세요.'
    return null
  }, [getDraft])

  return {
    editor: editor as Editor | null,
    editorMinHeight: EDITOR_MIN_HEIGHT,
    subjectMaxLength: SUBJECT_MAX_LENGTH,
    subjectInputRef,
    templateName,
    senderName,
    senderEmail,
    subject,
    attachmentFileNames,
    setTemplateName,
    setSenderName,
    setSenderEmail,
    handleSubjectChange,
    rememberSubjectRange,
    insertVariable,
    handleAttachmentAdd,
    handleAttachmentRemove,
    getDraft,
    validateRequired,
  }
}
