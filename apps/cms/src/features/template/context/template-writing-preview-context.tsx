import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import type { FormEditorKind } from '@/features/template/model/writing-form-draft.schema'
import type { WritingFormDraft } from '@/features/template/model/writing-form-draft.schema'
import { TemplatePreviewModal } from '@/features/template/ui/modal/template-preview-modal'
import type {
  FormUpdateParagraph,
  RenderFormParagraphBodyOptions,
} from '@/features/template/ui/paragraph/renderers/render-form-paragraph-body'
import type {
  FormDocumentPreviewParagraphGapResolver,
  FormDocumentPreviewRenderMode,
} from '@/features/template/lib/a4-document-preview'

export type TemplateWritingPreviewLayout = 'default' | 'a4-document'

/** `/templates` 등에서 공유하는 작성 양식 풀모달 미리보기 세션(API·파일명의 `UserPreview`는 URL `userPreview` 쿼리와 연동될 뿐, 제품 용어「사용자 모드」와 동일하지 않음 — `form-editor-modes.mdc`) */
export type TemplateWritingUserPreviewSession = {
  draft: WritingFormDraft
  updateParagraph: FormUpdateParagraph
  headerTitle: string
  editorKind?: FormEditorKind
  zIndex?: number
  previewLayout?: TemplateWritingPreviewLayout
  paragraphBodyOptions?: RenderFormParagraphBodyOptions
  /** FormEditorLeftPanel — 단락 필수(*)·답변 필수 토글 등 숨김 */
  hideParagraphRequiredChrome?: boolean
  a4HiddenParagraphIds?: ReadonlySet<string>
  a4RenderMode?: FormDocumentPreviewRenderMode
  a4ParagraphGapPx?: number | FormDocumentPreviewParagraphGapResolver
  /**
   * 작성 화면에서 선택 중인 단락 id — 미리보기에서 해당 단락으로 페이지·스크롤·강조 동기화
   */
  focusedParagraphId?: string | null
  /** 미리보기에서 「양식 수정」 선택 시 — 템플릿 편집 화면 등으로 이동 */
  onEditForm?: () => void
}

export type TemplateWritingPreviewContextValue = {
  /** 응답자(user) 미리보기 모달을 연다 */
  openWritingUserPreview: (session: TemplateWritingUserPreviewSession) => void
  /** 미리보기가 열린 동안 편집 draft와 동기화한다 */
  syncWritingUserPreviewSession: (session: TemplateWritingUserPreviewSession) => void
  closeWritingUserPreview: () => void
  isWritingUserPreviewOpen: boolean
}

const TemplateWritingPreviewContext = createContext<TemplateWritingPreviewContextValue | null>(null)

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
          previewLayout={session.previewLayout}
          paragraphBodyOptions={session.paragraphBodyOptions}
          hideParagraphRequiredChrome={session.hideParagraphRequiredChrome}
          a4HiddenParagraphIds={session.a4HiddenParagraphIds}
          a4RenderMode={session.a4RenderMode}
          a4ParagraphGapPx={session.a4ParagraphGapPx}
          focusedParagraphId={session.focusedParagraphId}
          onEditForm={session.onEditForm}
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
