import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { PFCheckbox, PFText } from '@/shared/ui'
import { useHomeMain } from '../api/use-home-main'
import closeIconUrl from '../image/icon/close.svg'
import { hidePopupForOneDay, isPopupHiddenForOneDay } from '../lib/popup-hide'
import { selectRenderedHomePopups } from '../lib/popup-queue'
import { useMediaQuery } from '@/shared/hooks/use-media-query'
import { platformMediaQueries } from '@/shared/lib/breakpoints'
import { MAX_HOME_POPUPS, type HomePopup } from '../lib/view'
import styles from './popup-overlay.module.css'

function PopupCard({
  popup,
  hideToday,
  onHideTodayChange,
  onClose,
}: {
  popup: HomePopup
  hideToday: boolean
  onHideTodayChange: (checked: boolean) => void
  onClose: () => void
}) {
  const image = (
    <img className={styles.image} src={popup.imageUrl} alt={popup.altText || '홈 팝업'} />
  )

  return (
    <article className={styles.card}>
      {popup.href ? (
        <a
          className={[styles.thumbnail, styles.thumbnailLink].join(' ')}
          href={popup.href}
          {...(popup.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
          aria-label={popup.altText || '팝업 바로보기'}
        >
          {image}
        </a>
      ) : (
        <div className={styles.thumbnail}>{image}</div>
      )}

      <div className={styles.footer}>
        <div className={styles.bar}>
          <PFCheckbox
            className={styles.hideToday}
            size="large"
            checked={hideToday}
            onCheckedChange={onHideTodayChange}
          >
            1일 동안 보지 않음
          </PFCheckbox>
          <button className={styles.closeButton} type="button" onClick={onClose}>
            <span className={styles.closeIconWrap} aria-hidden="true">
              <img className={styles.closeIcon} src={closeIconUrl} alt="" />
            </span>
            <PFText as="span" typo="bd-md-sb" color="black">
              닫기
            </PFText>
          </button>
        </div>
      </div>
    </article>
  )
}

export function HomePopupOverlay() {
  const { popups, source } = useHomeMain()
  const [storageReady, setStorageReady] = useState(false)
  const [dismissedIds, setDismissedIds] = useState<ReadonlySet<string>>(() => new Set())
  const [hideTodayById, setHideTodayById] = useState<Readonly<Record<string, boolean>>>({})
  const panelRef = useRef<HTMLDivElement>(null)
  const isMobile = useMediaQuery(platformMediaQueries.belowPc)

  useEffect(() => {
    setStorageReady(true)
  }, [])

  const visiblePopups = useMemo(() => {
    if (!storageReady || source === 'pending') return []
    return popups
      .filter(popup => !dismissedIds.has(popup.id) && !isPopupHiddenForOneDay(popup.id))
      .slice(0, MAX_HOME_POPUPS)
  }, [dismissedIds, popups, source, storageReady])

  // 모바일은 하나씩 순서대로(닫으면 다음), PC는 기존처럼 함께 (QA-0482)
  const renderedPopups = useMemo(
    () => selectRenderedHomePopups(visiblePopups, isMobile),
    [isMobile, visiblePopups]
  )

  const open = renderedPopups.length > 0

  useEffect(() => {
    if (!open) return
    panelRef.current?.focus({ preventScroll: true })
  }, [open])

  function dismissPopup(popupId: string) {
    setDismissedIds(current => new Set([...current, popupId]))
  }

  function handleHideTodayChange(popup: HomePopup, checked: boolean) {
    setHideTodayById(current => ({ ...current, [popup.id]: checked }))
    if (!checked) return
    hidePopupForOneDay(popup.id)
    dismissPopup(popup.id)
  }

  function handleClose(popup: HomePopup) {
    if (hideTodayById[popup.id]) {
      hidePopupForOneDay(popup.id)
    }
    dismissPopup(popup.id)
  }

  if (!open) return null

  return createPortal(
    <div className={styles.backdrop}>
      <div
        ref={panelRef}
        className={styles.list}
        role="dialog"
        aria-modal="false"
        aria-label="홈 팝업"
        tabIndex={-1}
      >
        {renderedPopups.map(popup => (
          <PopupCard
            key={popup.id}
            popup={popup}
            hideToday={Boolean(hideTodayById[popup.id])}
            onHideTodayChange={checked => handleHideTodayChange(popup, checked)}
            onClose={() => handleClose(popup)}
          />
        ))}
      </div>
    </div>,
    document.body,
  )
}
