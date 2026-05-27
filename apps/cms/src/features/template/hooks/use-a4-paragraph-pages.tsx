import { useCallback, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { FormEditorKind, FormTitleNumberingStyle, WritingFormParagraph } from '@/features/template/model/writing-form-draft.schema'
import {
  A4_DOCUMENT_CONTINUATION_PAGE_BODY_MAX_PX,
  A4_DOCUMENT_FIRST_PAGE_BODY_MAX_PX,
  A4_DOCUMENT_CONTENT_INNER_WIDTH_PX,
  A4_DOCUMENT_PARAGRAPH_GAP_PX,
} from '@/features/template/lib/a4-document-pagination-constants'
import type {
  FormDocumentPreviewParagraphGapResolver,
  FormDocumentPreviewRenderMode,
} from '@/features/template/lib/a4-document-preview'
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
}

export interface UseA4ParagraphPagesResult {
  pages: WritingFormParagraph[][]
  overflowParagraphIds: ReadonlySet<string>
  measureLayer: ReactNode
}

function packParagraphsByHeights(
  allParagraphs: WritingFormParagraph[],
  heights: Map<string, number>,
  enabled: boolean,
  paragraphGapPx?: number | FormDocumentPreviewParagraphGapResolver
): { pages: WritingFormParagraph[][]; overflow: Set<string> } {
  if (!enabled || allParagraphs.length === 0) {
    return { pages: [allParagraphs], overflow: new Set() }
  }

  const overflow = new Set<string>()
  const out: WritingFormParagraph[][] = []
  let page: WritingFormParagraph[] = []
  let used = 0
  let isFirstPage = true

  const maxFor = () =>
    isFirstPage ? A4_DOCUMENT_FIRST_PAGE_BODY_MAX_PX : A4_DOCUMENT_CONTINUATION_PAGE_BODY_MAX_PX

  const flushPage = () => {
    if (page.length > 0) {
      out.push(page)
      page = []
      used = 0
      isFirstPage = false
    }
  }

  for (const p of allParagraphs) {
    const h = heights.get(p.id) ?? 0
    const maxH = maxFor()
    if (h > maxH) {
      overflow.add(p.id)
    }
    const gap =
      page.length > 0
        ? typeof paragraphGapPx === 'number'
          ? paragraphGapPx
          : paragraphGapPx?.(p, page.length, page) ?? A4_DOCUMENT_PARAGRAPH_GAP_PX
        : 0
    if (page.length > 0 && used + gap + h > maxH) {
      flushPage()
    }
    page.push(p)
    used += gap + h
  }
  flushPage()
  if (out.length === 0) {
    out.push([])
  }
  return { pages: out, overflow }
}

/**
 * 문서 미리보기와 동일 마크업으로 단락 높이를 재어, A4 본문 최대 높이 기준으로 페이지를 나눈다.
 */
export function useA4ParagraphPages({
  allParagraphs,
  titleNumbering,
  editorKind,
  enabled,
  paragraphBodyOptions,
  renderMode = 'card',
  paragraphGapPx,
}: UseA4ParagraphPagesArgs): UseA4ParagraphPagesResult {
  const paragraphIdsKey = useMemo(() => allParagraphs.map(p => p.id).join('\0'), [allParagraphs])
  const paginationConfigKey = useMemo(() => {
    const gapKind =
      paragraphGapPx == null
        ? 'none'
        : typeof paragraphGapPx === 'number'
          ? `n:${paragraphGapPx}`
          : 'resolver'
    return `${renderMode}|${gapKind}|${paragraphBodyOptions?.documentPreviewClassName ?? ''}`
  }, [paragraphBodyOptions?.documentPreviewClassName, paragraphGapPx, renderMode])
  const packedCacheKey = `${paragraphIdsKey}|${paginationConfigKey}`

  const [packed, setPacked] = useState<{
    pages: WritingFormParagraph[][]
    overflowIds: ReadonlySet<string>
    cacheKey: string
  } | null>(null)
  const measureRootRef = useRef<HTMLDivElement>(null)

  const pages = useMemo(() => {
    if (!enabled) {
      return [allParagraphs]
    }
    if (packed != null && packed.cacheKey === packedCacheKey && packed.pages.length > 0) {
      return packed.pages
    }
    return [allParagraphs]
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
      next.set(id, (node as HTMLElement).offsetHeight)
    })
    const { pages: nextPages, overflow } = packParagraphsByHeights(
      allParagraphs,
      next,
      enabled,
      paragraphGapPx
    )
    setPacked({
      pages: nextPages,
      overflowIds: overflow,
      cacheKey: `${allParagraphs.map(p => p.id).join('\0')}|${paginationConfigKey}`,
    })
  }, [allParagraphs, enabled, paragraphGapPx, paginationConfigKey])

  useLayoutEffect(() => {
    if (!enabled) {
      return
    }
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
    runMeasure,
    titleNumbering,
    editorKind,
    paragraphBodyOptions,
    renderMode,
  ])

  const measureLayer = useMemo(
    () => (
      <div
        ref={measureRootRef}
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
    [allParagraphs, titleNumbering, editorKind, paragraphBodyOptions, renderMode, paragraphGapPx]
  )

  return { pages, overflowParagraphIds, measureLayer }
}
