import { useEffect, useState } from 'react'
import type { FileAttachmentParagraph } from '@jakorea/form-schema/writing-form'
import { resolvePortalMemberImageSrc } from '@/shared/lib/resolve-portal-member-image-src'
import { PFText } from '@/shared/ui'
import type { LectureReportPreviewFile } from '../lib/lecture-report-preview-files'
import styles from './lecture-report-education-photos-preview.module.css'

const MIN_SLOT_COUNT = 2
const LECTURE_REPORT_PHOTO_DOWNLOAD_PURPOSE = '강의보고서 교육 사진 미리보기'

type LectureReportEducationPhotosPreviewProps = {
  paragraph: FileAttachmentParagraph
  files: LectureReportPreviewFile[]
}

function EducationPhotoSlot({ file }: { file: LectureReportPreviewFile }) {
  const [src, setSrc] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let alive = true
    setSrc(null)
    setFailed(false)

    void resolvePortalMemberImageSrc(file.fileObjectId, LECTURE_REPORT_PHOTO_DOWNLOAD_PURPOSE)
      .then(url => {
        if (alive) setSrc(url)
      })
      .catch(() => {
        if (alive) setFailed(true)
      })

    return () => {
      alive = false
    }
  }, [file.fileObjectId])

  const label = file.originalFileName?.trim() || '첨부 사진'

  return (
    <figure className={styles.slot}>
      {src && !failed ? (
        <img className={styles.image} src={src} alt={label} loading="lazy" decoding="async" />
      ) : (
        <PFText as="span" typo="bd-md-md" color="neutral-cool-500" className={styles.placeholder}>
          {failed ? '사진을 불러오지 못했습니다.' : label}
        </PFText>
      )}
    </figure>
  )
}

export function LectureReportEducationPhotosPreview({
  paragraph,
  files,
}: LectureReportEducationPhotosPreviewProps) {
  const title = paragraph.paragraphTitle?.trim() || '교육 사진'
  const description = paragraph.paragraphDescription?.trim()
  const showDescription = description && description !== '설명 입력' ? description : null
  const slotCount = Math.max(MIN_SLOT_COUNT, files.length)

  return (
    <section className={styles.root} aria-label={title}>
      <header className={styles.header}>
        <div className={styles.titleRow}>
          <h2 className={styles.title}>{title}</h2>
        </div>
        {showDescription ? (
          <PFText as="p" typo="bd-md-rg" color="neutral-cool-500" className={styles.description}>
            {showDescription}
          </PFText>
        ) : null}
      </header>
      <div className={styles.grid}>
        {Array.from({ length: slotCount }, (_, index) => {
          const file = files[index]
          if (!file) {
            return <div key={`empty-${index}`} className={styles.slotEmpty} aria-hidden />
          }
          return <EducationPhotoSlot key={file.formSubmissionFileId ?? file.fileObjectId} file={file} />
        })}
      </div>
    </section>
  )
}
