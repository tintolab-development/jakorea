import { useMemo, useState } from 'react'
import type { EducationScheduleAssignment } from '../model/types'
import { resolveEducationAssignmentGuide } from '../lib/schedule-rules'
import clipDarkMintUrl from '@/shared/assets/icons/clip-dark-mint.svg'
import portalBlackUrl from '@/shared/assets/icons/portal-black.svg'
import closeDarkMintUrl from '@/shared/assets/icons/close-dark-mint.svg'
import closeBlackUrl from '@/shared/assets/icons/close-black.svg'
import { EducationSessionGuideBlock } from '../../shared'
import { PFAlertModal, PFButton, PFText } from '@/shared/ui'
import { usePortalFormResponseFeedbackQuery } from '../api/use-portal-form-response-feedback-query'
import styles from './assignment-block.module.css'

type EducationScheduleAssignmentBlockProps = {
  assignment: EducationScheduleAssignment
}

export function EducationScheduleAssignmentBlock({
  assignment,
}: EducationScheduleAssignmentBlockProps) {
  const [comingSoonOpen, setComingSoonOpen] = useState(false)
  const [feedbackOpen, setFeedbackOpen] = useState(false)

  const feedbackQuery = usePortalFormResponseFeedbackQuery({
    formResponseId: assignment.formResponseId,
    enabled: feedbackOpen,
  })

  const guide = resolveEducationAssignmentGuide(assignment.status, assignment.submitEndAt)
  const deadlineOpen = new Date().getTime() <= new Date(assignment.submitEndAt).getTime()
  const showFileRemove =
    (assignment.status === 'submitted' || assignment.status === 'feedback') && deadlineOpen
  const isSubmitted =
    assignment.status === 'submitted' || assignment.status === 'revision_submitted'
  const files = assignment.files ?? []
  const hasFiles = files.length > 0
  const showSubmittedDivider = isSubmitted && hasFiles

  const remoteFeedbackText = useMemo(() => {
    const items = feedbackQuery.data?.feedbacks ?? []
    if (items.length === 0) return null
    return items.map(item => item.content).join('\n\n')
  }, [feedbackQuery.data?.feedbacks])

  const feedbackBody =
    remoteFeedbackText?.trim() ||
    assignment.feedback?.trim() ||
    (feedbackQuery.isFetching ? '피드백을 불러오는 중입니다…' : '등록된 피드백이 없습니다.')

  return (
    <>
      <EducationSessionGuideBlock
        variant={isSubmitted ? 'submitted' : 'default'}
        statusLabel={guide.statusLabel}
        statusTone={guide.statusTone}
        message={guide.message}
        description={assignment.periodLabel}
        actions={
          <div className={styles.actions}>
            {guide.showFeedbackButton ? (
              <PFButton
                type="button"
                variant="tertiary"
                size="large"
                onClick={() => setFeedbackOpen(true)}
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
        }
      >
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
      </EducationSessionGuideBlock>
      <PFAlertModal
        open={comingSoonOpen}
        title="준비 중"
        onConfirm={() => setComingSoonOpen(false)}
      />
      <PFAlertModal
        open={feedbackOpen}
        title="피드백 확인"
        description={feedbackBody}
        onConfirm={() => setFeedbackOpen(false)}
      />
    </>
  )
}
