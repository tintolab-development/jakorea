import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { EducationSettlementItem } from '../model/types'
import { EDUCATION_SETTLEMENT_PROGRESS_LABEL } from '../lib/settlement-rules'
import { formatDisplayDate } from '@/shared/lib/format-display-date'
import {
  isSettlementDeadlinePassed,
  isSettlementWriteCtaDisabled,
  PAYMENT_STATEMENT_OPERATION_ENDED_MESSAGE,
  resolveSettlementStatusUi,
  type SettlementDocumentKind,
  type SettlementStatusAction,
} from '../lib/settlement-status-ui'
import { buildReceiptSubmitPath, buildReceiptViewPath } from '../lib/receipt-path'
import {
  buildSettlementConfirmPath,
  buildSettlementWritePath,
  type SettlementArea,
} from '../lib/write-path'
import {
  EducationSessionCard,
  EducationSessionCardHeader,
  EducationSessionGuideBlock,
  EducationSessionStatusMark,
  formatEducationSessionDate,
} from '../../shared'
import checkMintUrl from '@/shared/assets/icons/check-mint-small.svg'
import clockGrayUrl from '@/shared/assets/icons/clock-gray.svg'
import alertRedUrl from '@/shared/assets/icons/alert-red.svg'
import alertBlack24Url from '@/shared/assets/icons/alert-black-24.svg'
import { PFButton, PFCategoryBadge, PFModal, PFStateBadge, PFText } from '@/shared/ui'
import styles from './row.module.css'

type EducationSettlementRowProps = {
  item: EducationSettlementItem
  applicationId: string
  applicationType?: string
  documentKind?: SettlementDocumentKind
  area?: SettlementArea
  operationEndAt?: string
  initialRejectOpen?: boolean
  hideInstructorWrite?: boolean
  onReceiptWrite?: (path: string) => void
}

const MARK_ICON = {
  success: checkMintUrl,
  alert: alertRedUrl,
  neutral: clockGrayUrl,
} as const

const UNSUBMITTED_DEADLINE_STATUSES = new Set([
  'upcoming',
  'pending_submit',
  'overdue',
  'report_pending',
])

