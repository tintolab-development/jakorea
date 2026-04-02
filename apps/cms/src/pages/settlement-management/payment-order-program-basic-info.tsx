/**
 * 지급 현황 상세 — 프로그램 기본 정보 블록
 */

import type {
  PaymentOrderAdminProcessingStatus,
  PaymentOrderAdminProgramDetail,
} from '@/data/mock/payment-order-admin-list'
import { formatKoreanDateWithWeekday } from './payment-order-detail-fullpage-shared'
import { renderAggregateStatus } from './payment-order-detail-aggregate-status'

export interface PaymentOrderProgramBasicInfoProps {
  detail: PaymentOrderAdminProgramDetail
  aggregateStatus: PaymentOrderAdminProcessingStatus
}

export function PaymentOrderProgramBasicInfo({
  detail,
  aggregateStatus,
}: PaymentOrderProgramBasicInfoProps) {
  const businessPeriodLabel = `${formatKoreanDateWithWeekday(detail.businessPeriodStart)} ~ ${formatKoreanDateWithWeekday(detail.businessPeriodEnd)}`
  const sessionLabel = `${detail.sessionCompleted} / ${detail.sessionTotal}`

  return (
    <div className="payment-order-program-status-detail__basic-block program-detail-fullpage-modal__info-tab-block">
      <h3 className="program-detail-info-tab__section-title">기본 정보</h3>
      <div className="program-detail-info-tab__table-wrapper program-detail-info-tab__table-wrapper--top">
        <table className="program-detail-info-tab__table program-detail-info-tab__table--basic">
          <colgroup>
            <col style={{ width: '200px' }} />
            <col />
            <col style={{ width: '200px' }} />
            <col />
          </colgroup>
          <tbody>
            <tr>
              <th>프로그램명</th>
              <td>{detail.programName}</td>
              <th>사업 운영 기간</th>
              <td>{businessPeriodLabel}</td>
            </tr>
            <tr>
              <th>프로그램 진행 회차</th>
              <td>{sessionLabel}</td>
              <th>지급 조서 처리 현황</th>
              <td>{renderAggregateStatus(aggregateStatus)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
