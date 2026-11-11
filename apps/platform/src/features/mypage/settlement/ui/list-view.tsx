import { PFEmptyState, PFText } from '@/shared/ui'
import { formatSettlementHeldAt } from '../lib/format-held-at'
import { withListNumbers } from '../lib/filter-items'
import { formatMonthHeading } from '../lib/date-keys'
import { SETTLEMENT_STATUS_LIST_COLOR, SETTLEMENT_STATUS_LIST_LABEL } from '../lib/status-presentation'
import type { SettlementOverviewItem } from '../model/types'
import styles from './list-view.module.css'

type SettlementListViewProps = {
  month: string
  items: SettlementOverviewItem[]
}

function formatEducationDateCell(item: SettlementOverviewItem) {
  const heldAt = formatSettlementHeldAt(item.startsAt, item.endsAt)
  const session = item.sessionLabel.trim()
  if (!session) return heldAt
  return `${heldAt} | ${session}`
}

export function SettlementListView({ month, items }: SettlementListViewProps) {
  const numbered = withListNumbers(items)

  return (
    <section className={styles.section} aria-label="월별 정산 현황 목록">
      <PFText as="h2" typo="hd-sm" color="black" className={styles.heading}>
        {formatMonthHeading(month, numbered.length)}
      </PFText>

      {numbered.length === 0 ? (
        <PFEmptyState
          title="해당하는 정산 내역이 없어요"
          description="정산 건이 생기면 이곳에서 확인할 수 있어요."
        />
      ) : (
        <div className={styles.scroller}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope="col" className={styles.colNo}>
                  No.
                </th>
                <th scope="col" className={styles.colProgram}>
                  프로그램명
                </th>
                <th scope="col" className={styles.colOrg}>
                  참여 기관명
                </th>
                <th scope="col" className={styles.colDate}>
                  교육 진행 일자
                </th>
                <th scope="col" className={styles.colStatus}>
                  정산 현황
                </th>
              </tr>
            </thead>
            <tbody>
              {numbered.map(({ item, no }) => (
                <tr key={item.id}>
                  <td className={styles.colNo}>{no}</td>
                  <td className={styles.colProgram}>
                    <span className={styles.ellipsis} title={item.programName}>
                      {item.programName}
                    </span>
                  </td>
                  <td className={styles.colOrg}>{item.organizationName || '-'}</td>
                  <td className={styles.colDate}>{formatEducationDateCell(item)}</td>
                  {/* 대체된 이전 신청: 원래 결과를 구분할 서버 필드가 없어 상태 라벨을 비운다 */}
                  <td
                    className={styles.colStatus}
                    style={
                      item.superseded ? undefined : { color: SETTLEMENT_STATUS_LIST_COLOR[item.status] }
                    }
                  >
                    {item.superseded ? '-' : SETTLEMENT_STATUS_LIST_LABEL[item.status]}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
