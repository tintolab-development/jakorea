/**
 * 지급 현황 상세 — 프로그램 기본 정보 블록 (DetailInfoForm)
 * 라벨 폭·행 높이는 강사 기본 정보(`payment-order-instructor-basic-info`)와 같은 detail-form 클래스를 쓴다.
 */

import type { PaymentOrderAdminProgramDetail } from '@/features/settlement-management/model/payment-order-admin-list'
import type { PaymentOrderDetailAggregateStatus } from '@/shared/constants/payment-order-aggregate-status'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { formatKoreanDateWithWeekday } from './payment-order-detail-fullpage-shared'
import { renderAggregateStatus } from './payment-order-detail-aggregate-status'

export interface PaymentOrderProgramBasicInfoProps {
  detail: PaymentOrderAdminProgramDetail
  aggregateStatus: PaymentOrderDetailAggregateStatus
}

export function PaymentOrderProgramBasicInfo({
  detail,
  aggregateStatus,
}: PaymentOrderProgramBasicInfoProps) {
  const businessPeriodLabel = `${formatKoreanDateWithWeekday(detail.businessPeriodStart)} ~ ${formatKoreanDateWithWeekday(detail.businessPeriodEnd)}`
  const sessionLabel = `${detail.sessionCompleted} / ${detail.sessionTotal}`

  return (
    <div className="payment-order-program-status-detail__basic-block program-detail-fullpage-modal__info-tab-block">
      <DetailInfoForm
        title="기본 정보"
        className="payment-order-instructor-status-detail__detail-form"
      >
        <DetailInfoForm.Row type="double">
          <DetailInfoForm.Field label="프로그램명" view={<span>{detail.programName}</span>} />
          <DetailInfoForm.Field label="사업 운영 기간" view={<span>{businessPeriodLabel}</span>} />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="double">
          <DetailInfoForm.Field label="프로그램 진행 회차" view={<span>{sessionLabel}</span>} />
          <DetailInfoForm.Field
            label="지급 조서 처리 현황"
            view={
              <span className="payment-order-instructor-status-detail__aggregate-status-value">
                {renderAggregateStatus(aggregateStatus)}
              </span>
            }
          />
        </DetailInfoForm.Row>
      </DetailInfoForm>
    </div>
  )
}
