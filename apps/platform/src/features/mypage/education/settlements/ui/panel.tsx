import { useMemo, useState } from 'react'
import { EducationSessionListSkeleton } from '@/features/mypage/shared/ui'
import { PFText } from '@/shared/ui'
import { useApplicationSettlementsQuery } from '../../applications/api/activity-hooks'
import type { ProgramApplicationType } from '../../applications/api/types'
import { filterItemsUpToLastParticipatedSession } from '../../applications/lib/display-status'
import { EducationSessionList } from '../../shared'
import { EDUCATION_SETTLEMENT_PAGE_SIZE } from '../model/types'
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
  applicationType?: ProgramApplicationType | null
  lastParticipatedSession?: number
}

export function EducationSettlementPanel({
  programId,
  applicationId,
  applicationType,
  lastParticipatedSession,
}: EducationSettlementPanelProps) {
  const [page, setPage] = useState(1)
  const remoteSettlements = useApplicationSettlementsQuery(applicationType, applicationId, programId)

  const allItems = useMemo(() => {
    const items = remoteSettlements.enabled ? remoteSettlements.items : []
    return filterItemsUpToLastParticipatedSession(items, lastParticipatedSession)
  }, [lastParticipatedSession, programId, remoteSettlements.enabled, remoteSettlements.items])

  const totalElements = allItems.length
  const totalPages = Math.max(1, Math.ceil(totalElements / EDUCATION_SETTLEMENT_PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const completedCount = countCompletedSettlementSessions(allItems)
  const processLabel = resolvePaymentStatementProcessLabel(allItems)

  const pageItems = useMemo(() => {
    const start = (currentPage - 1) * EDUCATION_SETTLEMENT_PAGE_SIZE
    return allItems.slice(start, start + EDUCATION_SETTLEMENT_PAGE_SIZE)
  }, [allItems, currentPage])

  if (remoteSettlements.isLoading) {
    return <EducationSessionListSkeleton statusMessage="정산현황을 불러오는 중입니다." />
  }
  if (remoteSettlements.isError) {
    return (
      <PFText as="p" typo="bd-md-rg" color="neutral-cool-600">
        정산현황을 불러오지 못했습니다.
      </PFText>
    )
  }

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
