import { useState } from 'react'
import type { EducationTeacherAssignedInstructor } from '../../model/types'
import downloadIconUrl from '@/shared/assets/icons/file-download-gray.svg'
import { downloadAttachment } from '@/shared/lib/download-attachment'
import {
  requestAssignedInstructorConsentDownload,
  type AssignedInstructorApplicationType,
} from '../../api/assigned-instructors'
import {
  SEX_OFFENSE_INSTRUCTOR_CARD_DIRECT_MESSAGE,
  SEX_OFFENSE_INSTRUCTOR_CARD_ONLINE_MESSAGE,
  type SexOffenseInquiryCase,
} from '@jakorea/form-schema/program-application'
import { resolveAssignedInstructorCardBody } from '../../lib/teacher-assignment-aside'
import { PFPageButton, PFText } from '@/shared/ui'
import styles from './assigned-instructor-card.module.css'

export type TeacherAssignedInstructorCardProps = {
  applicationId?: string
  applicationType?: AssignedInstructorApplicationType
  instructors: EducationTeacherAssignedInstructor[]
  onRefresh?: () => Promise<unknown>
  /** 진행 중일 때만 기관 신청 조회 방식 CASE. 미설정이면 CASE 1로 간주하지 않음 */
  sexOffenseInquiryCase?: SexOffenseInquiryCase | null
}

function readErrorCode(error: unknown): string | undefined {
  const responseData = (error as { response?: { data?: unknown } } | null)?.response?.data
  if (!responseData || typeof responseData !== 'object') return undefined
  const responseError = (responseData as { error?: { code?: unknown } }).error
  return typeof responseError?.code === 'string' ? responseError.code : undefined
}

function readErrorStatus(error: unknown): number | undefined {
  const status = (error as { response?: { status?: unknown } } | null)?.response?.status
  return typeof status === 'number' ? status : undefined
}

function resolveDownloadErrorMessage(error: unknown): string {
  switch (readErrorCode(error)) {
    case 'ASSIGNED_INSTRUCTOR_CONSENT_NOT_VISIBLE':
      return '현재 신청에 연결된 동의서가 아닙니다. 최신 정보를 다시 확인해 주세요.'
    case 'APPLICATION_NOT_FOUND':
    case 'ASSIGNED_INSTRUCTOR_NOT_FOUND':
    case 'ASSIGNED_INSTRUCTOR_CONSENT_NOT_FOUND':
      return '신청 또는 강사 정보가 변경되었습니다. 최신 정보를 다시 확인해 주세요.'
    case 'ASSIGNED_INSTRUCTOR_CONSENT_NOT_READY':
      return '동의서 파일이 아직 준비되지 않았습니다. 잠시 후 다시 시도해 주세요.'
    case 'ASSIGNED_INSTRUCTOR_CONSENT_NOT_AVAILABLE':
      return '철회되었거나 만료된 동의서입니다. 최신 정보를 다시 확인해 주세요.'
    default:
      return '동의서 다운로드에 실패했습니다. 잠시 후 다시 시도해 주세요.'
  }
}

