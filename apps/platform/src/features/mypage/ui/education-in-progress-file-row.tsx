import { useEffect, useId, useRef, useState } from 'react'
import type { EducationInProgressFile } from '../model/education-in-progress-notice-types'
import {
  formatEducationNoticeFileDate,
  formatEducationNoticeFileSize,
} from '../lib/education-in-progress-notice-format'
import fileDocumentUrl from '../assets/icon/file-document.svg'
import moreVerticalUrl from '../assets/icon/more-vertical.svg'
import { PFText } from '@/shared/ui'
import styles from './education-in-progress-file-row.module.css'

type EducationInProgressFileRowProps = {
  file: EducationInProgressFile
  onComingSoon: () => void
}

export function EducationInProgressFileRow({
  file,
  onComingSoon,
}: EducationInProgressFileRowProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const menuWrapRef = useRef<HTMLDivElement>(null)
  const menuId = useId()
  const dateLabel = formatEducationNoticeFileDate(file.uploadedAt)
  const sizeLabel = formatEducationNoticeFileSize(file.fileSizeBytes)

  useEffect(() => {
    if (!isMenuOpen) return

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target
      if (!(target instanceof Node)) return
      if (menuWrapRef.current?.contains(target)) return
      setIsMenuOpen(false)
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsMenuOpen(false)
    }

    window.addEventListener('mousedown', handlePointerDown)
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('mousedown', handlePointerDown)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isMenuOpen])

  const handleMenuAction = () => {
    setIsMenuOpen(false)
    onComingSoon()
  }

  return (
    <div className={styles.row}>
      <div className={styles.icon} aria-hidden="true">
        <img className={styles.iconImg} src={fileDocumentUrl} alt="" />
      </div>

      <div className={styles.info}>
        <PFText as="p" typo="bd-sm-sb" color="black" className={styles.name} title={file.fileName}>
          {file.fileName}
        </PFText>
        <div className={styles.meta}>
          <PFText as="span" typo="bd-sm-rg" color="neutral-cool-500" className={styles.metaText}>
            {dateLabel}
          </PFText>
          {sizeLabel ? (
            <>
              <span className={styles.metaDivider} aria-hidden="true" />
              <PFText as="span" typo="bd-sm-rg" color="neutral-cool-500" className={styles.metaText}>
                {sizeLabel}
              </PFText>
            </>
          ) : null}
        </div>
      </div>

      <div className={styles.menuWrap} ref={menuWrapRef}>
        <button
          type="button"
          className={styles.menuButton}
          aria-label={`${file.fileName} 파일 메뉴`}
          aria-haspopup="menu"
          aria-expanded={isMenuOpen}
          aria-controls={isMenuOpen ? menuId : undefined}
          onClick={() => setIsMenuOpen(open => !open)}
        >
          <img className={styles.menuIcon} src={moreVerticalUrl} alt="" aria-hidden="true" />
        </button>
        {isMenuOpen ? (
          <div className={styles.menu} id={menuId} role="menu">
            <button
              type="button"
              className={`typo-bd-sm-md ${styles.menuItem}`}
              role="menuitem"
              onClick={handleMenuAction}
            >
              다운로드
            </button>
            <button
              type="button"
              className={`typo-bd-sm-md ${styles.menuItem}`}
              role="menuitem"
              onClick={handleMenuAction}
            >
              원문보기
            </button>
          </div>
        ) : null}
      </div>
    </div>
  )
}
