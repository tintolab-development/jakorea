import { useMemo, useState } from 'react'
import { EducationSessionListSkeleton } from '@/features/mypage/shared/ui'
import { PFText } from '@/shared/ui'
import { useApplicationSchedulesQuery } from '../../applications/api/activity-hooks'
import type { ProgramApplicationType } from '../../applications/api/types'
import { filterItemsUpToLastParticipatedSession } from '../../applications/lib/display-status'
import { EducationSessionList } from '../../shared'
import { EDUCATION_SCHEDULE_PAGE_SIZE, type EducationScheduleItem } from '../model/types'
import { getMockEducationSchedules } from '../lib/mock-schedules'
import { EducationScheduleRow } from './row'

type EducationSchedulePanelProps = {
  programId: string
  /** 활동 포기(진행 중) 시 마지막 참여 회차 — 이후 일정 비노출 */
  lastParticipatedSession?: number
  /** 탭 타이틀 (교육일정 / 배정현황 / …) */
  listTitle?: string
  applicationType?: ProgramApplicationType | null
  applicationId?: string | null
}

export function EducationSchedulePanel({
  programId,
  lastParticipatedSession,
  listTitle = '교육일정',
  applicationType,
  applicationId,
}: EducationSchedulePanelProps) {
  const [page, setPage] = useState(1)
  const remoteSchedules = useApplicationSchedulesQuery(applicationType, applicationId)

  const allItems = useMemo(() => {
    const items = remoteSchedules.enabled ? remoteSchedules.items : getMockEducationSchedules(programId)
    return filterItemsUpToLastParticipatedSession(items, lastParticipatedSession)
  }, [lastParticipatedSession, programId, remoteSchedules.enabled, remoteSchedules.items])

  const totalElements = allItems.length
  const totalPages = Math.max(1, Math.ceil(totalElements / EDUCATION_SCHEDULE_PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)

  const pageItems = useMemo(() => {
    const start = (currentPage - 1) * EDUCATION_SCHEDULE_PAGE_SIZE
    return allItems.slice(start, start + EDUCATION_SCHEDULE_PAGE_SIZE)
  }, [allItems, currentPage])

  if (remoteSchedules.isLoading) {
    return <EducationSessionListSkeleton statusMessage={`${listTitle}을 불러오는 중입니다.`} />
  }
  if (remoteSchedules.isError) {
    return (
      <PFText as="p" typo="bd-md-rg" color="neutral-cool-600">
        {listTitle}을 불러오지 못했습니다.
      </PFText>
    )
  }

  return (
    <EducationSessionList
      title={listTitle}
      totalCount={totalElements}
      currentPage={currentPage}
      totalPages={totalPages}
      onPageChange={setPage}
      emptyMessage={
        listTitle === '배정현황' ? '등록된 배정 일정이 없어요.' : '등록된 교육일정이 없어요.'
      }
    >
      {pageItems.map((item: EducationScheduleItem) => (
        <EducationScheduleRow key={item.id} item={item} />
      ))}
    </EducationSessionList>
  )
}
