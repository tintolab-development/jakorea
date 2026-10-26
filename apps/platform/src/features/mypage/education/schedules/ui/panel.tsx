import { useMemo, useState } from 'react'
import { EducationSessionListSkeleton } from '@/features/mypage/shared/ui'
import { DEFAULT_PROGRAM_APPLICATION_REQUEST_ERROR_MESSAGE } from '@/features/program/lib/application-api-error'
import { PFButton, PFText } from '@/shared/ui'
import {
  canSubmitEducationAbsenceReason,
  resolveEducationScheduleProgressStatus,
} from '../lib/schedule-rules'
import { resolveEducationScheduleEmptyMessage } from '../lib/scope-status'
import { useApplicationSchedulesQuery } from '../../applications/api/activity-hooks'
import type { ProgramApplicationType } from '../../applications/api/types'
import { filterItemsUpToLastParticipatedSession } from '../../applications/lib/display-status'
import { EducationSessionList } from '../../shared'
import { EDUCATION_SCHEDULE_PAGE_SIZE, type EducationScheduleItem } from '../model/types'
import { EducationScheduleRow } from './row'
import { EducationAbsenceReasonModal } from './absence-reason-modal'
import styles from './panel.module.css'

type EducationSchedulePanelProps = {
  /** 활동 포기(진행 중) 시 마지막 참여 회차 — 이후 일정 비노출 */
  lastParticipatedSession?: number
  /** 탭 타이틀 (교육일정 / 배정현황 / …) */
  listTitle?: string
  applicationType?: ProgramApplicationType | null
  applicationId?: string | null
  /** 결석 사유 제출 버튼·모달·사유 텍스트 노출 (교육받은 교사 신청 건은 false) */
  absenceReasonEnabled?: boolean
}

/**
 * 교육일정 탭 — remote면 신청 GET .../schedules만 SSOT.
 * mock 로그인 세션에서만 mock 시드. 프로그램 상세 일정은 사용하지 않는다.
 */
export function EducationSchedulePanel({
  lastParticipatedSession,
  listTitle = '교육일정',
  applicationType,
  applicationId,
  absenceReasonEnabled = true,
}: EducationSchedulePanelProps) {
  const [page, setPage] = useState(1)
  const [absenceReasonScheduleId, setAbsenceReasonScheduleId] = useState<number | null>(null)
  const [absenceReasonOpenKey, setAbsenceReasonOpenKey] = useState(0)
  const remoteSchedules = useApplicationSchedulesQuery(applicationType, applicationId)
  // 과제는 참여자(개인·기관) 대상. 강사는 강의보고서만 제출한다.
  const assignmentVisible = applicationType !== 'INSTRUCTOR'

  const allItems = useMemo(() => {
    const items: EducationScheduleItem[] = remoteSchedules.enabled ? remoteSchedules.items : []
    return filterItemsUpToLastParticipatedSession(items, lastParticipatedSession)
  }, [lastParticipatedSession, remoteSchedules.enabled, remoteSchedules.items])

  const totalElements = allItems.length
  const totalPages = Math.max(1, Math.ceil(totalElements / EDUCATION_SCHEDULE_PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)

  const pageItems = useMemo(() => {
    const start = (currentPage - 1) * EDUCATION_SCHEDULE_PAGE_SIZE
    return allItems.slice(start, start + EDUCATION_SCHEDULE_PAGE_SIZE)
  }, [allItems, currentPage])

  const absenceReasonItems = useMemo(
    () =>
      allItems.filter(
        item =>
          item.scheduleId != null &&
          canSubmitEducationAbsenceReason(
            resolveEducationScheduleProgressStatus(item.heldAt),
            item.attendanceStatus,
            item.availableActions
          )
      ),
    [allItems]
  )

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

  const emptyMessage = remoteSchedules.enabled
    ? resolveEducationScheduleEmptyMessage(remoteSchedules.scopeStatus, listTitle)
    : listTitle === '배정현황'
      ? '등록된 배정 일정이 없어요'
      : '등록된 교육일정이 없어요'

  return (
    <>
      <EducationSessionList
        title={listTitle}
        totalCount={totalElements}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setPage}
        emptyMessage={emptyMessage}
        emptyDescription={
          listTitle === '배정현황'
            ? '배정된 일정이 생기면 이곳에서 확인할 수 있어요.'
            : '교육 일정이 생기면 이곳에서 확인할 수 있어요.'
        }
        alwaysShowPagination
      >
        {pageItems.map((item: EducationScheduleItem) => (
          <EducationScheduleRow
            key={item.id}
            item={item}
            applicationType={applicationType}
            applicationId={applicationId}
            showAssignment={assignmentVisible}
            showAbsenceReason={absenceReasonEnabled}
            onAbsenceReasonSubmit={
              absenceReasonEnabled
                ? selectedItem => {
                    setAbsenceReasonScheduleId(selectedItem.scheduleId ?? null)
                    setAbsenceReasonOpenKey(key => key + 1)
                  }
                : undefined
            }
          />
        ))}
      </EducationSessionList>
      {absenceReasonEnabled ? (
        <EducationAbsenceReasonModal
          key={absenceReasonOpenKey}
          open={absenceReasonScheduleId !== null}
          items={absenceReasonItems}
          initialScheduleId={absenceReasonScheduleId}
          applicationType={applicationType}
          applicationId={applicationId}
          onClose={() => setAbsenceReasonScheduleId(null)}
        />
      ) : null}
    </>
  )
}
