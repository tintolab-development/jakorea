import { useCallback, useEffect, useRef, useState } from 'react'
import type { Editor } from '@tiptap/react'
import { ProgramBackButton } from '@/features/program'
import {
  getImpactStoryIdFromPath,
  IMPACT_STORIES_PATH,
  ImpactStoryAdjacentNav,
  useImpactStoryDetail,
  type ImpactStoryDetail,
  type ImpactStoryDetailStatus,
} from '@/features/impact-story'
import { RichTextViewer } from '@/shared/rich-text'
import {
  PFAttachmentDropdown,
  PFButton,
  PFCategoryBadge,
  PFDivider,
  PFLoadingSpinner,
  PFText,
} from '@/shared/ui'
import styles from './page.module.css'
import { useNavigate } from 'react-router-dom'

function formatViewCount(count: number) {
  return count.toLocaleString('ko-KR')
}

function statusMessage(status: ImpactStoryDetailStatus) {
  if (status === 'error') return '임팩트 스토리를 불러오지 못했습니다.'
  return '임팩트 스토리를 찾을 수 없습니다.'
}

function ImpactStoryBody({ detail, body }: { detail: ImpactStoryDetail; body: string }) {
  const bodyRef = useRef<HTMLDivElement>(null)
  const frameCleanupRef = useRef<(() => void) | null>(null)
  const [editorReady, setEditorReady] = useState(false)
  const [inlineImagesLoading, setInlineImagesLoading] = useState(false)
  const [rawHtmlReady, setRawHtmlReady] = useState(false)
  const handleEditor = useCallback((editor: Editor | null) => {
    frameCleanupRef.current?.()
    frameCleanupRef.current = null

    if (!editor) {
      setEditorReady(false)
      setRawHtmlReady(false)
      return
    }

    setEditorReady(true)
    setRawHtmlReady(false)
    const frames = Array.from(
      bodyRef.current?.querySelectorAll<HTMLIFrameElement>(
        '.rich-text-raw-html-block__frame'
      ) ?? []
    )

    if (frames.length === 0) {
      setRawHtmlReady(true)
      return
    }

    let pendingFrames = frames.length
    let active = true
    const handleFrameLoad = () => {
      if (!active) return
      pendingFrames -= 1
      if (pendingFrames === 0) setRawHtmlReady(true)
    }
    const cleanup = () => {
      active = false
      frames.forEach(frame => frame.removeEventListener('load', handleFrameLoad))
    }
    frameCleanupRef.current = cleanup

    frames.forEach(frame => {
      if (frame.contentDocument?.readyState === 'complete') {
        handleFrameLoad()
      } else {
        frame.addEventListener('load', handleFrameLoad, { once: true })
      }
    })
  }, [])
  const handleInlineImagesLoadingChange = useCallback((loading: boolean) => {
    setInlineImagesLoading(loading)
  }, [])
  useEffect(() => () => frameCleanupRef.current?.(), [])
  const isRendering = !editorReady || !rawHtmlReady || inlineImagesLoading
  const bodyClassName = [styles.body, isRendering ? styles.bodyRendering : null]
    .filter(Boolean)
    .join(' ')

  return (
    <div ref={bodyRef} className={bodyClassName} aria-busy={isRendering}>
      {isRendering ? (
        <div className={styles.bodyLoading} role="status" aria-label="본문을 렌더링하는 중">
          <PFLoadingSpinner label="본문을 렌더링하는 중" />
        </div>
      ) : null}
      <RichTextViewer
        key={detail.id}
        content={body}
        contentFormat={detail.bodyFormat ?? 'html'}
        maxHeight="none"
        className={styles.content}
        onEditor={handleEditor}
        onInlineImagesLoadingChange={handleInlineImagesLoadingChange}
      />
    </div>
  )
}

export function ImpactStoryDetailPage() {
  const navigate = useNavigate()
  const storyId = getImpactStoryIdFromPath()
  const { data: detail, status, adjacent, refetch } = useImpactStoryDetail(storyId)

  const handleBackToList = () => {
    if (window.history.length > 1) {
      window.history.back()
      return
    }
    navigate(IMPACT_STORIES_PATH)
  }

  const handleGoToList = () => {
    navigate(IMPACT_STORIES_PATH)
  }

  if (status !== 'ready' || !detail) {
    return (
      <section className={styles.page}>
        <div className={styles.main}>
          <div className={styles.back}>
            <ProgramBackButton label="이전으로" onClick={handleBackToList} />
          </div>
          <div className={styles.status}>
            {status === 'loading' ? (
              <PFLoadingSpinner centered label="임팩트 스토리를 불러오는 중" />
            ) : (
              <PFText as="p" typo="bd-md-rg" color="neutral-cool-600">
                {statusMessage(status)}
              </PFText>
            )}
            {status === 'error' ? (
              <PFButton variant="tertiary" size="large" onClick={refetch}>
                다시 시도
              </PFButton>
            ) : null}
          </div>
        </div>
      </section>
    )
  }

  const body = detail.body?.trim() ?? ''
  const attachmentFiles = detail.attachments.map(file => ({
    id: file.id,
    fileName: file.name,
    href: file.fileUrl,
  }))

  return (
    <section className={styles.page}>
      <div className={styles.main}>
        <div className={styles.back}>
          <ProgramBackButton label="이전으로" onClick={handleBackToList} />
        </div>

        <div className={styles.layout}>
          <header className={styles.header}>
            <div className={styles.headerLead}>
              <PFCategoryBadge size="large" variant="primary" className={styles.categoryBadge}>
                {detail.categoryLabel}
              </PFCategoryBadge>

              <PFText as="h1" typo="page-title-md" color="black" className={styles.title}>
                {detail.title}
              </PFText>

              <div className={styles.meta}>
                <PFText as="span" typo="bd-lg-rg" color="neutral-cool-500">
                  {detail.publishedAtDetailLabel}
                </PFText>
                <span className={styles.viewCount}>
                  <PFText as="span" typo="bd-lg-rg" color="black">
                    조회
                  </PFText>
                  <PFText as="span" typo="bd-lg-rg" color="black">
                    {formatViewCount(detail.viewCount)}
                  </PFText>
                </span>
              </div>
            </div>

            {attachmentFiles.length > 0 ? (
              <PFAttachmentDropdown
                files={attachmentFiles}
                triggerLabel={`${attachmentFiles.length}개의 첨부파일`}
                className={styles.attachmentDropdown}
              />
            ) : null}
          </header>

          <PFDivider variant="focus" />

          {body ? (
            <ImpactStoryBody detail={detail} body={body} />
          ) : (
            <div className={styles.body}>
              {detail.blocks
                .filter(block => block.type === 'image')
                .map((block, index) => (
                  <div
                    key={`image-${index}`}
                    className={styles.imagePlaceholder}
                    style={{
                      height: block.heightPx != null ? `${block.heightPx}px` : undefined,
                      aspectRatio:
                        block.heightPx != null ? undefined : (block.aspectRatio ?? '16 / 9'),
                      backgroundColor: detail.placeholderColor,
                    }}
                    aria-hidden="true"
                  />
                ))}
            </div>
          )}

          <div className={styles.footerNav}>
            <ImpactStoryAdjacentNav previous={adjacent.previous} next={adjacent.next} />

            <div className={styles.listAction}>
              <PFButton
                variant="tertiary"
                size="xlarge"
                width={240}
                className={styles.listButton}
                onClick={handleGoToList}
              >
                목록으로
              </PFButton>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
