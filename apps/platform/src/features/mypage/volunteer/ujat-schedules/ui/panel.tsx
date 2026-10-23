import { useMemo, useState } from 'react'
import { EducationSessionListSkeleton } from '@/features/mypage/shared/ui'
import {
  DEFAULT_PROGRAM_APPLICATION_REQUEST_ERROR_MESSAGE,
  getProgramApplicationApiErrorMessage,
} from '@/features/program/lib/application-api-error'
import { PFAlertModal, PFButton, PFLoadingSpinner, PFText } from '@/shared/ui'
import { useApplicationSchedulesQuery } from '@/features/mypage/education/applications/api/activity-hooks'
import type { ProgramApplicationType } from '@/features/mypage/education/applications/api/types'
import { EducationSessionList } from '@/features/mypage/education/shared'
import type { EducationScheduleItem } from '@/features/mypage/education/schedules/model/types'
import { usePortalFormResponseFeedbackQuery } from '@/features/mypage/education/schedules/api/use-portal-form-response-feedback-query'
import {
  canViewUjatScheduleAttendance,
  groupUjatVolunteerSchedulesByMonth,
  isUjatVolunteerOwnScheduleRecord,
} from '../lib/history'
import { useUjatEducationDocumentsQuery } from '../api/education-documents-hooks'
import {
  indexUjatEducationDocumentsByScheduleId,
  ujatEducationDocumentSetupMessage,
  type UjatEducationDayDocuments,
  type UjatEducationDocumentKind,
} from '../lib/documents'
import { UjatAttendanceDetailModal } from './attendance-detail-modal'
import { UjatEducationDocumentFillModal } from './document-fill-modal'
import type { UjatDocumentFillMode } from './document-slot'
import { UjatVolunteerScheduleRow } from './schedule-row'
import styles from './panel.module.css'

type UjatVolunteerSchedulePanelProps = {
  applicationType?: ProgramApplicationType | null
  applicationId?: string | null
  listTitle?: string
  readOnly?: boolean
}

