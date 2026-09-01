import { forwardRef, useLayoutEffect, useRef, type CSSProperties, type MutableRefObject, type Ref } from 'react'
import type { Program } from '@/types/domain'
import { PlatformPreviewFooter } from './platform-shell/footer'
import { PlatformPreviewHeader } from './platform-shell/header'
import './platform-shell/platform-preview-tokens.css'
import {
  mapProgramToParticipantRecruitmentUserView,
  RECRUITMENT_USER_PREVIEW_PAGE_HEIGHT,
  RECRUITMENT_USER_PREVIEW_MAIN_PADDING_TOP,
  RECRUITMENT_USER_PREVIEW_PLATFORM_HEADER_HEIGHT,
  RECRUITMENT_USER_PREVIEW_TOP_FAB_OFFSET_FROM_PAGE_TOP,
  RECRUITMENT_USER_PREVIEW_SIDEBAR_OFFSET_FROM_HEADER_BOTTOM,
  RECRUITMENT_USER_PREVIEW_BODY_FOOTER_GAP,
} from './lib/map-program-to-user-view'
import { ParticipantRecruitmentUserPageContent } from './user-page-content'
import './user-page.css'

export type ParticipantRecruitmentUserPageProps = {
  program: Program
  sponsorName?: string
  /** A4 페이지 min-height 패딩(모달 미리보기). fullscreen은 자연 높이 + 뷰포트 스케일 */
  layoutMode?: 'a4' | 'fullscreen'
}

function TopIcon() {
  return (
    <svg
      className="user-page__top-fab-icon"
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden
    >
      <path
        d="M9 3.825L9 16L7 16L7 3.825L1.4 9.425L-3.49691e-07 8L8 -3.49691e-07L16 8L14.6 9.425L9 3.825Z"
        fill="white"
      />
    </svg>
  )
}

function mergeRefs<T>(...refs: Array<Ref<T> | undefined>) {
  return (node: T | null) => {
    refs.forEach(refItem => {
      if (typeof refItem === 'function') {
        refItem(node)
      } else if (refItem) {
        ;(refItem as MutableRefObject<T | null>).current = node
      }
    })
  }
}

/** Platform DS 기반 참여자 모집 사용자 상세 전체본 (1920px 디자인 캔버스) */
export const ParticipantRecruitmentUserPage = forwardRef<
  HTMLDivElement,
  ParticipantRecruitmentUserPageProps
>(function ParticipantRecruitmentUserPage({ program, sponsorName, layoutMode = 'a4' }, ref) {
  const rootRef = useRef<HTMLDivElement>(null)
  const viewModel = mapProgramToParticipantRecruitmentUserView(program, sponsorName)
  const isFullscreenLayout = layoutMode === 'fullscreen'

  useLayoutEffect(() => {
    if (isFullscreenLayout) return

    const node = rootRef.current
    if (!node) return

    const applyA4PaddedMinHeight = () => {
      node.style.minHeight = '0px'
      const naturalHeight = node.scrollHeight
      const totalPages = Math.max(
        1,
        Math.ceil(naturalHeight / RECRUITMENT_USER_PREVIEW_PAGE_HEIGHT)
      )
      node.style.minHeight = `${totalPages * RECRUITMENT_USER_PREVIEW_PAGE_HEIGHT}px`
    }

    applyA4PaddedMinHeight()

    const observer = new ResizeObserver(() => {
      applyA4PaddedMinHeight()
    })
    observer.observe(node)

    return () => {
      observer.disconnect()
    }
  }, [program.id, sponsorName, isFullscreenLayout])

  return (
    <div
      ref={mergeRefs(ref, rootRef)}
      className={[
        'platform-user-preview-root',
        'user-page',
        isFullscreenLayout ? 'user-page--fullscreen' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      style={
        {
          '--user-page-platform-header-height': `${RECRUITMENT_USER_PREVIEW_PLATFORM_HEADER_HEIGHT}px`,
          '--user-page-main-padding-top': `${RECRUITMENT_USER_PREVIEW_MAIN_PADDING_TOP}px`,
          '--user-page-top-fab-offset-from-page-top': `${RECRUITMENT_USER_PREVIEW_TOP_FAB_OFFSET_FROM_PAGE_TOP}px`,
          '--user-page-sidebar-offset-from-header-bottom': `${RECRUITMENT_USER_PREVIEW_SIDEBAR_OFFSET_FROM_HEADER_BOTTOM}px`,
          '--user-page-body-footer-gap': `${RECRUITMENT_USER_PREVIEW_BODY_FOOTER_GAP}px`,
        } as CSSProperties
      }
    >
      <PlatformPreviewHeader />
      <main className="user-page__main">
        <ParticipantRecruitmentUserPageContent viewModel={viewModel} />
      </main>
      <button type="button" className="user-page__top-fab" aria-label="Top" tabIndex={-1}>
        <TopIcon />
      </button>
      <PlatformPreviewFooter />
    </div>
  )
})
