import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import type { Editor } from '@jakorea/rich-text/react'
import type { TextbookContent, TextbookTag } from '../model/types'
import { FallbackImage } from '@/features/careers'
import { RichTextViewer } from '@/shared/rich-text'
import { PFCategoryBadge, PFModal, PFText, SkeletonBlock } from '@/shared/ui'
import defaultTextbookThumbnailUrl from '@/shared/assets/illustration/illust-book.svg'
import { hasTextbookUnitIntroduction, visibleTextbookUnits } from '../lib/detail-display'
import badgeClassIconUrl from '../image/icon/badge-class-18.svg'
import styles from './detail-modal.module.css'

type DetailModalProps = {
  open: boolean
  content: TextbookContent | null
  /** 상세 응답 대기 중. content가 없으면 딥링크 첫 로딩 */
  loading?: boolean
  onClose: () => void
}

const TAG_ICON_SRC: Record<NonNullable<TextbookTag['icon']>, string> = {
  target: badgeClassIconUrl,
  category: badgeClassIconUrl,
  skill: badgeClassIconUrl,
}

/**
 * 스켈레톤 단원 수 — 처음 높이(=최소 높이)를 작게 잡는다.
 * 목록 unitCount와 실제 단원 소개 개수가 다를 수 있어(예: 5단원·소개 2개) 고정값을 쓴다.
 */
const UNIT_SKELETON_COUNT = 2
/** 이미지·단원 소개 준비를 기다리는 최대 시간. 넘으면 준비된 만큼 바로 보여 준다 */
const REVEAL_MAX_WAIT_MS = 1000

function thumbnailSrcOf(content: TextbookContent): string {
  return content.thumbnailUrl?.trim() || defaultTextbookThumbnailUrl
}

/** decode()는 숨은 탭에서 끝나지 않을 수 있어 짧게만 기다린다 */
const DECODE_WAIT_MS = 50

function waitForLoad(image: HTMLImageElement): Promise<void> {
  if (image.complete) return Promise.resolve()
  return new Promise(resolve => {
    image.addEventListener('load', () => resolve(), { once: true })
    image.addEventListener('error', () => resolve(), { once: true })
  })
}

/** 레이아웃에 필요한 크기는 load로 확정되고, 페인트 끊김을 줄이려 decode를 잠깐 기다린다 */
async function decodeImage(image: HTMLImageElement): Promise<void> {
  await waitForLoad(image)
  await Promise.race([
    image.decode().catch(() => undefined),
    new Promise<void>(resolve => window.setTimeout(resolve, DECODE_WAIT_MS)),
  ])
}

/** 화면에 붙이기 전에 이미지를 받아 디코드한다. 끝나면(실패 포함) true */
function useDecodedImage(src: string | null): boolean {
  const [decodedSrc, setDecodedSrc] = useState<string | null>(null)

  useEffect(() => {
    if (!src) return
    let cancelled = false
    const image = new Image()
    image.src = src
    void decodeImage(image).then(() => {
      if (!cancelled) setDecodedSrc(src)
    })
    return () => {
      cancelled = true
    }
  }, [src])

  return src != null && decodedSrc === src
}

/**
 * 안쪽 높이를 재서 바깥 높이를 전환한다.
 * 처음 잰 높이(스켈레톤)를 최소 높이로 삼아, 내용이 크면 부드럽게 늘어나고 작으면 줄어들지 않는다.
 * 모달이 세로 중앙 정렬이라 줄어드는 움직임이 특히 튀어 보여서다.
 */
function SmoothHeight({ className, children }: { className?: string; children: ReactNode }) {
  const innerRef = useRef<HTMLDivElement>(null)
  const [height, setHeight] = useState<number | null>(null)

  useEffect(() => {
    const inner = innerRef.current
    if (!inner || typeof ResizeObserver === 'undefined') return
    let floor: { width: number; height: number } | null = null
    const observer = new ResizeObserver(() => {
      const width = inner.offsetWidth
      const measured = inner.offsetHeight
      // 폭이 바뀌면(PC↔모바일 등) 줄바꿈이 달라지므로 최소 높이를 다시 잡는다
      if (floor == null || floor.width !== width) floor = { width, height: measured }
      setHeight(Math.max(measured, floor.height))
    })
    observer.observe(inner)
    return () => observer.disconnect()
  }, [])

  return (
    <div className={styles.smoothHeight} style={height == null ? undefined : { height }}>
      <div ref={innerRef} className={className}>
        {children}
      </div>
    </div>
  )
}

function DetailValueSkeleton() {
  return <SkeletonBlock className={`${styles.skeletonSessionLine} ${styles.skeletonAppear}`} />
}

function UnitIntroSkeleton({ count }: { count: number }) {
  return (
    <ul className={`${styles.units} ${styles.skeletonAppear}`} aria-hidden="true">
      {Array.from({ length: count }, (_, index) => (
        <li key={index} className={styles.unit}>
          <SkeletonBlock className={styles.skeletonUnitHeading} />
          <SkeletonBlock className={styles.skeletonUnitDescription} />
        </li>
      ))}
    </ul>
  )
}

