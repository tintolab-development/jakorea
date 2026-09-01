import { useState } from 'react'
import type { EducationScheduleAssignment } from '../model/types'
import { resolveEducationAssignmentGuide } from '../lib/schedule-rules'
import clipDarkMintUrl from '@/shared/assets/icons/clip-dark-mint.svg'
import portalBlackUrl from '@/shared/assets/icons/portal-black.svg'
import closeDarkMintUrl from '@/shared/assets/icons/close-dark-mint.svg'
import closeBlackUrl from '@/shared/assets/icons/close-black.svg'
import { PFAlertModal, PFButton, PFText } from '@/shared/ui'
import styles from './assignment-block.module.css'

type EducationScheduleAssignmentBlockProps = {
  assignment: EducationScheduleAssignment
}

export function EducationScheduleAssignmentBlock({
  assignment,
}: EducationScheduleAssignmentBlockProps) {
  const [comingSoonOpen, setComingSoonOpen] = useState(false)
  const guide = resolveEducationAssignmentGuide(assignment.status, assignment.submitEndAt)
  const deadlineOpen = new Date().getTime() <= new Date(assignment.submitEndAt).getTime()
  const showFileRemove =
    (assignment.status === 'submitted' || assignment.status === 'feedback') && deadlineOpen
  const isSubmitted =
    assignment.status === 'submitted' || assignment.status === 'revision_submitted'
  const files = assignment.files ?? []
  const hasFiles = files.length > 0
  const showSubmittedDivider = isSubmitted && hasFiles

  return (
    <>
      <div
        className={[styles.block, isSubmitted ? styles.blockSubmitted : undefined]
          .filter(Boolean)
          .join(' ')}
      >
        <div className={styles.top}>
          <div className={styles.main}>
            <p
              className={[
                styles.messageRow,
                guide.tone === 'feedback' ? styles.messageFeedback : undefined,
              ]
                .filter(Boolean)
                .join(' ')}
            >
              {guide.statusLabel ? (
                <PFText
                  as="span"
                  typo="hl-sm"
                  color={guide.statusTone === 'submitted' ? 'primary-700' : 'neutral-cool-500'}
                  className={styles.statusLabel}
                >
                  {guide.statusLabel}
                </PFText>
              ) : null}
              <PFText
                as="span"
                typo="hl-sm"
                color="black"
                className={styles.message}
              >
                {guide.message}
              </PFText>
            </p>
            <PFText as="p" typo="bd-md-rg" color="neutral-cool-600" className={styles.period}>
              {assignment.periodLabel}
            </PFText>
          </div>
          <div className={styles.actions}>
            {guide.showFeedbackButton ? (
              <PFButton
                type="button"
                variant="tertiary"
                size="large"
                onClick={() => setComingSoonOpen(true)}
              >
                피드백 확인
              </PFButton>
            ) : null}
            <PFButton
              type="button"
              variant="primary"
              size="large"
              disabled={guide.submitDisabled}
              onClick={() => setComingSoonOpen(true)}
            >
              {guide.submitLabel}
            </PFButton>
          </div>
        </div>

        {showSubmittedDivider ? <div className={styles.divider} aria-hidden="true" /> : null}

        {hasFiles ? (
          <ul className={styles.files}>
            {files.map(file => {
              const isUrl = file.kind === 'url'
              return (
                <li
                  key={file.id}
                  className={[styles.chip, isUrl ? styles.chipUrl : styles.chipFile].join(' ')}
                >
                  <img
                    className={styles.chipIcon}
                    src={isUrl ? portalBlackUrl : clipDarkMintUrl}
                    alt=""
                    width={20}
                    height={20}
                    aria-hidden="true"
                  />
                  <PFText
                    as="span"
                    typo="bd-sm-sb"
                    color={isUrl ? 'black' : 'primary-700'}
                    className={styles.chipLabel}
                  >
                    {file.fileName}
                  </PFText>
                  {showFileRemove ? (
                    <button
                      type="button"
                      className={styles.chipRemove}
                      aria-label={`${file.fileName} 삭제`}
                      onClick={() => setComingSoonOpen(true)}
                    >
                      <img
                        src={isUrl ? closeBlackUrl : closeDarkMintUrl}
                        alt=""
                        width={20}
                        height={20}
                        aria-hidden="true"
                      />
                    </button>
                  ) : null}
                </li>
              )
            })}
          </ul>
        ) : null}
      </div>
      <PFAlertModal
        open={comingSoonOpen}
        title="준비 중"
        onConfirm={() => setComingSoonOpen(false)}
      />
    </>
  )
}