export function UjatVolunteerSchedulePanel({
  applicationType,
  applicationId,
  listTitle = '배정 및 출결 현황',
  readOnly = false,
}: UjatVolunteerSchedulePanelProps) {
  const [attendanceSchedule, setAttendanceSchedule] = useState<EducationScheduleItem | null>(null)
  const [fillTarget, setFillTarget] = useState<{
    kind: UjatEducationDocumentKind
    mode: UjatDocumentFillMode
    documents: UjatEducationDayDocuments
  } | null>(null)
  const [feedbackTarget, setFeedbackTarget] = useState<{
    kind: UjatEducationDocumentKind
    formResponseId: number
  } | null>(null)
  const remoteSchedules = useApplicationSchedulesQuery(applicationType, applicationId)
  const documentsQuery = useUjatEducationDocumentsQuery(applicationType, applicationId)
  const feedbackQuery = usePortalFormResponseFeedbackQuery({
    formResponseId: feedbackTarget?.formResponseId,
    enabled: feedbackTarget != null,
  })

  const ownItems = useMemo(
    () =>
      remoteSchedules.items.filter(item =>
        isUjatVolunteerOwnScheduleRecord(item, {
          includeAssignedWithoutAttendance: !readOnly,
        }),
      ),
    [readOnly, remoteSchedules.items],
  )
  const documentsByScheduleId = useMemo(
    () => indexUjatEducationDocumentsByScheduleId(documentsQuery.data?.items ?? []),
    [documentsQuery.data?.items],
  )
  const extraDocumentDays = useMemo(() => {
    const known = new Set(
      ownItems
        .map(item => item.scheduleId)
        .filter((id): id is number => typeof id === 'number' && id > 0),
    )
    return (documentsQuery.data?.items ?? []).filter(item => !known.has(item.scheduleId))
  }, [documentsQuery.data?.items, ownItems])
  const monthGroups = useMemo(() => {
    const extraRows: EducationScheduleItem[] = extraDocumentDays.map(day => ({
      id: `document-${day.scheduleId}`,
      scheduleId: day.scheduleId,
      sessionNumber: 0,
      heldAt: day.educationDate ?? '',
      title: '교육일',
      attendanceStatus: null,
      classLabel: day.classLabel ?? undefined,
      assignmentStatus: day.assignmentStatus,
    }))
    return groupUjatVolunteerSchedulesByMonth([...ownItems, ...extraRows])
  }, [extraDocumentDays, ownItems])
  const fillSlot =
    fillTarget == null
      ? null
      : fillTarget.kind === 'JOURNAL'
        ? fillTarget.documents.journal
        : fillTarget.documents.plan
  const feedbackBody = useMemo(() => {
    const items = feedbackQuery.data?.feedbacks ?? []
    if (items.length === 0) {
      return feedbackQuery.isFetching ? null : '등록된 피드백이 없습니다.'
    }
    return items.map(item => item.content).join('\n\n')
  }, [feedbackQuery.data?.feedbacks, feedbackQuery.isFetching])

  if (remoteSchedules.isLoading) {
    return <EducationSessionListSkeleton statusMessage={`${listTitle}을 불러오는 중입니다.`} />
  }
  if (remoteSchedules.isError) {
    const errorMessage =
      remoteSchedules.errorCode === 'DATABASE_ERROR'
        ? DEFAULT_PROGRAM_APPLICATION_REQUEST_ERROR_MESSAGE
        : `${listTitle}을 불러오지 못했습니다.`
    return (
      <div className={styles.status}>
        <PFText as="p" typo="bd-md-rg" color="neutral-cool-600">
          {errorMessage}
        </PFText>
        {remoteSchedules.traceId ? (
          <PFText as="p" typo="bd-sm-rg" color="neutral-cool-500">
            traceId: {remoteSchedules.traceId}
          </PFText>
        ) : null}
        <PFButton
          type="button"
          variant="tertiary"
          size="large"
          disabled={remoteSchedules.isRefetching}
          onClick={() => void remoteSchedules.refetch()}
        >
          다시 시도
        </PFButton>
      </div>
    )
  }

  const planSetup = documentsQuery.data?.planSetup ?? null
  const journalSetup = documentsQuery.data?.journalSetup ?? null

  return (
    <>
      {documentsQuery.isError ? (
        <div className={styles.status}>
          <PFText as="p" typo="bd-md-rg" color="neutral-cool-600">
            {getProgramApplicationApiErrorMessage(
              documentsQuery.error,
              '교육계획서·교육일지를 불러오지 못했습니다.',
            )}
          </PFText>
          <PFButton
            type="button"
            variant="tertiary"
            size="large"
            disabled={documentsQuery.isRefetching}
            onClick={() => void documentsQuery.refetch()}
          >
            다시 시도
          </PFButton>
        </div>
      ) : null}
      {documentsQuery.data && !documentsQuery.isError ? (
        <div className={styles.setup}>
          {planSetup?.unavailableReason ? (
            <PFText as="p" typo="bd-md-rg" color="neutral-cool-600">
              {ujatEducationDocumentSetupMessage('PLAN', planSetup.unavailableReason)}
            </PFText>
          ) : null}
          {journalSetup?.unavailableReason ? (
            <PFText as="p" typo="bd-md-rg" color="neutral-cool-600">
              {ujatEducationDocumentSetupMessage('JOURNAL', journalSetup.unavailableReason)}
            </PFText>
          ) : null}
        </div>
      ) : null}
      <EducationSessionList
        title={listTitle}
        totalCount={ownItems.length + extraDocumentDays.length}
        currentPage={1}
        totalPages={1}
        onPageChange={() => undefined}
        emptyMessage="조회할 배정·출결 이력이 없어요."
      >
        {monthGroups.map(group => (
          <section key={group.monthKey} className={styles.month}>
            <PFText as="h3" typo="bd-md-md" color="neutral-cool-600" className={styles.monthLabel}>
              {group.monthLabel}
            </PFText>
            <div className={styles.monthList}>
              {group.items.map(item => {
                const scheduleId = item.scheduleId
                const documents =
                  typeof scheduleId === 'number' ? (documentsByScheduleId.get(scheduleId) ?? null) : null
                return (
                  <UjatVolunteerScheduleRow
                    key={item.id}
                    item={item}
                    canViewAttendance={canViewUjatScheduleAttendance(item)}
                    onViewAttendance={
                      canViewUjatScheduleAttendance(item)
                        ? selected => setAttendanceSchedule(selected)
                        : undefined
                    }
                    documents={documentsQuery.isError ? null : documents}
                    planSetup={planSetup}
                    journalSetup={journalSetup}
                    onFillDocument={(kind, mode, dayDocuments) =>
                      setFillTarget({ kind, mode, documents: dayDocuments })
                    }
                    onViewDocumentFeedback={(kind, dayDocuments) => {
                      const slot = kind === 'JOURNAL' ? dayDocuments.journal : dayDocuments.plan
                      if (slot.formResponseId == null) return
                      setFeedbackTarget({ kind, formResponseId: slot.formResponseId })
                    }}
                  />
                )
              })}
            </div>
          </section>
        ))}
      </EducationSessionList>
      <UjatAttendanceDetailModal
        open={attendanceSchedule != null}
        applicationType={applicationType}
        applicationId={applicationId}
        scheduleId={attendanceSchedule?.scheduleId ?? null}
        canViewAttendance={
          attendanceSchedule != null && canViewUjatScheduleAttendance(attendanceSchedule)
        }
        onClose={() => setAttendanceSchedule(null)}
      />
      <UjatEducationDocumentFillModal
        open={fillTarget != null}
        mode={fillTarget?.mode ?? null}
        kind={fillTarget?.kind ?? null}
        slot={fillSlot}
        programId={documentsQuery.data?.programId ?? null}
        scheduleId={fillTarget?.documents.scheduleId ?? null}
        applicationType={applicationType}
        applicationId={applicationId}
        onClose={() => setFillTarget(null)}
      />
      <PFAlertModal
        open={feedbackTarget != null}
        title="피드백 확인"
        description={
          feedbackQuery.isFetching ? (
            <PFLoadingSpinner label="피드백을 불러오는 중" />
          ) : (
            feedbackBody ?? '등록된 피드백이 없습니다.'
          )
        }
        onConfirm={() => setFeedbackTarget(null)}
      />
    </>
  )
}