function SummaryCopySkeleton() {
  return (
    <div className={`${styles.summaryContent} ${styles.skeletonAppear}`} aria-hidden="true">
      <div className={styles.summaryCopy}>
        <SkeletonBlock className={styles.skeletonTitle} />
        <SkeletonBlock className={styles.skeletonDescription} />
        <SkeletonBlock className={styles.skeletonDescriptionShort} />
      </div>
      <div className={styles.tags}>
        <SkeletonBlock className={styles.skeletonTag} />
        <SkeletonBlock className={styles.skeletonTag} />
      </div>
    </div>
  )
}

/** 고정 160×220(모바일 120×165) 슬롯. 준비 전에는 스켈레톤, 준비되면 이미지를 페이드 인 */
function TextbookModalThumbnail({
  src,
  hasRemoteImage,
  revealed,
}: {
  src: string | null
  hasRemoteImage: boolean
  revealed: boolean
}) {
  return (
    <div
      className={[
        styles.thumbnailWrap,
        hasRemoteImage ? styles.thumbnailWrapHasImage : styles.thumbnailWrapNoImage,
      ].join(' ')}
    >
      {revealed ? null : (
        <SkeletonBlock className={`${styles.thumbnailSkeleton} ${styles.skeletonAppear}`} />
      )}
      {src ? (
        <FallbackImage
          className={[styles.thumbnail, revealed ? styles.thumbnailVisible : undefined]
            .filter(Boolean)
            .join(' ')}
          src={src}
          fallbackSrc={defaultTextbookThumbnailUrl}
          alt=""
          width={160}
          height={220}
          decoding="async"
        />
      ) : null}
    </div>
  )
}

/**
 * 단원 소개 HTML. 에디터가 첫 프레임에 비어 있다가 채워지고(immediatelyRender: false),
 * 본문 이미지도 늦게 붙으므로 둘 다 끝난 뒤 onReady를 부른다.
 */
function UnitIntroRichText({ html, onReady }: { html: string; onReady: () => void }) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const [editorReady, setEditorReady] = useState(false)
  const [imagesHydrating, setImagesHydrating] = useState(false)

  const handleEditor = useCallback((editor: Editor | null) => {
    setEditorReady(editor != null)
  }, [])

  useEffect(() => {
    if (!editorReady || imagesHydrating) return
    let cancelled = false
    // 에디터 DOM이 붙은 뒤 본문 이미지를 디코드한다 (rAF는 탭이 숨으면 멈춰 setTimeout 사용)
    const timer = window.setTimeout(() => {
      const images = Array.from(wrapRef.current?.querySelectorAll('img') ?? [])
      void Promise.all(images.map(decodeImage)).then(() => {
        if (!cancelled) onReady()
      })
    })
    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [editorReady, imagesHydrating, onReady])

  return (
    <div ref={wrapRef}>
      <RichTextViewer
        className={styles.unitIntro}
        content={html}
        contentFormat="html"
        maxHeight="none"
        onEditor={handleEditor}
        onInlineImagesLoadingChange={setImagesHydrating}
      />
    </div>
  )
}

/** dd는 기본 글꼴(16px)을 물려받아 줄 높이가 라벨보다 커지므로, 라벨과 같은 bd-sm 블록으로 감싼다 */
function SessionValue({ content }: { content: TextbookContent }) {
  if (content.unitCount > 0) {
    return (
      <PFText as="p" typo="bd-sm-rg" color="black" className={styles.sessionValue}>
        <PFText as="span" typo="bd-sm-sb" color="black">
          총 {content.unitCount}단원
        </PFText>
        {content.unitSessionText ? (
          <PFText as="span" typo="bd-sm-rg" color="black">
            {' '}
            ({content.unitSessionText})
          </PFText>
        ) : null}
      </PFText>
    )
  }
  return (
    <PFText as="p" typo="bd-sm-sb" color="black" className={styles.sessionValue}>
      {content.sessionSummary}
    </PFText>
  )
}

function DetailRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className={styles.detailRow}>
      <PFText as="dt" typo="bd-sm-rg" color="neutral-cool-600" className={styles.detailLabel}>
        {label}
      </PFText>
      <dd className={styles.detailValue}>{children}</dd>
    </div>
  )
}

function UnitList({ content }: { content: TextbookContent }) {
  return (
    <ul className={styles.units}>
      {visibleTextbookUnits(content.units).map(unit => (
        <li key={`${unit.unitLabel ?? ''}-${unit.title}`} className={styles.unit}>
          <p className={styles.unitHeading}>
            {unit.unitLabel ? (
              <>
                <span className={`typo-bd-sm-rg ${styles.unitLabel}`}>{unit.unitLabel}</span>{' '}
              </>
            ) : null}
            <span className={`typo-bd-sm-sb ${styles.unitTitle}`}>{unit.title}</span>
          </p>
          {unit.description.trim() ? (
            <PFText as="p" typo="bd-md-rg" color="black" className={styles.unitDescription}>
              {unit.description}
            </PFText>
          ) : null}
        </li>
      ))}
    </ul>
  )
}

