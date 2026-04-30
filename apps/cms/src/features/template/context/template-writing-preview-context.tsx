import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { FormEditorKind } from '@/features/template/model/writing-form-draft.schema'
import type { WritingFormDraft } from '@/features/template/model/writing-form-draft.schema'
import { TemplatePreviewModal } from '@/features/template/ui/modal/template-preview-modal'
import type {
  FormUpdateParagraph,
  RenderFormParagraphBodyOptions,
} from '@/features/template/ui/paragraph/render-form-paragraph-body'

/** `/templates` 하위에서 공유하는 작성 양식 user 미리보기 세션 */
export type TemplateWritingUserPreviewSession = {
  draft: WritingFormDraft
  updateParagraph: FormUpdateParagraph
  headerTitle: string
  editorKind?: FormEditorKind
  zIndex?: number
  paragraphBodyOptions?: RenderFormParagraphBodyOptions
  /** FormEditorLeftPane — 단락 필수(*)·답변 필수 토글 등 숨김 */
  hideParagraphRequiredChrome?: boolean
}

export type TemplateWritingPreviewContextValue = {
  /** 응답자(user) 미리보기 모달을 연다 */
  openWritingUserPreview: (session: TemplateWritingUserPreviewSession) => void
  /** 미리보기가 열린 동안 편집 draft와 동기화한다 */
  syncWritingUserPreviewSession: (session: TemplateWritingUserPreviewSession) => void
  closeWritingUserPreview: () => void
  isWritingUserPreviewOpen: boolean
}

const TemplateWritingPreviewContext = createContext<TemplateWritingPreviewContextValue | null>(
  null
)

export function TemplateWritingPreviewProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const [session, setSession] = useState<TemplateWritingUserPreviewSession | null>(null)

  const openWritingUserPreview = useCallback((next: TemplateWritingUserPreviewSession) => {
    setSession(next)
    setOpen(true)
  }, [])

  const syncWritingUserPreviewSession = useCallback((next: TemplateWritingUserPreviewSession) => {
    setSession(prev => (prev == null ? prev : { ...prev, ...next }))
  }, [])

  const closeWritingUserPreview = useCallback(() => {
    setOpen(false)
    setSession(null)
  }, [])

  const value = useMemo<TemplateWritingPreviewContextValue>(
    () => ({
      openWritingUserPreview,
      syncWritingUserPreviewSession,
      closeWritingUserPreview,
      isWritingUserPreviewOpen: open,
    }),
    [open, openWritingUserPreview, syncWritingUserPreviewSession, closeWritingUserPreview]
  )

  return (
    <TemplateWritingPreviewContext.Provider value={value}>
      {children}
      {session != null ? (
        <TemplatePreviewModal
          open={open}
          onClose={closeWritingUserPreview}
          headerTitle={session.headerTitle}
          draft={session.draft}
          updateParagraph={session.updateParagraph}
          editorKind={session.editorKind ?? 'survey'}
          zIndex={session.zIndex}
          paragraphBodyOptions={session.paragraphBodyOptions}
          hideParagraphRequiredChrome={session.hideParagraphRequiredChrome}
        />
      ) : null}
    </TemplateWritingPreviewContext.Provider>
  )
}

export function useTemplateWritingPreview(): TemplateWritingPreviewContextValue {
  const ctx = useContext(TemplateWritingPreviewContext)
  if (ctx == null) {
    throw new Error('useTemplateWritingPreview must be used within TemplateWritingPreviewProvider')
  }
  return ctx
}
