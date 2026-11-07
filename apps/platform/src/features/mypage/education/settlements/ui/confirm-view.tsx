import type { ReactNode } from 'react'
import type { SettlementTripLegDraft, SettlementWriteDraft } from '../model/write-draft'
import type { EducationSettlementItem } from '../model/types'
import {
  computeSettlementTransportTotal,
  formatSettlementAccountInfo,
  formatSettlementAmountDisplay,
  formatSettlementFileNames,
  formatSettlementHomeAddress,
  formatSettlementPaymentPurpose,
  formatSettlementResidentNumber,
  hasSettlementActivitySection,
  hasSettlementMealSection,
  hasSettlementTransportSection,
  isReceiptWriteDraft,
  isSettlementTripLegStarted,
  resolveSettlementTransitLabel,
  resolveSettlementTripTypeLabel,
  startedReceiptExtraItems,
} from '../lib/format-write-draft'
import { readSettlementNamedExpenseFileNames } from '../lib/build-write-draft'
import {
  formatEducationProgressSessionCount,
  formatInstructorFeeAssignment,
  formatTotalLectureFee,
  hasConfirmedLectureFeeTotal,
  isLectureFeeSettlementBlocked,
  lectureFeeSettlementBlockerMessage,
  lectureFeeTypeDisplayLabel,
} from '../lib/lecture-fee-preview'
import { readInstructorBusinessIncomeLabel } from '../lib/instructor-settlement-summary'
import { usePortalProfileQuery } from '@/features/auth/sign-in'
import { readTripLegFileNames } from '../lib/empty-trip-leg'
import {
  isReceiptEvidenceRequired,
  isReceiptWageItemType,
  overlayPayableEvidenceRequired,
  payableEvidenceRequired,
  sortReceiptPayableItems,
} from '../lib/payment-items'
import { InstructorTransportFeeBlock } from './instructor-transport-fee-block'
import { EducationSettlementSessionBanner } from './settlement-session-banner'
import { PFButton, PFInfoReview, PFText, type PFInfoReviewItem } from '@/shared/ui'
import styles from './confirm-view.module.css'

type EducationSettlementConfirmViewProps = {
  draft: SettlementWriteDraft
  programTitle?: string
  session?: EducationSettlementItem
  submitting?: boolean
  readOnly?: boolean
  onComplete: () => void
  onBack: () => void
}

function buildTripLegRows(leg: SettlementTripLegDraft): PFInfoReviewItem[] {
  return [
    { label: '대중교통 수단', value: resolveSettlementTransitLabel(leg.transit) },
    { label: '지출 금액', value: formatSettlementAmountDisplay(leg.amount) },
    { label: '영수증 제출', value: formatSettlementFileNames(readTripLegFileNames(leg)) },
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
      <div className={styles.sectionBody}>{children}</div>
      {footer ? (
        <PFText as="p" typo="bd-md-rg" color="neutral-cool-600" className={styles.sectionFooter}>
          {footer}
        </PFText>
      ) : null}
    </section>
  )
}

function ConfirmAmountSummary({ label, amount }: { label: string; amount: string }) {
  return (
    <div className={styles.amountSummary}>
      <PFText typo="bd-md-sb" color="black">
        {label}
      </PFText>
      <PFText typo="bd-md-sb" color="black">
        {amount}
      </PFText>
    </div>
  )
}

function ConfirmTripLegBlock({
  heading,
  leg,
  showReceipt,
}: {
  heading: string
  leg: SettlementTripLegDraft
  showReceipt: boolean
}) {
  if (!isSettlementTripLegStarted(leg)) return null

  return (
    <div className={styles.legBlock}>
      <PFText as="p" typo="bd-md-sb" color="black" className={styles.legHeading}>
        {heading}
      </PFText>
      <PFInfoReview
        rows={
          showReceipt
            ? buildTripLegRows(leg)
            : buildTripLegRows(leg).filter(row => row.label !== '영수증 제출')
        }
        accentFirstRow={false}
      />
    </div>
  )
}

