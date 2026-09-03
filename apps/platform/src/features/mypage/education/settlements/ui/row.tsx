import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { EducationSettlementItem, EducationSettlementStatus } from '../model/types'
import {
  EDUCATION_SETTLEMENT_PROGRESS_LABEL,
  type SettlementAmountKind,
} from '../lib/settlement-rules'
import { buildSettlementPaymentConsentPath } from '../lib/consent-path'
import { buildSettlementWritePath } from '../lib/write-path'
import {
  EducationSessionCard,
  EducationSessionCardHeader,
  EducationSessionGuideBlock,
  EducationSessionStatusMark,
  type EducationSessionStatusMarkTone,
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
}

type StatusMarkConfig = {
  tone: EducationSessionStatusMarkTone
  label: string
  iconSrc: string
}

type StatusAction = 'write' | 'view' | 'reject-reason' | 'reapply'

type StatusConfig = {
  message?: string
  mark?: StatusMarkConfig
  statusLabel?: string
  statusTone?: 'submitted' | 'unsubmitted'
  guideVariant?: 'default' | 'submitted'
  cardTone?: 'default' | 'danger'
  amountKind?: SettlementAmountKind
  actionHint?: string
  writeDisabled?: boolean
  actions?: StatusAction[]
}

const STATUS_CONFIG: Record<EducationSettlementStatus, StatusConfig> = {
  report_pending: {
    message: '기한 내에 지급조서를 제출해 주세요',
    actionHint: '강의보고서 작성 이후에 지급조서 작성이 가능합니다',
    writeDisabled: true,
    actions: ['write'],
  },
  pending_submit: {
    message: '기한 내에 지급조서를 제출해 주세요',
    actions: ['write'],
  },
  overdue: {
    message: '기한 내에 지급조서를 제출해 주세요',
    mark: { tone: 'alert', label: '지급조서 미제출', iconSrc: alertRedUrl },
    statusLabel: '미제출',
    statusTone: 'unsubmitted',
    actions: ['write'],
  },
  waiting_confirm: {
    message: '지급조서 신청이 완료되었어요',
    mark: { tone: 'neutral', label: '확인 대기', iconSrc: clockGrayUrl },
    statusLabel: '제출 완료',
    statusTone: 'submitted',
    guideVariant: 'submitted',
    amountKind: 'expected',
    actions: ['view'],
  },
  reapplied: {
    message: '지급조서 재신청이 완료되었어요',
    mark: { tone: 'neutral', label: '재신청', iconSrc: clockGrayUrl },
    statusLabel: '제출 완료',
    statusTone: 'submitted',
    guideVariant: 'submitted',
    amountKind: 'expected',
    actions: ['view'],
  },
  confirmed: {
    message: '담당자 확인이 완료되어 계좌 지급 예정이에요',
    mark: { tone: 'success', label: '확인 완료', iconSrc: checkMintUrl },
    amountKind: 'expected',
    actions: ['view'],
  },
  paid: {
    message: '계좌 지급이 완료되었어요',
    mark: { tone: 'success', label: '지급 완료', iconSrc: checkMintUrl },
    amountKind: 'completed',
    actions: ['view'],
  },
  rejected: {
    message: '지급조서 신청이 반려되었어요',
    mark: { tone: 'alert', label: '신청 반려', iconSrc: alertRedUrl },
    amountKind: 'expected',
    cardTone: 'danger',
    actions: ['reject-reason', 'reapply'],
  },
  upcoming: {},
}

export function EducationSettlementRow({ item, applicationId }: EducationSettlementRowProps) {
  const navigate = useNavigate()
  const [rejectOpen, setRejectOpen] = useState(false)
  const config = STATUS_CONFIG[item.status]
  const writePath = buildSettlementWritePath({ applicationId, sessionId: item.id })
  const viewPath = buildSettlementPaymentConsentPath({ applicationId, mode: 'view' })
  const amount = item.amount
  const showAmount = amount != null && config.amountKind != null
  const showGuide = Boolean(config.message)

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
            <PFText as="span" typo="bd-lg-rg">
              {item.sessionMeta}
            </PFText>
          }
          aside={config.mark ? <EducationSessionStatusMark {...config.mark} /> : undefined}
        />

        {showGuide && config.message ? (
          <EducationSessionGuideBlock
            variant={config.guideVariant ?? 'default'}
            statusLabel={config.statusLabel}
            statusTone={config.statusTone}
            message={config.message}
            description={item.deadlineLabel}
            actions={
              <div className={styles.buttons}>
                {config.actionHint ? (
                  <PFText
                    as="p"
                    typo="bd-md-rg"
                    color="neutral-cool-600"
                    className={styles.actionHint}
                  >
                    {config.actionHint}
                  </PFText>
                ) : null}

                {showAmount ? (
                  <div className={styles.amountContainer}>
                    <PFText as="p" typo="bd-md-rg" color="neutral-cool-600">
                      {config.amountKind === 'expected' ? '정산 예정금액' : '정산 완료금액'}
                    </PFText>
                    <PFText as="p" typo="hl-lg" color="black" className={styles.amount}>
                      {amount.toLocaleString('ko-KR')}원
                    </PFText>
                  </div>
                ) : null}

                {config.actions?.map(action => {
                  if (action === 'write') {
                    return (
                      <PFButton
                        key={action}
                        type="button"
                        variant="primary"
                        size="large"
                        disabled={config.writeDisabled}
                        onClick={() => navigate(writePath)}
                      >
                        지급조서 작성하기
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
                        onClick={() => navigate(viewPath)}
                      >
                        지급조서 확인하기
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
                  return (
                    <PFButton
                      key={action}
                      type="button"
                      variant="primary"
                      size="large"
                      onClick={() => navigate(writePath)}
                    >
                      지급조서 재신청
                    </PFButton>
                  )
                })}
              </div>
            }
          />
        ) : null}
      </EducationSessionCard>

      <PFAlertModal
        open={rejectOpen}
        title="반려사유"
        description={item.rejectReason ?? '반려 사유가 없습니다.'}
        onConfirm={() => setRejectOpen(false)}
      />
    </>
  )
}
