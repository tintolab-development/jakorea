import { useMemo, useState } from 'react'
import { filterItemsUpToLastParticipatedSession } from '../../applications/lib/display-status'
import { EducationSessionList } from '../../shared'
import { EDUCATION_SETTLEMENT_PAGE_SIZE } from '../model/types'
import { getMockEducationSettlements } from '../lib/mock-settlements'
import {
  countCompletedSettlementSessions,
  resolvePaymentStatementProcessLabel,
} from '../lib/settlement-rules'
import { EducationSettlementRow } from './row'
import { EducationSettlementSummary } from './summary'
import styles from './panel.module.css'

type EducationSettlementPanelProps = {
  programId: string
  applicationId: string
  lastParticipatedSession?: number
}

export function EducationSettlementPanel({
  programId,
  applicationId,
  lastParticipatedSession,
}: EducationSettlementPanelProps) {
  const [page, setPage] = useState(1)

  const allItems = useMemo(() => {
    const items = getMockEducationSettlements(programId)
    return filterItemsUpToLastParticipatedSession(items, lastParticipatedSession)
  }, [programId, lastParticipatedSession])

  const totalElements = allItems.length
  const totalPages = Math.max(1, Math.ceil(totalElements / EDUCATION_SETTLEMENT_PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const completedCount = countCompletedSettlementSessions(allItems)
  const processLabel = resolvePaymentStatementProcessLabel(allItems)

  const pageItems = useMemo(() => {
    const start = (currentPage - 1) * EDUCATION_SETTLEMENT_PAGE_SIZE
    return allItems.slice(start, start + EDUCATION_SETTLEMENT_PAGE_SIZE)
  }, [allItems, currentPage])

  return (
    <div className={styles.shell}>
      <EducationSettlementSummary
        processLabel={processLabel}
        completedCount={completedCount}
        totalCount={totalElements}
      />
      <EducationSessionList
        title="정산 현황"
        totalCount={totalElements}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setPage}
        emptyMessage="정산 현황이 없어요."
      >
        {pageItems.map(item => (
          <EducationSettlementRow key={item.id} item={item} applicationId={applicationId} />
        ))}
      </EducationSessionList>
    </div>
  )
}
