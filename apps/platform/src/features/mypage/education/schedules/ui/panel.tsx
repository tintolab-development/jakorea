import { useMemo, useState } from 'react'
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
}

export function EducationSchedulePanel({
  programId,
  lastParticipatedSession,
  listTitle = '교육일정',
}: EducationSchedulePanelProps) {
  const [page, setPage] = useState(1)

  const allItems = useMemo(() => {
    const items = getMockEducationSchedules(programId)
    return filterItemsUpToLastParticipatedSession(items, lastParticipatedSession)
  }, [programId, lastParticipatedSession])

  const totalElements = allItems.length
  const totalPages = Math.max(1, Math.ceil(totalElements / EDUCATION_SCHEDULE_PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)

  const pageItems = useMemo(() => {
    const start = (currentPage - 1) * EDUCATION_SCHEDULE_PAGE_SIZE
    return allItems.slice(start, start + EDUCATION_SCHEDULE_PAGE_SIZE)
  }, [allItems, currentPage])

  return (
    <EducationSessionList
      title={listTitle}
      totalCount={totalElements}
      currentPage={currentPage}
      totalPages={totalPages}
      onPageChange={setPage}
      emptyMessage="등록된 교육일정이 없어요."
    >
      {pageItems.map((item: EducationScheduleItem) => (
        <EducationScheduleRow key={item.id} item={item} />
      ))}
    </EducationSessionList>
  )
}
