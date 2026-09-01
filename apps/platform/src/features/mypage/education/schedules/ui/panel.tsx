import { useMemo, useState } from 'react'
import { filterItemsUpToLastParticipatedSession } from '../../applications/lib/display-status'
import { EDUCATION_SCHEDULE_PAGE_SIZE, type EducationScheduleItem } from '../model/types'
import { getMockEducationSchedules } from '../lib/mock-schedules'
import { EducationScheduleRow } from './row'
import { PFPagination, PFText } from '@/shared/ui'
import styles from './panel.module.css'

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

  if (totalElements === 0) {
    return (
      <PFText as="p" typo="bd-md-rg" color="neutral-cool-600" className={styles.empty}>
        등록된 교육일정이 없어요.
      </PFText>
    )
  }

  return (
    <div className={styles.shell}>
      <div className={styles.header}>
        <PFText as="h2" typo="hl-sm" color="black" className={styles.count}>
          {`${listTitle} `}
        </PFText>
        <PFText as="p" typo="bd-md-rg" color="neutral-cool-600" className={styles.count}>
          {totalElements}건
        </PFText>
      </div>

      <div className={styles.list}>
        {pageItems.map((item: EducationScheduleItem) => (
          <EducationScheduleRow key={item.id} item={item} />
        ))}
      </div>

      {totalPages > 1 ? (
        <div className={styles.pagination}>
          <PFPagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setPage}
            ariaLabel={`${listTitle} 페이지`}
          />
        </div>
      ) : null}
    </div>
  )
}