export function EducationSettlementRow({
  item,
  applicationId,
  applicationType,
  documentKind = 'receipt',
  area = 'education',
  operationEndAt,
  initialRejectOpen = false,
  hideInstructorWrite = false,
  onReceiptWrite,
}: EducationSettlementRowProps) {
  const navigate = useNavigate()
  const [rejectOpen, setRejectOpen] = useState(initialRejectOpen)
  const config = resolveSettlementStatusUi(item.status, documentKind)
  const sessionId = item.id
  const writePath = buildSettlementWritePath({
    applicationId,
    sessionId,
    area,
    applicationType,
  })
  const receiptSubmitPath = buildReceiptSubmitPath({
    applicationId,
    sessionId,
    area,
    applicationType,
  })
  const receiptViewPath = buildReceiptViewPath({
    applicationId,
    sessionId,
    area,
    applicationType,
    receiptId: item.receiptId,
    settlementApplicationId: item.settlementApplicationId,
  })
  const instructorViewPath = buildSettlementConfirmPath({
    applicationId,
    sessionId,
    area,
    applicationType,
    mode: 'view',
  })
  const closeRejectReason = () => {
    setRejectOpen(false)
    const params = new URLSearchParams(window.location.search)
    if (params.get('modal') !== 'reject-reason') return
    params.delete('modal')
    params.delete('sessionId')
    navigate({ search: params.toString() ? `?${params.toString()}` : '' }, { replace: true })
  }
  const amount = item.amount
  const showStruckOnly =
    documentKind === 'payment_statement' &&
    item.status === 'rejected' &&
    amount != null
  const showAmount = amount != null && config.amountKind != null && !showStruckOnly
  const showPreviousAmount =
    documentKind === 'payment_statement' &&
    ((item.status === 'correction_completed' && item.previousAmount != null) ||
      showStruckOnly)
  const guideMessage =
    item.submitBlockedReason ??
    (documentKind === 'payment_statement' && item.deadlineNotice === 'operation_ended'
      ? PAYMENT_STATEMENT_OPERATION_ENDED_MESSAGE
      : config.message)
  const geminiUnsubmitted =
    hideInstructorWrite &&
    documentKind === 'payment_statement' &&
    (config.actions ?? []).includes('write')
  const showGuide = Boolean(guideMessage) && !geminiUnsubmitted
  const showUnsubmittedDeadline = UNSUBMITTED_DEADLINE_STATUSES.has(item.status)
  const relatedDateIso = showUnsubmittedDeadline
    ? (item.deadlineAt ?? operationEndAt)
    : item.submittedAt
  const relatedDatePrefix = showUnsubmittedDeadline ? '제출 마감일' : '제출일'
  const relatedDate = formatDisplayDate(relatedDateIso)
  const description = relatedDate ? `${relatedDatePrefix} : ${relatedDate}` : item.deadlineLabel
  const actions = config.actions ?? []
  const actionHint = item.submitBlockedReason ? undefined : config.actionHint
  const hideReceiptWrite =
    documentKind === 'receipt' &&
    item.hasPayableItems === false &&
    item.settlementApplicationId == null &&
    item.status !== 'rejected'
  const writeDisabled = isSettlementWriteCtaDisabled({
    documentKind,
    writeDisabledByStatus: config.writeDisabled,
    hasPayableItems: item.hasPayableItems,
    eligible: item.eligible,
    evidencePolicyUnconfigured: item.evidencePolicyUnconfigured,
    canSubmit: item.canSubmitReceipt,
    status: item.status,
  })
  const viewPath =
    documentKind === 'payment_statement'
      ? item.settlementApplicationId != null
        ? instructorViewPath
        : null
      : receiptViewPath
  const viewDisabled = !viewPath
  const amountKindLabel =
    documentKind === 'payment_statement'
      ? config.amountKind === 'completed'
        ? '지급 완료 금액'
        : '정산 신청 금액'
      : config.amountKind === 'expected'
        ? '정산 예정금액'
        : '정산 완료금액'
  const headline =
    documentKind === 'payment_statement' && item.sessionMeta
      ? `${formatEducationSessionDate(item.heldAt)} ${item.sessionMeta}`
      : formatEducationSessionDate(item.heldAt)
  const reapplyDisabled = isSettlementDeadlinePassed(item.deadlineAt)
  const receiptReapplyUnavailable =
    documentKind === 'receipt' &&
    (item.canResubmitReceipt === false ||
      (item.hasPayableItems === false && item.canResubmitReceipt !== true))

  const renderAction = (action: SettlementStatusAction) => {
    if (action === 'write') {
      if (hideReceiptWrite) return null
      if (hideInstructorWrite && documentKind === 'payment_statement') return null
      return (
        <PFButton
          key={action}
          type="button"
          variant="primary"
          size="large"
          disabled={writeDisabled}
          onClick={() => {
            if (writeDisabled) return
            if (documentKind === 'payment_statement') {
              navigate(writePath)
              return
            }
            if (!receiptSubmitPath) return
            if (onReceiptWrite) {
              onReceiptWrite(receiptSubmitPath)
              return
            }
            navigate(receiptSubmitPath)
          }}
        >
          {config.writeLabel ?? '영수증 작성하기'}
        </PFButton>
      )
    }
    if (action === 'view') {
      return (
        <PFButton
          key={action}
          type="button"
          variant="tertiary"
          size="large"
          disabled={viewDisabled}
          onClick={() => {
            if (viewDisabled || !viewPath) return
            navigate(viewPath)
          }}
        >
          {config.viewLabel ?? '영수증 확인하기'}
        </PFButton>
      )
    }
    if (action === 'reject-reason') {
      return (
        <PFButton
          key={action}
          type="button"
          variant="tertiary"
          size="large"
          onClick={() => setRejectOpen(true)}
        >
          <img src={alertBlack24Url} alt="" width={24} height={24} aria-hidden="true" />
          반려사유 확인
        </PFButton>
      )
    }
    if (action === 'view-correction') {
      return (
        <PFButton
          key={action}
          type="button"
          variant="tertiary"
          size="large"
          disabled={viewDisabled}
          onClick={() => {
            if (viewDisabled || !viewPath) return
            navigate(viewPath)
          }}
        >
          {config.viewLabel ?? '정정 내역 확인'}
        </PFButton>
      )
    }
    if (hideInstructorWrite && documentKind === 'payment_statement') return null
    const reapplyPath = documentKind === 'receipt' ? receiptSubmitPath : writePath
    const reapplyUnavailable = receiptReapplyUnavailable
    return (
      <PFButton
        key={action}
        type="button"
        variant="primary"
        size="large"
        disabled={reapplyDisabled || reapplyUnavailable}
        onClick={() => {
          if (reapplyDisabled || reapplyUnavailable) return
          if (documentKind === 'receipt' && onReceiptWrite) {
            onReceiptWrite(reapplyPath)
            return
          }
          navigate(reapplyPath)
        }}
      >
        {config.writeLabel ?? '지급조서 재신청'}
      </PFButton>
    )
  }

  return (
    <>
      <EducationSessionCard tone={config.cardTone ?? 'default'}>
        <EducationSessionCardHeader
          badge={
            <PFStateBadge
              size="small"
              tone={item.progress === 'completed' ? 'success' : 'progress'}
            >
              {EDUCATION_SETTLEMENT_PROGRESS_LABEL[item.progress]}
            </PFStateBadge>
          }
          date={headline}
          subtitle={
            documentKind === 'payment_statement' && item.institutionLabel ? (
              <PFCategoryBadge size="small" variant="secondary">
                {item.institutionLabel}
              </PFCategoryBadge>
            ) : item.sessionMeta && documentKind !== 'payment_statement' ? (
              <PFText as="span" typo="bd-lg-rg">
                {item.sessionMeta}
              </PFText>
            ) : undefined
          }
          aside={
            config.markLabel && config.markTone ? (
              <EducationSessionStatusMark
                tone={config.markTone}
                label={config.markLabel}
                iconSrc={MARK_ICON[config.markTone]}
              />
            ) : undefined
          }
        />

        {showGuide && guideMessage ? (
          <EducationSessionGuideBlock
            variant={config.guideVariant ?? 'default'}
            statusLabel={config.statusLabel}
            statusTone={config.statusTone}
            message={guideMessage ?? ''}
            description={description}
            actions={
              actionHint || showAmount || showPreviousAmount || actions.length > 0 ? (
                <div className={styles.buttons}>
                  {showAmount || showPreviousAmount ? (
                    <div className={styles.amountContainer}>
                      <PFText as="p" typo="bd-md-rg" color="neutral-cool-600">
                        {amountKindLabel}
                      </PFText>
                      {showPreviousAmount ? (
                        <PFText as="p" typo="hl-lg" className={styles.amountStruck}>
                          {(item.previousAmount ?? amount)?.toLocaleString('ko-KR')}원
                        </PFText>
                      ) : null}
                      {showAmount && amount != null ? (
                        <PFText as="p" typo="hl-lg" color="black" className={styles.amount}>
                          {amount.toLocaleString('ko-KR')}원
                        </PFText>
                      ) : null}
                    </div>
                  ) : null}

                  {actions.includes('write') ? (
                    <div className={styles.writeRow}>
                      {actionHint ? (
                        <PFText
                          as="p"
                          typo="bd-md-rg"
                          color="neutral-cool-600"
                          className={styles.actionHint}
                        >
                          {actionHint}
                        </PFText>
                      ) : null}
                      {renderAction('write')}
                    </div>
                  ) : (
                    <>
                      {actionHint ? (
                        <PFText
                          as="p"
                          typo="bd-md-rg"
                          color="neutral-cool-600"
                          className={styles.actionHint}
                        >
                          {actionHint}
                        </PFText>
                      ) : null}
                      <div className={styles.actionButtons}>{actions.map(renderAction)}</div>
                    </>
                  )}
                </div>
              ) : undefined
            }
          />
        ) : null}
      </EducationSessionCard>

      <PFModal
        open={rejectOpen}
        size="md"
        title="반려사유 확인"
        onClose={closeRejectReason}
        mobilePlacement="center"
        showCloseButton={false}
      >
        <div className={styles.rejectContent}>
          <div className={styles.rejectBody}>
            <PFText as="p" typo="bd-md-rg" color="neutral-cool-600">
              해당 강의 일정
            </PFText>
            <PFText as="p" typo="bd-sm-rg" color="neutral-cool-600">
              {[formatEducationSessionDate(item.heldAt), item.sessionMeta].filter(Boolean).join(' ')}
            </PFText>
            <PFText as="p" typo="bd-md-rg" color="neutral-cool-600">
              관리자 반려 사유
            </PFText>
            <PFText as="p" typo="bd-md-md" color="black">
              {item.rejectReason ?? '반려 사유가 없습니다.'}
            </PFText>
          </div>
          <div className={styles.rejectActions}>
            <PFButton
              type="button"
              variant="tertiary"
              size="xlarge"
              className={styles.rejectButton}
              onClick={closeRejectReason}
            >
              닫기
            </PFButton>
            {documentKind === 'payment_statement' && !hideInstructorWrite ? (
              <PFButton
                type="button"
                variant="primary"
                size="xlarge"
                className={styles.rejectButton}
                disabled={reapplyDisabled}
                onClick={() => {
                  if (reapplyDisabled) return
                  closeRejectReason()
                  navigate(writePath)
                }}
              >
                지급조서 재신청
              </PFButton>
            ) : null}
            {documentKind === 'receipt' && receiptSubmitPath ? (
              <PFButton
                type="button"
                variant="primary"
                size="xlarge"
                className={styles.rejectButton}
                disabled={reapplyDisabled || receiptReapplyUnavailable}
                onClick={() => {
                  if (reapplyDisabled || receiptReapplyUnavailable) return
                  closeRejectReason()
                  if (onReceiptWrite) {
                    onReceiptWrite(receiptSubmitPath)
                    return
                  }
                  navigate(receiptSubmitPath)
                }}
              >
                영수증 수정 제출
              </PFButton>
            ) : null}
          </div>
        </div>
      </PFModal>
    </>
  )
}