function ConsentList({
  applicationId,
  applicationType,
  instructor,
  onRefresh,
}: {
  applicationId?: string
  applicationType?: AssignedInstructorApplicationType
  instructor: EducationTeacherAssignedInstructor
  onRefresh?: () => Promise<unknown>
}) {
  const [downloadingDocumentId, setDownloadingDocumentId] = useState<number | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const consents =
    instructor.consentDocumentsRequested === true && (instructor.consents?.length ?? 0) > 0
      ? instructor.consents ?? []
      : []

  if (consents.length === 0) return null

  const numericApplicationId =
    applicationId != null && /^\d+$/.test(applicationId) ? Number(applicationId) : null

  return (
    <>
      <ul className={styles.consentList}>
        {consents.map((consent, index) => {
          const canDownload =
            consent.documentId != null &&
            numericApplicationId != null &&
            applicationType != null &&
            instructor.instructorMemberId != null
          const isDownloading = downloadingDocumentId === consent.documentId

          return (
            <li key={consent.id} className={styles.consentItem}>
              {index > 0 ? <div className={styles.divider} aria-hidden="true" /> : null}
              <div className={styles.consentRow}>
                <PFText as="span" typo="bd-sm-md" color="black" className={styles.consentTitle}>
                  {consent.title}
                </PFText>
                {canDownload ? (
                  <button
                    type="button"
                    className={styles.downloadButton}
                    aria-label={`${consent.title} 다운로드`}
                    aria-busy={isDownloading}
                    disabled={isDownloading}
                    onClick={() => {
                      if (
                        numericApplicationId == null ||
                        applicationType == null ||
                        instructor.instructorMemberId == null ||
                        consent.documentId == null ||
                        isDownloading
                      ) {
                        return
                      }
                      setErrorMessage(null)
                      setDownloadingDocumentId(consent.documentId)
                      void requestAssignedInstructorConsentDownload({
                        applicationType,
                        applicationId: numericApplicationId,
                        instructorMemberId: instructor.instructorMemberId,
                        documentId: consent.documentId,
                      })
                        .then(resolved => {
                          if (!resolved.downloadUrl?.trim()) {
                            throw new Error('동의서 다운로드 주소를 받지 못했습니다.')
                          }
                          return downloadAttachment(
                            consent.originalFileName || consent.title,
                            resolved.downloadUrl,
                            resolved.requiredHeaders,
                          )
                        })
                        .catch(async error => {
                          console.error('[attachment] assigned instructor consent failed', error)
                          setErrorMessage(resolveDownloadErrorMessage(error))
                          const code = readErrorCode(error)
                          const status = readErrorStatus(error)
                          if (
                            (status === 404 ||
                              code === 'APPLICATION_NOT_FOUND' ||
                              code === 'ASSIGNED_INSTRUCTOR_NOT_FOUND' ||
                              code === 'ASSIGNED_INSTRUCTOR_CONSENT_NOT_FOUND' ||
                              code === 'ASSIGNED_INSTRUCTOR_CONSENT_NOT_AVAILABLE' ||
                              code === 'ASSIGNED_INSTRUCTOR_CONSENT_NOT_VISIBLE') &&
                            onRefresh
                          ) {
                            await onRefresh()
                          }
                        })
                        .finally(() => setDownloadingDocumentId(null))
                    }}
                  >
                    <img src={downloadIconUrl} alt="" width={20} height={20} aria-hidden="true" />
                  </button>
                ) : (
                  <span className={styles.downloadButton} aria-label="다운로드할 수 없는 동의서">
                    <img src={downloadIconUrl} alt="" width={20} height={20} />
                  </span>
                )}
              </div>
            </li>
          )
        })}
      </ul>
      {errorMessage ? (
        <PFText as="p" typo="caption-rg" color="neutral-warm-500" role="alert">
          {errorMessage}
        </PFText>
      ) : null}
    </>
  )
}

function SiteSubmissionMessage({ message }: { message: string }) {
  return (
    <PFText as="p" typo="bd-lg-rg" color="neutral-cool-500" className={styles.siteMessage}>
      {message}
    </PFText>
  )
}

export function TeacherAssignedInstructorCard({
  applicationId,
  applicationType,
  instructors,
  onRefresh,
  sexOffenseInquiryCase,
}: TeacherAssignedInstructorCardProps) {
  const [index, setIndex] = useState(0)
  const total = instructors.length
  if (total === 0) return null

  const safeIndex = Math.min(index, total - 1)
  const instructor = instructors[safeIndex]!
  const cardBody = resolveAssignedInstructorCardBody(sexOffenseInquiryCase)
  const siteMessage =
    cardBody === 'site_direct'
      ? SEX_OFFENSE_INSTRUCTOR_CARD_DIRECT_MESSAGE
      : cardBody === 'site_online'
        ? SEX_OFFENSE_INSTRUCTOR_CARD_ONLINE_MESSAGE
        : null
  const showConsentDocuments = cardBody === 'consents'

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
      </div>
      {instructor.assignmentId != null ||
      instructor.programScheduleId != null ||
      instructor.assignmentStatus?.trim() ? (
        <div className={styles.assignmentMeta}>
          {instructor.assignmentId != null ? (
            <PFText as="p" typo="bd-sm-rg" color="neutral-cool-600">
              배정 {instructor.assignmentId}
            </PFText>
          ) : null}
          {instructor.programScheduleId != null ? (
            <PFText as="p" typo="bd-sm-rg" color="neutral-cool-600">
              일정 {instructor.programScheduleId}
            </PFText>
          ) : null}
          {instructor.assignmentStatus?.trim() ? (
            <PFText as="p" typo="bd-sm-rg" color="neutral-cool-600">
              {instructor.assignmentStatus.trim()}
            </PFText>
          ) : null}
        </div>
      ) : null}
      {instructor.phone?.trim() ? (
        <PFText as="p" typo="bd-sm-rg" color="neutral-cool-600">
          연락처 {instructor.phone.trim()}
        </PFText>
      ) : null}
      {instructor.email?.trim() ? (
        <PFText as="p" typo="bd-sm-rg" color="neutral-cool-600">
          이메일 {instructor.email.trim()}
        </PFText>
      ) : null}

      {siteMessage ? (
        <SiteSubmissionMessage message={siteMessage} />
      ) : showConsentDocuments ? (
        <ConsentList
          applicationId={applicationId}
          applicationType={applicationType}
          instructor={instructor}
          onRefresh={onRefresh}
        />
      ) : null}
    </div>
  )
}
