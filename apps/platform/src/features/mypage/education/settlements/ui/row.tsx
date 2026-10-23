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
import { buildSettlementPaymentConsentPath } from '../lib/consent-path'
import { buildSettlementWritePath, type SettlementArea } from '../lib/write-path'
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
import { PFAlertModal, PFButton, PFStateBadge, PFText } from '@/shared/ui'
import styles from './row.module.css'

type EducationSettlementRowProps = {
  item: EducationSettlementItem
  applicationId: string
  documentKind?: SettlementDocumentKind
  area?: SettlementArea
  operationEndAt?: string
  initialRejectOpen?: boolean
  hideInstructorWrite?: boolean
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
  documentKind = 'receipt',
  area = 'education',
  operationEndAt,
  initialRejectOpen = false,
  hideInstructorWrite = false,
}: EducationSettlementRowProps) {
  const navigate = useNavigate()
  const [rejectOpen, setRejectOpen] = useState(initialRejectOpen)
  const config = resolveSettlementStatusUi(item.status, documentKind)
  const sessionId = item.id
  const writePath = buildSettlementWritePath({ applicationId, sessionId, area })
  const receiptSubmitPath = buildReceiptSubmitPath({ applicationId, sessionId, area })
  const receiptViewPath = buildReceiptViewPath({
    applicationId,
    sessionId,
    area,
    receiptId: item.receiptId,
    settlementApplicationId: item.settlementApplicationId,
  })
  const instructorViewPath = buildSettlementPaymentConsentPath({ applicationId, mode: 'view' })
  const closeRejectReason = () => {
    setRejectOpen(false)
    const params = new URLSearchParams(window.location.search)
    if (params.get('modal') !== 'reject-reason') return
    params.delete('modal')
    params.delete('sessionId')
    navigate(
      { search: params.toString() ? `?${params.toString()}` : '' },
      { replace: true },
    )
  }
  const amount = item.amount
  const showAmount = amount != null && config.amountKind != null
  const showPreviousAmount =
    documentKind === 'payment_statement' &&
    item.status === 'correction_completed' &&
    item.previousAmount != null
  const guideMessage =
    item.submitBlockedReason ??
    (documentKind === 'payment_statement' && item.deadlineNotice === 'operation_ended'
      ? PAYMENT_STATEMENT_OPERATION_ENDED_MESSAGE
      : config.message)
  const geminiUnsubmitted =
    hideInstructorWrite && documentKind === 'payment_statement' && (config.actions ?? []).includes('write')
  const showGuide = Boolean(guideMessage) && !geminiUnsubmitted
  const showUnsubmittedDeadline = UNSUBMITTED_DEADLINE_STATUSES.has(item.status)
  const relatedDateIso = showUnsubmittedDeadline
    ? item.deadlineAt ?? operationEndAt
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
    documentKind === 'payment_statement' ? instructorViewPath : receiptViewPath
  const viewDisabled = !viewPath
  const reapplyDisabled = isSettlementDeadlinePassed(item.deadlineAt)

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
            if (receiptSubmitPath) navigate(receiptSubmitPath)
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
    const reapplyUnavailable =
      documentKind === 'receipt' &&
      (item.canResubmitReceipt === false ||
        (item.hasPayableItems === false && item.canResubmitReceipt !== true))
    return (
      <PFButton
        key={action}
        type="button"
        variant="primary"
        size="large"
        disabled={reapplyDisabled || reapplyUnavailable}
        onClick={() => {
          if (reapplyDisabled || reapplyUnavailable) return
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
          date={formatEducationSessionDate(item.heldAt)}
          subtitle={
            item.sessionMeta ? (
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
              actionHint || showAmount || actions.length > 0 ? (
                <div className={styles.buttons}>
                  {showAmount ? (
                    <div className={styles.amountContainer}>
                      <PFText as="p" typo="bd-md-rg" color="neutral-cool-600">
                        {config.amountKind === 'expected' ? '정산 예정금액' : '정산 완료금액'}
                      </PFText>
                      {showPreviousAmount ? (
                        <PFText
                          as="p"
                          typo="bd-md-rg"
                          color="neutral-cool-500"
                          className={styles.amountStruck}
                        >
                          {item.previousAmount?.toLocaleString('ko-KR')}원
                        </PFText>
                      ) : null}
                      <PFText as="p" typo="hl-lg" color="black" className={styles.amount}>
                        {amount.toLocaleString('ko-KR')}원
                      </PFText>
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
                      {actions.map(renderAction)}
                    </>
                  )}
                </div>
              ) : undefined
            }
          />
        ) : null}
      </EducationSessionCard>

      <PFAlertModal
        open={rejectOpen}
        title="반려사유"
        confirmLabel="닫기"
        onConfirm={closeRejectReason}
        onDismiss={closeRejectReason}
      >
        <div className={styles.rejectBody}>
          <PFText as="p" typo="bd-md-rg" color="neutral-cool-600">
            해당 강의 일정
          </PFText>
          <PFText as="p" typo="bd-md-md" color="black">
            {[formatEducationSessionDate(item.heldAt), item.sessionMeta].filter(Boolean).join(' ')}
          </PFText>
          <PFText as="p" typo="bd-md-rg" color="neutral-cool-600">
            관리자 반려 사유
          </PFText>
          <PFText as="p" typo="bd-md-md" color="black">
            {item.rejectReason ?? '반려 사유가 없습니다.'}
          </PFText>
          {documentKind === 'payment_statement' && !hideInstructorWrite ? (
            <PFButton
              type="button"
              variant="primary"
              size="large"
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
        </div>
      </PFAlertModal>
    </>
  )
}
