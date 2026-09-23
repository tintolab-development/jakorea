import { useState } from 'react'
import type { EducationTeacherAssignedInstructor } from '../../model/types'
import downloadIconUrl from '@/shared/assets/icons/file-download-gray.svg'
import { downloadAttachment, needsEmptyAttachmentFallback } from '@/shared/lib/download-attachment'
import { requestAssignedInstructorConsentDownload } from '../../api/assigned-instructors'
import { PFPageButton, PFText } from '@/shared/ui'
import styles from './assigned-instructor-card.module.css'

export type TeacherAssignedInstructorCardProps = {
  applicationId?: string
  instructors: EducationTeacherAssignedInstructor[]
}

function ConsentList({
  applicationId,
  instructor,
}: {
  applicationId?: string
  instructor: EducationTeacherAssignedInstructor
}) {
  const consents = instructor.consentDocumentsRequested === true ? (instructor.consents ?? []) : []

  if (consents.length === 0) return null

  return (
    <ul className={styles.consentList}>
      {consents.map((consent, index) => (
        <li key={consent.id} className={styles.consentItem}>
          {index > 0 ? <div className={styles.divider} aria-hidden="true" /> : null}
          <div className={styles.consentRow}>
            <PFText as="span" typo="bd-sm-md" color="black" className={styles.consentTitle}>
              {consent.title}
            </PFText>
            {consent.documentId != null ||
            (consent.fileUrl != null && !needsEmptyAttachmentFallback(consent.fileUrl)) ? (
              <button
                type="button"
                className={styles.downloadButton}
                aria-label={`${consent.title} 다운로드`}
                onClick={() => {
                  const numericApplicationId =
                    applicationId != null && /^\d+$/.test(applicationId)
                      ? Number(applicationId)
                      : null
                  if (
                    numericApplicationId != null &&
                    instructor.instructorMemberId != null &&
                    consent.documentId != null
                  ) {
                    void requestAssignedInstructorConsentDownload({
                      applicationId: numericApplicationId,
                      instructorMemberId: instructor.instructorMemberId,
                      documentId: consent.documentId,
                    })
                      .then(resolved =>
                        downloadAttachment(
                          consent.originalFileName || consent.title,
                          resolved.downloadUrl
                        )
                      )
                      .catch(error => {
                        console.error('[attachment] assigned instructor consent failed', error)
                      })
                    return
                  }
                  if (needsEmptyAttachmentFallback(consent.fileUrl)) return
                  void downloadAttachment(consent.title, consent.fileUrl)
                }}
              >
                <img src={downloadIconUrl} alt="" width={20} height={20} aria-hidden="true" />
              </button>
            ) : (
              <span className={styles.downloadButton} aria-hidden="true">
                <img src={downloadIconUrl} alt="" width={20} height={20} />
              </span>
            )}
          </div>
        </li>
      ))}
    </ul>
  )
}

export function TeacherAssignedInstructorCard({
  applicationId,
  instructors,
}: TeacherAssignedInstructorCardProps) {
  const [index, setIndex] = useState(0)
  const total = instructors.length
  if (total === 0) return null

  const safeIndex = Math.min(index, total - 1)
  const instructor = instructors[safeIndex]!
  const showCarousel = total > 1

  return (
    <div className={styles.card}>
      <div className={styles.nameRow}>
        <div className={styles.nameGroup}>
          <PFText as="span" typo="hl-sm" color="black" className={styles.name}>
            {instructor.name}
          </PFText>
          <PFText as="span" typo="bd-lg-rg" color="black">
            강사님
          </PFText>
        </div>

        {showCarousel ? (
          <div className={styles.carouselControls}>
            <PFText as="span" typo="caption-sb" color="black" className={styles.carouselIndex}>
              {safeIndex + 1}
              <PFText as="span" typo="caption-rg" color="neutral-warm-500">
                {' '}
                / {total}
              </PFText>
            </PFText>
            <PFPageButton
              size="small"
              direction="left"
              aria-label="이전 강사"
              disabled={safeIndex <= 0}
              onClick={() => setIndex(prev => Math.max(0, prev - 1))}
            />
            <PFPageButton
              size="small"
              direction="right"
              aria-label="다음 강사"
              disabled={safeIndex >= total - 1}
              onClick={() => setIndex(prev => Math.min(total - 1, prev + 1))}
            />
          </div>
        ) : null}
      </div>

      <ConsentList applicationId={applicationId} instructor={instructor} />
    </div>
  )
}
