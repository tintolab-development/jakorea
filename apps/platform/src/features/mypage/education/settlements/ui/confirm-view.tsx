import type { ReactNode } from 'react'
import type { SettlementTripLegDraft, SettlementWriteDraft } from '../model/write-draft'
import type { EducationSettlementItem } from '../model/types'
import {
  computeSettlementTransportTotal,
  formatSettlementAccountInfo,
  formatSettlementAmountDisplay,
  formatSettlementFileNames,
  formatSettlementHomeAddress,
  formatSettlementResidentNumber,
  hasSettlementActivitySection,
  hasSettlementMealSection,
  hasSettlementTransportSection,
  isSettlementTripLegStarted,
  resolveSettlementTransitLabel,
  resolveSettlementTripTypeLabel,
} from '../lib/format-write-draft'
import { EducationSettlementSessionBanner } from './settlement-session-banner'
import { PFButton, PFInfoReview, PFText, type PFInfoReviewItem } from '@/shared/ui'
import styles from './confirm-view.module.css'

type EducationSettlementConfirmViewProps = {
  draft: SettlementWriteDraft
  programTitle?: string
  session?: EducationSettlementItem
  onComplete: () => void
  onBack: () => void
}

function buildTripLegRows(leg: SettlementTripLegDraft): PFInfoReviewItem[] {
  return [
    { label: '대중교통 수단', value: resolveSettlementTransitLabel(leg.transit) },
    { label: '지출 금액', value: formatSettlementAmountDisplay(leg.amount) },
    { label: '영수증 제출', value: formatSettlementFileNames(leg.fileNames) },
  ]
}

function ConfirmSection({
  title,
  children,
  footer,
}: {
  title: string
  children: ReactNode
  footer?: string
}) {
  return (
    <section className={styles.section}>
      <PFText as="h2" typo="form-section-title" color="black" className={styles.sectionTitle}>
        {title}
      </PFText>
      {children}
      {footer ? (
        <PFText as="p" typo="bd-md-rg" color="neutral-cool-600" className={styles.sectionFooter}>
          {footer}
        </PFText>
      ) : null}
    </section>
  )
}

function ConfirmTripLegBlock({
  heading,
  leg,
}: {
  heading: string
  leg: SettlementTripLegDraft
}) {
  if (!isSettlementTripLegStarted(leg)) return null

  return (
    <div className={styles.legBlock}>
      <PFText as="p" typo="bd-lg-sb" color="black" className={styles.legHeading}>
        {heading}
      </PFText>
      <PFInfoReview rows={buildTripLegRows(leg)} />
    </div>
  )
}

export function EducationSettlementConfirmView({
  draft,
  programTitle,
  session,
  onComplete,
  onBack,
}: EducationSettlementConfirmViewProps) {
  const transportTotal = computeSettlementTransportTotal(draft)
  const showTransport = hasSettlementTransportSection(draft)
  const showMeal = hasSettlementMealSection(draft)
  const showActivity = hasSettlementActivitySection(draft)

  const basicRows: PFInfoReviewItem[] = [
    { label: '성명', value: draft.basic.name },
    { label: '주민등록번호', value: formatSettlementResidentNumber(draft) },
    { label: '자택 주소', value: formatSettlementHomeAddress(draft) },
    { label: '정산 계좌 정보', value: formatSettlementAccountInfo(draft) },
  ]

  return (
    <div className={styles.page}>
      <EducationSettlementSessionBanner
        programTitle={programTitle ?? draft.meta.programTitle}
        session={session}
      />

      <ConfirmSection title="기본 정보">
        <PFInfoReview rows={basicRows} />
      </ConfirmSection>

      {showTransport ? (
        <ConfirmSection title="교통비 신청">
          <PFInfoReview
            rows={[{ label: '신청 구분', value: resolveSettlementTripTypeLabel(draft.transport.tripType) }]}
          />

          <ConfirmTripLegBlock
            heading={draft.transport.tripType === 'round_trip' ? '가는 편(출발)' : '가는 편'}
            leg={draft.transport.depart}
          />

          {draft.transport.tripType === 'round_trip' ? (
            <ConfirmTripLegBlock heading="오는 편(귀가)" leg={draft.transport.return} />
          ) : null}

          <div className={styles.transportTotal}>
            <PFText typo="bd-md-md" color="neutral-cool-500" className={styles.transportTotalLabel}>
              총 산정 교통비
            </PFText>
            <PFText typo="bd-md-sb" color="black" className={styles.transportTotalValue}>
              {transportTotal > 0 ? `${transportTotal.toLocaleString('ko-KR')}원` : ''}
            </PFText>
          </div>
        </ConfirmSection>
      ) : null}

      {showMeal ? (
        <ConfirmSection
          title="식사비 신청"
          footer="1인 기준, 시간 당 최대 3만원까지 지급됩니다."
        >
          <PFInfoReview
            rows={[
              { label: '영수증 제출', value: formatSettlementFileNames(draft.meal.fileNames) },
              { label: '식사비', value: formatSettlementAmountDisplay(draft.meal.amount) },
            ]}
          />
        </ConfirmSection>
      ) : null}

      {showActivity ? (
        <ConfirmSection title="활동비 신청" footer="사용한 금액의 영수증을 제출해 주세요.">
          <PFInfoReview
            rows={[
              { label: '영수증 제출', value: formatSettlementFileNames(draft.activity.fileNames) },
              { label: '활동비', value: formatSettlementAmountDisplay(draft.activity.amount) },
            ]}
          />
        </ConfirmSection>
      ) : null}

      <div className={styles.actions}>
        <PFButton type="button" size="xlarge" width="100%" onClick={onComplete}>
          신청 완료하기
        </PFButton>
        <PFButton type="button" variant="tertiary" size="xlarge" width="100%" onClick={onBack}>
          이전
        </PFButton>
      </div>
    </div>
  )
}