export function DetailModal({ open, content, loading = false, onClose }: DetailModalProps) {
  /** 상세 응답까지 받은 상태. 이때부터 실제 내용을 (숨긴 채) 그려 준비시킨다 */
  const dataReady = content != null && !loading
  const contentId = content?.id ?? null
  const introHtml = content?.unitIntroHtml?.trim() ?? ''

  const thumbnailSrc = content ? thumbnailSrcOf(content) : null
  const thumbnailDecoded = useDecodedImage(dataReady ? thumbnailSrc : null)

  const [introReadyId, setIntroReadyId] = useState<string | null>(null)
  const [timedOutId, setTimedOutId] = useState<string | null>(null)

  const handleIntroReady = useCallback(() => {
    setIntroReadyId(contentId)
  }, [contentId])

  useEffect(() => {
    if (!dataReady || contentId == null) return
    const timer = window.setTimeout(() => setTimedOutId(contentId), REVEAL_MAX_WAIT_MS)
    return () => window.clearTimeout(timer)
  }, [dataReady, contentId])

  const introReady = !introHtml || introReadyId === contentId
  /** 썸네일·단원 소개가 다 준비되면(또는 최대 대기 시간이 지나면) 한 번에 바꿔 보여 준다 */
  const revealed = dataReady && ((thumbnailDecoded && introReady) || timedOutId === contentId)

  if (open && !loading && content == null) {
    return (
      <PFModal open={open} onClose={onClose} title="교육 콘텐츠 안내" size="lg">
        <div className={styles.loading}>
          <PFText as="p" typo="bd-md-rg" color="neutral-cool-600">
            교육 콘텐츠를 불러오지 못했습니다.
          </PFText>
        </div>
      </PFModal>
    )
  }

  const hasUnitIntroduction = content ? hasTextbookUnitIntroduction(content) : false
  const hasSessionValue = content
    ? content.unitCount > 0 || Boolean(content.sessionSummary.trim())
    : false

  const realDetails = content ? (
    <dl className={styles.details}>
      <DetailRow label="교육 차시">
        <SessionValue content={content} />
      </DetailRow>
      {hasUnitIntroduction ? (
        <DetailRow label="단원 소개">
          {introHtml ? (
            <UnitIntroRichText html={introHtml} onReady={handleIntroReady} />
          ) : (
            <UnitList content={content} />
          )}
        </DetailRow>
      ) : null}
    </dl>
  ) : null

  const skeletonDetails = (
    <dl className={styles.details} aria-hidden="true">
      <DetailRow label="교육 차시">
        {content && hasSessionValue ? <SessionValue content={content} /> : <DetailValueSkeleton />}
      </DetailRow>
      <DetailRow label="단원 소개">
        <UnitIntroSkeleton count={UNIT_SKELETON_COUNT} />
      </DetailRow>
    </dl>
  )

  return (
    <PFModal open={open} onClose={onClose} title="교육 콘텐츠 안내" size="lg">
      <div
        className={styles.body}
        aria-busy={revealed ? undefined : true}
        aria-label={revealed ? undefined : '교육 콘텐츠를 불러오는 중'}
      >
        <SmoothHeight className={styles.bodyInner}>
          <div className={styles.summary}>
            <TextbookModalThumbnail
              src={thumbnailSrc}
              hasRemoteImage={Boolean(content?.thumbnailUrl?.trim())}
              revealed={revealed}
            />

            {content ? (
              <div className={styles.summaryContent}>
                <div className={styles.summaryCopy}>
                  <PFText as="h3" typo="hl-lg" color="black" className={styles.contentTitle}>
                    {content.title}
                  </PFText>
                  <PFText
                    as="p"
                    typo="bd-md-rg"
                    color="neutral-cool-600"
                    className={styles.contentDescription}
                  >
                    {content.description}
                  </PFText>
                </div>
                {content.modalTags.length > 0 ? (
                  <div className={styles.tags}>
                    {content.modalTags.map(tag => (
                      <PFCategoryBadge
                        key={tag.label}
                        size="small"
                        iconVariant="primary"
                        icon={
                          tag.icon ? (
                            <img
                              src={TAG_ICON_SRC[tag.icon]}
                              alt=""
                              width={18}
                              height={18}
                              aria-hidden="true"
                            />
                          ) : undefined
                        }
                      >
                        {tag.label}
                      </PFCategoryBadge>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : (
              <SummaryCopySkeleton />
            )}
          </div>

          {/* 준비 전: 스켈레톤이 자리를 잡고, 실제 내용은 흐름 밖에서 숨긴 채 미리 그린다 */}
          <div className={styles.detailsStage}>
            {revealed ? null : skeletonDetails}
            {dataReady ? (
              <div
                className={revealed ? undefined : styles.detailsPrerender}
                aria-hidden={revealed ? undefined : true}
              >
                {realDetails}
              </div>
            ) : null}
          </div>
        </SmoothHeight>
      </div>
    </PFModal>
  )
}
