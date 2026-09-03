import { useCallback, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { FormEditorKind, FormTitleNumberingStyle, WritingFormParagraph } from '@/features/template/model/writing-form-draft.schema'
import { A4_DOCUMENT_CONTENT_INNER_WIDTH_PX } from '@/features/template/lib/a4-document-pagination-constants'
import type {
  FormDocumentPreviewParagraphGapResolver,
  FormDocumentPreviewRenderMode,
} from '@/features/template/lib/a4-document-preview'
import { packParagraphsByHeights } from '@/features/template/lib/a4-paragraph-pack'
import { FormDocumentPreviewBody } from '@/features/template/ui/document-preview/form-document-preview-body'
import type { RenderFormParagraphBodyOptions } from '@/features/template/ui/paragraph/renderers/render-form-paragraph-body'

export interface UseA4ParagraphPagesArgs {
  allParagraphs: WritingFormParagraph[]
  titleNumbering: FormTitleNumberingStyle
  editorKind: FormEditorKind
  /** false이면 측정 생략, 단일 페이지로 전체 단락 반환 */
  enabled: boolean
  paragraphBodyOptions?: RenderFormParagraphBodyOptions
  renderMode?: FormDocumentPreviewRenderMode
  paragraphGapPx?: number | FormDocumentPreviewParagraphGapResolver
  /** 해당 id 단락 직전에서 항상 새 A4 페이지 시작 (교육 사진 등) */
  pageBreakBeforeParagraphIds?: ReadonlySet<string>
}

export interface UseA4ParagraphPagesResult {
  pages: WritingFormParagraph[][]
  overflowParagraphIds: ReadonlySet<string>
  /** 단락 높이 측정·페이지 분할이 현재 paragraphs/config 기준으로 완료됐는지 */
  pagesReady: boolean
  measureLayer: ReactNode
}

/**
 * 문서 미리보기와 동일 마크업으로 단락 높이를 재어, A4 본문 최대 높이 기준으로 페이지를 나눈다.
 * 동의 closing(확인·날짜·서명)은 overflow 시 keep-together (`packParagraphsByHeights`).
 */
export function useA4ParagraphPages({
  allParagraphs,
  titleNumbering,
  editorKind,
  enabled,
  paragraphBodyOptions,
  renderMode = 'card',
  paragraphGapPx,
  pageBreakBeforeParagraphIds,
}: UseA4ParagraphPagesArgs): UseA4ParagraphPagesResult {
  const paragraphIdsKey = useMemo(() => allParagraphs.map(p => p.id).join('\0'), [allParagraphs])
  const paginationConfigKey = useMemo(() => {
    const gapKind =
      paragraphGapPx == null
        ? 'none'
        : typeof paragraphGapPx === 'number'
          ? `n:${paragraphGapPx}`
          : 'resolver'
    const breakIds =
      pageBreakBeforeParagraphIds == null || pageBreakBeforeParagraphIds.size === 0
        ? ''
        : [...pageBreakBeforeParagraphIds].sort().join('\0')
    return `${renderMode}|${gapKind}|${breakIds}|${paragraphBodyOptions?.documentPreviewClassName ?? ''}`
  }, [
    paragraphBodyOptions?.documentPreviewClassName,
    pageBreakBeforeParagraphIds,
    paragraphGapPx,
    renderMode,
  ])
  const packedCacheKey = `${paragraphIdsKey}|${paginationConfigKey}`

  const [packed, setPacked] = useState<{
    pages: WritingFormParagraph[][]
    overflowIds: ReadonlySet<string>
    cacheKey: string
  } | null>(null)
  const measureRootRef = useRef<HTMLDivElement | null>(null)
  const [measureRootMounted, setMeasureRootMounted] = useState(false)

  const handleMeasureRootRef = useCallback((node: HTMLDivElement | null) => {
    measureRootRef.current = node
    setMeasureRootMounted(node != null)
  }, [])

  const pagesReady =
    !enabled || (packed != null && packed.cacheKey === packedCacheKey && packed.pages.length > 0)

  const pages = useMemo(() => {
    if (!enabled) {
      return [allParagraphs]
    }
    if (packed != null && packed.cacheKey === packedCacheKey && packed.pages.length > 0) {
      return packed.pages
    }
    // 측정 전 [allParagraphs]를 1페이지로 그리면 overflow:hidden A4 뷰포트에서 하단 단락(교육 사진 등)이 잘림
    return [[]]
  }, [enabled, allParagraphs, packed, packedCacheKey])

  const overflowParagraphIds = useMemo(() => {
    if (!enabled || packed == null || packed.cacheKey !== packedCacheKey) {
      return new Set<string>()
    }
    return packed.overflowIds
  }, [enabled, packed, packedCacheKey])

  const runMeasure = useCallback(() => {
    const root = measureRootRef.current
    if (root == null || !enabled) return
    const next = new Map<string, number>()
    root.querySelectorAll('[data-paragraph-id]').forEach(node => {
      const id = node.getAttribute('data-paragraph-id')
      if (id == null || id === '') return
      const el = node as HTMLElement
      next.set(id, Math.max(el.offsetHeight, el.scrollHeight))
    })
    const { pages: nextPages, overflow } = packParagraphsByHeights(
      allParagraphs,
      next,
      enabled,
      paragraphGapPx,
      pageBreakBeforeParagraphIds
    )
    setPacked({
      pages: nextPages,
      overflowIds: overflow,
      cacheKey: `${allParagraphs.map(p => p.id).join('\0')}|${paginationConfigKey}`,
    })
  }, [allParagraphs, enabled, pageBreakBeforeParagraphIds, paragraphGapPx, paginationConfigKey])

  useLayoutEffect(() => {
    if (!enabled) {
      setPacked(null)
      setMeasureRootMounted(false)
      return
    }
    if (!measureRootMounted || measureRootRef.current == null) return

    let cancelled = false
    const tick = () => {
      if (cancelled) return
      runMeasure()
    }
    void document.fonts.ready.then(() => {
      requestAnimationFrame(() => {
        requestAnimationFrame(tick)
      })
    })
    return () => {
      cancelled = true
    }
  }, [
    allParagraphs,
    enabled,
    measureRootMounted,
    runMeasure,
    titleNumbering,
    editorKind,
    paragraphBodyOptions,
    renderMode,
  ])

  const measureLayer = useMemo(
    () => (
      <div
        ref={handleMeasureRootRef}
        aria-hidden={true}
        className="use-a4-paragraph-pages__measure-root"
        style={{
          position: 'fixed',
          left: -20000,
          top: 0,
          width: A4_DOCUMENT_CONTENT_INNER_WIDTH_PX,
          visibility: 'hidden',
          pointerEvents: 'none',
          zIndex: -1,
        }}
      >
        <FormDocumentPreviewBody
          paragraphs={allParagraphs}
          allParagraphs={allParagraphs}
          titleNumbering={titleNumbering}
          editorKind={editorKind}
          paragraphBodyOptions={paragraphBodyOptions}
          renderMode={renderMode}
          paragraphGapPx={paragraphGapPx}
        />
      </div>
    ),
    [
      allParagraphs,
      titleNumbering,
      editorKind,
      paragraphBodyOptions,
      renderMode,
      paragraphGapPx,
      handleMeasureRootRef,
    ]
  )

  return { pages, overflowParagraphIds, pagesReady, measureLayer }
}
