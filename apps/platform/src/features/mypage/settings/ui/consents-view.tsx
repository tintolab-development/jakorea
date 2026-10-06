import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { TermsViewModal, useTermsViewModal } from '@/features/auth'
import { platformQueryKeys } from '@/shared/api/query-keys'
import { PFAlertModal, PFButton, PFStateBadge, PFText, PFToggle } from '@/shared/ui'
import { withdrawPortalConsentDocument } from '../api/consents'
import { useSettingsConsents } from '../hooks/use-settings-consents'
import type { SettingsConsentItem, SettingsConsentItemId } from '../lib/consent-catalog'
import { ConsentWithdrawComplete, ConsentWithdrawConfirm } from './consent-withdraw-confirm'
import styles from './consents-view.module.css'

const WITHDRAW_REASON = '회원 마이페이지에서 직접 철회'
const WITHDRAW_FAILED_MESSAGE = '동의 철회에 실패했어요. 잠시 후 다시 시도해 주세요.'

type WithdrawCopy = {
  title: string
  description: string
  completeTitle: string
  completeGuide: string
}

/** 기본 동의항목 철회 확인·완료 문구. 동의서·서약서 항목은 추후 추가 */
const BASIC_WITHDRAW_COPY: Partial<Record<SettingsConsentItemId, WithdrawCopy>> = {
  portrait: {
    title: '초상권 수집·이용 동의를 철회할까요?',
    description: [
      '철회 시 회원님의 사진·영상을 활용하거나 새롭게 수집하지 않습니다.',
      '단, 이미 배포된 자료는 회수가 어려울 수 있습니다.',
      '동의하지 않은 상태에서는 JA Korea의 프로그램 신청 및 참여가 제한됩니다.',
    ].join('\n'),
    completeTitle: '초상권 수집·이용 동의가 철회되었어요.',
    completeGuide: '프로그램 참여를 원하시면 [내 정보 수정]에서 다시 동의해 주세요.',
  },
  marketing: {
    title: '마케팅 정보 수신 동의를 철회할까요?',
    description: [
      '철회 시 JA Korea의 홍보 안내를 더 이상 받지 않습니다.',
      '신청 내역, 계정 보안 등 서비스 이용에 필요한 안내는 계속 받을 수 있습니다.',
    ].join('\n'),
    completeTitle: '마케팅 정보 수신 동의가 철회되었어요.',
    completeGuide: '홍보 안내를 받으시려면 [내 정보 수정]에서 다시 동의해 주세요.',
  },
}

function formatWithdrawnDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}.${m}.${d}`
}

export type SettingsConsentsViewProps = {
  showInstructorDocuments: boolean
}

function ConsentRequirementLabel({ required }: { required: boolean }) {
  return (
    <PFText typo="bd-md-sb" color={required ? 'primary-500' : 'neutral-cool-500'}>
      {required ? '필수' : '선택'}
    </PFText>
  )
}

function ConsentStatusBadge({ agreed }: { agreed: boolean }) {
  return (
    <PFStateBadge size="small" tone={agreed ? 'progress' : 'disabled'}>
      {agreed ? '동의함' : '미동의'}
    </PFStateBadge>
  )
}

function ConsentCard({
  item,
  marketingAgreed,
  onMarketingChange,
  onViewTerms,
  onWithdraw,
}: {
  item: SettingsConsentItem
  marketingAgreed: boolean
  onMarketingChange: (next: boolean) => void
  onViewTerms: (item: SettingsConsentItem) => void
  onWithdraw?: (item: SettingsConsentItem) => void
}) {
  const agreed = item.kind === 'toggle' ? marketingAgreed : item.agreed
  const cardClassName = [
    styles.card,
    item.required ? styles.cardRequired : styles.cardOptional,
  ].join(' ')

  return (
    <article className={cardClassName}>
      <div className={styles.cardHeader}>
        <div className={styles.titleGroup}>
          <ConsentRequirementLabel required={item.required} />
          <PFText typo="bd-md-sb" color="black">
            {item.title}
          </PFText>
        </div>
        <div className={styles.headerActions}>
          {item.termsViewType ? (
            <PFButton
              size="small"
              variant="text"
              className={styles.termsViewButton}
              onClick={() => onViewTerms(item)}
            >
              약관 보기
            </PFButton>
          ) : null}
        </div>
      </div>

      <div className={styles.statusRow}>
        <div className={styles.statusInfo}>
          <ConsentStatusBadge agreed={agreed} />
          {item.kind === 'document' && agreed && (item.agreedAt || item.validityLabel) ? (
            <PFText typo="bd-sm-rg" color="neutral-cool-500">
              {[
                item.agreedAt ? `동의일시 ${item.agreedAt}` : null,
                item.validityLabel ? `유효기간 ${item.validityLabel}` : null,
              ]
                .filter(Boolean)
                .join(' · ')}
            </PFText>
          ) : null}
          {item.kind !== 'document' && agreed && item.agreedAt ? (
            <PFText typo="bd-sm-rg" color="black">
              동의일시 {item.agreedAt}
            </PFText>
          ) : null}
          {!agreed && item.hint ? (
            <PFText typo="bd-sm-rg" color="neutral-cool-500">
              {item.hint}
            </PFText>
          ) : null}
        </div>
        {item.kind === 'toggle' ? (
          <PFToggle
            variant="switch"
            checked={marketingAgreed}
            onChange={onMarketingChange}
            aria-label={`${item.title} ${marketingAgreed ? '동의' : '미동의'}`}
            className={styles.statusToggle}
          />
        ) : null}
      </div>

      {item.kind === 'document' && agreed ? (
        <div className={styles.actions}>
          <PFButton
            size="medium"
            variant="tertiary"
            className={styles.actionButton}
            onClick={onWithdraw ? () => onWithdraw(item) : undefined}
          >
            동의 철회
          </PFButton>
          <PFButton size="medium" variant="tertiary" className={styles.actionButton}>
            동의서 확인
          </PFButton>
          <PFButton size="medium" variant="primary" className={styles.actionButton}>
            동의서 재작성
          </PFButton>
        </div>
      ) : null}

      {item.kind === 'document' && !agreed ? (
        <div className={styles.actions}>
          <PFButton size="medium" variant="primary" width="100%">
            동의서 작성
          </PFButton>
        </div>
      ) : null}
    </article>
  )
}

export function SettingsConsentsView({ showInstructorDocuments }: SettingsConsentsViewProps) {
  const terms = useTermsViewModal()
  const queryClient = useQueryClient()
  const consents = useSettingsConsents()
  const marketingItem = consents.basicItems.find(item => item.id === 'marketing')
  const [marketingOverride, setMarketingOverride] = useState<boolean | null>(null)
  const marketingAgreed = marketingOverride ?? marketingItem?.agreed ?? false
  const [withdrawTarget, setWithdrawTarget] = useState<SettingsConsentItem | null>(null)
  const [withdrawnIds, setWithdrawnIds] = useState<ReadonlySet<SettingsConsentItemId>>(
    () => new Set(),
  )
  const [isWithdrawing, setIsWithdrawing] = useState(false)
  const [withdrawError, setWithdrawError] = useState<string | null>(null)
  const [withdrawComplete, setWithdrawComplete] = useState<{
    id: SettingsConsentItemId
    withdrawnAt: string
  } | null>(null)
  const withdrawCopy = withdrawTarget ? BASIC_WITHDRAW_COPY[withdrawTarget.id] : undefined
  const completeCopy = withdrawComplete ? BASIC_WITHDRAW_COPY[withdrawComplete.id] : undefined

  const showWithdrawComplete = (id: SettingsConsentItemId) => {
    setWithdrawComplete({ id, withdrawnAt: formatWithdrawnDate(new Date()) })
  }

  const basicItems = consents.basicItems.map(item =>
    withdrawnIds.has(item.id) ? { ...item, agreed: false, agreedAt: undefined } : item,
  )

  const handleMarketingChange = (next: boolean) => {
    if (next) {
      setMarketingOverride(true)
      return
    }
    if (marketingItem) setWithdrawTarget(marketingItem)
  }

  const handleWithdrawConfirm = async () => {
    const target = withdrawTarget
    if (!target) return

    if (target.kind === 'toggle') {
      setMarketingOverride(false)
      setWithdrawTarget(null)
      showWithdrawComplete(target.id)
      return
    }

    if (consents.isRemoteSession) {
      if (target.documentId == null) {
        setWithdrawTarget(null)
        setWithdrawError(WITHDRAW_FAILED_MESSAGE)
        return
      }
      setIsWithdrawing(true)
      try {
        await withdrawPortalConsentDocument(target.documentId, WITHDRAW_REASON)
        await queryClient.invalidateQueries({ queryKey: platformQueryKeys.mypage.consents() })
      } catch {
        setWithdrawTarget(null)
        setWithdrawError(WITHDRAW_FAILED_MESSAGE)
        return
      } finally {
        setIsWithdrawing(false)
      }
    }

    setWithdrawnIds(prev => new Set(prev).add(target.id))
    setWithdrawTarget(null)
    showWithdrawComplete(target.id)
  }

  if (consents.isLoading) {
    return (
      <PFText as="p" typo="bd-md-rg" color="neutral-cool-600">
        동의 현황을 불러오는 중이에요…
      </PFText>
    )
  }

  if (consents.isError) {
    return (
      <PFText as="p" typo="bd-md-rg" color="error">
        동의 현황을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.
      </PFText>
    )
  }

  return (
    <div className={styles.page}>
      <section className={styles.section}>
        <PFText as="h2" typo="hl-lg" color="black" className={styles.sectionTitle}>
          기본 동의항목
        </PFText>
        {basicItems.map(item => (
          <ConsentCard
            key={item.id}
            item={item}
            marketingAgreed={marketingAgreed}
            onMarketingChange={handleMarketingChange}
            onViewTerms={next => {
              if (next.termsViewType) terms.open(next.termsViewType)
            }}
            onWithdraw={BASIC_WITHDRAW_COPY[item.id] ? setWithdrawTarget : undefined}
          />
        ))}
      </section>

      {showInstructorDocuments && consents.instructorItems.length > 0 ? (
        <section className={styles.section}>
          <PFText as="h2" typo="hl-lg" color="black" className={styles.sectionTitle}>
            동의서·서약서
          </PFText>
          {consents.instructorItems.map(item => (
            <ConsentCard
              key={item.id}
              item={item}
              marketingAgreed={marketingAgreed}
              onMarketingChange={handleMarketingChange}
              onViewTerms={next => {
                if (next.termsViewType) terms.open(next.termsViewType)
              }}
            />
          ))}
        </section>
      ) : null}

      {terms.openType ? (
        <TermsViewModal open={terms.isOpen} type={terms.openType} onClose={terms.close} />
      ) : null}

      <ConsentWithdrawConfirm
        open={withdrawCopy != null}
        title={withdrawCopy?.title}
        description={withdrawCopy?.description}
        confirmLoading={isWithdrawing}
        onCancel={() => setWithdrawTarget(null)}
        onConfirm={() => {
          void handleWithdrawConfirm()
        }}
      />

      <ConsentWithdrawComplete
        open={completeCopy != null}
        title={completeCopy?.completeTitle}
        description={
          completeCopy && withdrawComplete
            ? `동의 철회 일자: ${withdrawComplete.withdrawnAt}\n${completeCopy.completeGuide}`
            : null
        }
        onClose={() => setWithdrawComplete(null)}
      />

      <PFAlertModal
        open={withdrawError != null}
        title="동의 철회 실패"
        description={withdrawError}
        onConfirm={() => setWithdrawError(null)}
      />
    </div>
  )
}
