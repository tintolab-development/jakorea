import { useEffect, useId, useRef, useState } from 'react'
import type { EducationInProgressFile } from '../model/types'
import {
  formatEducationNoticeFileDate,
  formatEducationNoticeFileSize,
} from '../lib/format'
import fileDocumentUrl from '../assets/icon/file-document.svg'
import moreVerticalUrl from '../assets/icon/more-vertical.svg'
import filePreviewUrl from '@/shared/assets/icons/file-preview.svg'
import { PFOptionList, PFText } from '@/shared/ui'
import styles from './file-row.module.css'

const IMAGE_FILE_PATTERN = /\.(png|jpe?g|gif|webp|svg)$/i

function isImageFileName(fileName: string) {
  return IMAGE_FILE_PATTERN.test(fileName)
}

type EducationInProgressFileRowProps = {
  file: EducationInProgressFile
  onDownload: (file: EducationInProgressFile) => void
  onViewOriginal: (file: EducationInProgressFile) => void
}

export function EducationInProgressFileRow({
  file,
  onDownload,
  onViewOriginal,
}: EducationInProgressFileRowProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const menuWrapRef = useRef<HTMLDivElement>(null)
  const menuId = useId()
  const dateLabel = formatEducationNoticeFileDate(file.uploadedAt)
  const sizeLabel = formatEducationNoticeFileSize(file.fileSizeBytes)
  const isImage = isImageFileName(file.fileName)

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

  const handleMenuAction = (value: string) => {
    setIsMenuOpen(false)
    if (value === 'download') {
      onDownload(file)
      return
    }
    if (value === 'view-original') {
      onViewOriginal(file)
    }
  }

  const fileMenuOptions = [
    { value: 'download', label: '다운로드' },
    { value: 'view-original', label: '원글보기' },
  ]

  return (
    <div className={styles.row}>
      {isImage ? (
        <img className={styles.imageCover} src={filePreviewUrl} alt="" aria-hidden="true" />
      ) : (
        <div className={styles.icon} aria-hidden="true">
          <img className={styles.iconImg} src={fileDocumentUrl} alt="" />
        </div>
      )}

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
          <PFOptionList
            id={menuId}
            className={styles.menu}
            role="menu"
            options={fileMenuOptions}
            onSelect={handleMenuAction}
          />
        ) : null}
      </div>
    </div>
  )
}