export function EducationSettlementConfirmView({
  draft,
  programTitle,
  session,
  submitting = false,
  readOnly = false,
  onComplete,
  onBack,
}: EducationSettlementConfirmViewProps) {
  const isReceipt = isReceiptWriteDraft(draft)
  const profileQuery = usePortalProfileQuery({ enabled: !isReceipt })
  const transportTotal = computeSettlementTransportTotal(draft)
  const showTransport = hasSettlementTransportSection(draft)
  const showMeal = hasSettlementMealSection(draft)
  const showActivity = hasSettlementActivitySection(draft)
  const sortedReceiptExtras = isReceiptWriteDraft(draft)
    ? sortReceiptPayableItems(startedReceiptExtraItems(draft))
    : []
  const receiptExtras = readOnly
    ? sortedReceiptExtras
    : overlayPayableEvidenceRequired(sortedReceiptExtras, session?.payableItems)
  const wageExtras = receiptExtras.filter(item =>
    isReceiptWageItemType(item.itemType, item.itemName)
  )
  const restExtras = receiptExtras.filter(
    item => !isReceiptWageItemType(item.itemType, item.itemName)
  )
  const showTransportReceipt = isReceiptEvidenceRequired(
    readOnly
      ? draft.transport.evidenceRequired
      : (payableEvidenceRequired(session?.payableItems, draft.transport.itemType) ??
          draft.transport.evidenceRequired)
  )
  const resident = formatSettlementResidentNumber(draft)
  const lectureFeePreview = session?.lectureFeePreview ?? null
  const lectureFeeBlocked = isLectureFeeSettlementBlocked(lectureFeePreview)
  const lectureFeeBlockerMessage = lectureFeeSettlementBlockerMessage(lectureFeePreview)
  const confirmedLectureFee = hasConfirmedLectureFeeTotal(lectureFeePreview)
  const businessIncome = readInstructorBusinessIncomeLabel(profileQuery.data)
  const calcRows: PFInfoReviewItem[] = [
    { label: '강사비 유형', value: lectureFeeTypeDisplayLabel(lectureFeePreview?.lectureFeeType) },
    { label: '강사비 배정', value: formatInstructorFeeAssignment(lectureFeePreview) },
    { label: '사업소득자 여부', value: businessIncome },
    {
      label: '교육 진행 차시',
      value: formatEducationProgressSessionCount(lectureFeePreview?.recognizedSessionCount),
    },
  ]
  const totalLectureFee = formatTotalLectureFee(lectureFeePreview)
  const basicRows: PFInfoReviewItem[] = [
    { label: '성명', value: draft.basic.name },
    ...(isReceipt ? [{ label: '영문명', value: draft.basic.nameEn }] : []),
    ...(isReceipt ? [] : [{ label: '주민등록번호', value: resident }]),
    { label: '자택 주소', value: formatSettlementHomeAddress(draft) },
    { label: '정산 계좌 정보', value: formatSettlementAccountInfo(draft) },
    ...(isReceipt ? [] : [{ label: '지급 목적', value: formatSettlementPaymentPurpose(draft) }]),
  ]

  return (
    <div className={styles.page}>
      <EducationSettlementSessionBanner
        programTitle={programTitle ?? draft.meta.programTitle}
        session={session}
        institutionTitle={!isReceipt}
      />

      {!isReceipt ? (
        <ConfirmSection title="강사비 산출 정보">
          <PFInfoReview rows={calcRows} accentFirstRow={false} />
          {confirmedLectureFee ? (
            <ConfirmAmountSummary label="총 강사비" amount={totalLectureFee} />
          ) : null}
          {lectureFeeBlockerMessage ? (
            <PFText as="p" typo="bd-md-rg" color="error" className={styles.sectionFooter}>
              {lectureFeeBlockerMessage}
            </PFText>
          ) : null}
        </ConfirmSection>
      ) : null}

      <ConfirmSection title="기본 정보">
        <PFInfoReview rows={basicRows} accentFirstRow={false} />
      </ConfirmSection>

      {wageExtras.map(item => (
        <ConfirmSection key={item.itemType} title={`${item.itemName} 신청`}>
          {isReceiptEvidenceRequired(item.evidenceRequired) ? (
            <PFInfoReview
              accentFirstRow={false}
              rows={[
                {
                  label: '영수증 제출',
                  value: formatSettlementFileNames(item.attachments.map(file => file.fileName)),
                },
              ]}
            />
          ) : null}
          <ConfirmAmountSummary
            label={item.itemName}
            amount={formatSettlementAmountDisplay(item.amount)}
          />
        </ConfirmSection>
      ))}

      {showTransport ? (
        <ConfirmSection title="교통비 신청">
          {isReceipt ? (
            <>
              <PFInfoReview
                accentFirstRow={false}
                rows={[
                  {
                    label: '신청 구분',
                    value: resolveSettlementTripTypeLabel(draft.transport.tripType),
                  },
                ]}
              />

              <ConfirmTripLegBlock
                heading={draft.transport.tripType === 'round_trip' ? '가는 편(출발)' : '가는 편'}
                leg={draft.transport.depart}
                showReceipt={showTransportReceipt}
              />

              {draft.transport.tripType === 'round_trip' ? (
                <ConfirmTripLegBlock
                  heading="오는 편(귀가)"
                  leg={draft.transport.return}
                  showReceipt={showTransportReceipt}
                />
              ) : null}

              <ConfirmAmountSummary
                label="총 산정 교통비"
                amount={transportTotal > 0 ? `${transportTotal.toLocaleString('ko-KR')}원` : ''}
              />
            </>
          ) : (
            <InstructorTransportFeeBlock
              preview={session?.instructorTransportPreview ?? draft.transport.autoPreview ?? null}
            />
          )}
        </ConfirmSection>
      ) : null}

      {restExtras.map(item => (
        <ConfirmSection
          key={item.itemType}
          title={`${item.itemName} 신청`}
          footer={
            item.itemType === 'ACTIVITY' && isReceiptEvidenceRequired(item.evidenceRequired)
              ? '사용한 금액의 영수증을 제출해 주세요.'
              : undefined
          }
        >
          {isReceiptEvidenceRequired(item.evidenceRequired) ? (
            <PFInfoReview
              accentFirstRow={false}
              rows={[
                {
                  label: '영수증 제출',
                  value: formatSettlementFileNames(item.attachments.map(file => file.fileName)),
                },
              ]}
            />
          ) : null}
          <ConfirmAmountSummary
            label={item.itemName}
            amount={formatSettlementAmountDisplay(item.amount)}
          />
        </ConfirmSection>
      ))}

      {!isReceiptWriteDraft(draft) && showMeal ? (
        <ConfirmSection title="식사비 신청" footer="1인 기준, 시간 당 최대 3만원까지 지급됩니다.">
          <PFInfoReview
            accentFirstRow={false}
            rows={[
              {
                label: '영수증 제출',
                value: formatSettlementFileNames(readSettlementNamedExpenseFileNames(draft.meal)),
              },
            ]}
          />
          <ConfirmAmountSummary
            label="식사비"
            amount={formatSettlementAmountDisplay(draft.meal.amount)}
          />
        </ConfirmSection>
      ) : null}

      {!isReceiptWriteDraft(draft) && showActivity ? (
        <ConfirmSection title="활동비 신청" footer="사용한 금액의 영수증을 제출해 주세요.">
          <PFInfoReview
            accentFirstRow={false}
            rows={[
              {
                label: '영수증 제출',
                value: formatSettlementFileNames(
                  readSettlementNamedExpenseFileNames(draft.activity)
                ),
              },
            ]}
          />
          <ConfirmAmountSummary
            label="활동비"
            amount={formatSettlementAmountDisplay(draft.activity.amount)}
          />
        </ConfirmSection>
      ) : null}

      <div className={styles.actions}>
        {readOnly ? null : (
          <PFButton
            type="button"
            size="xlarge"
            width="100%"
            disabled={submitting || lectureFeeBlocked}
            onClick={onComplete}
          >
            {submitting ? '제출 중' : '신청 완료하기'}
          </PFButton>
        )}
        <PFButton
          type="button"
          variant="tertiary"
          size="xlarge"
          width="100%"
          disabled={submitting}
          onClick={onBack}
        >
          이전
        </PFButton>
      </div>
    </div>
  )
}
