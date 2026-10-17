import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { isAxiosError } from 'axios'
import { settingsConsentWritePath } from '@/features/mypage'
import { useQueryClient } from '@tanstack/react-query'
import { TermsViewModal, useTermsViewModal } from '@/features/auth'
import { platformQueryKeys } from '@/shared/api/query-keys'
import {
  PFAlertModal,
  PFButton,
  PFLoadingSpinner,
  PFStateBadge,
  PFText,
  PFToggle,
} from '@/shared/ui'
import {
  putPortalMarketingConsent,
  TYPE_WITHDRAWABLE_CONSENT_TYPES,
  withdrawPortalConsentByType,
  withdrawPortalConsentDocument,
  type PortalConsentMutationResponse,
} from '../api/consents'
import { useSettingsConsents } from '../hooks/use-settings-consents'
import type { SettingsConsentItem, SettingsConsentItemId } from '../lib/consent-catalog'
import { formatConsentDate, SETTINGS_CONSENT_TYPE_BY_ID } from '../lib/map-consents'
import {
  isSettingsDocumentConsentItemId,
  settingsConsentItemIdToWriteKey,
} from '../lib/settings-consent-key'
import { ConsentWithdrawComplete, ConsentWithdrawConfirm } from './consent-withdraw-confirm'
import { ConsentDocumentPreviewOverlay } from './consent-document-preview-overlay'
import styles from './consents-view.module.css'

const WITHDRAW_REASON = '회원 마이페이지에서 직접 철회'
const WITHDRAW_FAILED_MESSAGE = '동의 철회에 실패했어요. 잠시 후 다시 시도해 주세요.'
const MARKETING_FAILED_MESSAGE = '마케팅 정보 수신 동의 변경에 실패했어요. 잠시 후 다시 시도해 주세요.'
const MARKETING_CONFLICT_MESSAGE = '이미 반영된 상태예요. 최신 동의 현황으로 갱신했어요.'

const MARKETING_AGREE_COPY = {
  title: '마케팅 정보 수신에 동의할까요?',
  description: [
    '동의 시 JA Korea의 프로그램·행사 등 홍보 안내를 받을 수 있습니다.',
    '동의는 언제든지 철회할 수 있습니다.',
  ].join('\n'),
  completeTitle: '마케팅 정보 수신에 동의했어요.',
  completeGuide: '수신을 원하지 않으시면 언제든지 동의를 철회할 수 있어요.',
}

type TypeWithdrawableConsentType = (typeof TYPE_WITHDRAWABLE_CONSENT_TYPES)[number]

function isTypeWithdrawableConsentType(value: string): value is TypeWithdrawableConsentType {
  return (TYPE_WITHDRAWABLE_CONSENT_TYPES as readonly string[]).includes(value)
}

function isConflictError(error: unknown): boolean {
  return isAxiosError(error) && error.response?.status === 409
}

/** documentId 있으면 문서 철회, 없으면 초상권·아동개인정보만 유형 철회 */
function withdrawConsentItem(item: SettingsConsentItem): Promise<PortalConsentMutationResponse> {
  if (item.documentId != null) {
    return withdrawPortalConsentDocument(item.documentId, WITHDRAW_REASON)
  }
  const consentType = SETTINGS_CONSENT_TYPE_BY_ID[item.id]
  if (isTypeWithdrawableConsentType(consentType)) {
    return withdrawPortalConsentByType(consentType, WITHDRAW_REASON)
  }
  return Promise.reject(new Error(`withdraw not supported: ${consentType}`))
}

type WithdrawCopy = {
  title: string
  description: string
  completeTitle: string
  completeGuide: string
}

const DOCUMENT_WITHDRAW_COPY: Partial<Record<SettingsConsentItemId, WithdrawCopy>> = {
  paymentStatement: {
    title: '지급조서 사전 동의를 철회할까요?',
    description:
      '철회 시 급여 항목 지급·정산 신청이 제한될 수 있습니다. 다시 이용하려면 동의서를 작성해 주세요.',
    completeTitle: '지급조서 사전 동의가 철회되었어요.',
    completeGuide: '정산을 신청하려면 [약관 및 정책 동의 관리]에서 동의서를 다시 작성해 주세요.',
  },
  educatorPledge: {
    title: '교육진행자 서약을 철회할까요?',
    description: '철회 시 UJAT·프로그램 강의 참여가 제한될 수 있습니다.',
    completeTitle: '교육진행자 서약 동의가 철회되었어요.',
    completeGuide: '다시 참여하려면 [약관 및 정책 동의 관리]에서 서약서를 작성해 주세요.',
  },
  administrativeJoint: {
    title: '행정정보 공동이용 사전동의를 철회할까요?',
    description: '철회 시 UJAT·프로그램 강의 참여가 제한될 수 있습니다.',
    completeTitle: '행정정보 공동이용 사전동의가 철회되었어요.',
    completeGuide: '다시 참여하려면 [약관 및 정책 동의 관리]에서 동의서를 작성해 주세요.',
  },
  sexOffenseCheck: {
    title: '성범죄 경력 조회 동의를 철회할까요?',
    description: '철회 시 UJAT·프로그램 강의 참여가 제한될 수 있습니다.',
    completeTitle: '성범죄 경력 조회 동의가 철회되었어요.',
    completeGuide: '다시 참여하려면 [약관 및 정책 동의 관리]에서 동의서를 작성해 주세요.',
  },
}

/** 기본 동의항목 철회 확인·완료 문구 */
const BASIC_WITHDRAW_COPY: Partial<Record<SettingsConsentItemId, WithdrawCopy>> = {
  portrait: {
    title: '초상권 수집·이용 동의를 철회할까요?',
    description: [
      '철회 시 회원님의 사진·영상을 활용하거나 새롭게 수집하지 않습니다.',
      '단, 이미 배포된 자료는 회수가 어려울 수 있습니다.',
      '동의하지 않은 상태에서는 JA Korea의 프로그램 신청 및 참여가 제한됩니다.',
    ].join('\n'),
    completeTitle: '초상권 수집·이용 동의가 철회되었어요.',
    completeGuide:
      '프로그램 참여를 원하시면 [약관 및 정책 동의 관리]에서 동의서를 다시 작성해 주세요.',
  },
  childPrivacy: {
    title: '만 14세 미만 아동 개인정보 수집·이용 동의를 철회할까요?',
    description: '철회 시 선택 항목으로 수집된 아동 개인정보를 더 이상 이용하지 않습니다.',
    completeTitle: '만 14세 미만 아동 개인정보 수집·이용 동의가 철회되었어요.',
    completeGuide: '다시 동의를 원하시면 [내 정보 수정]에서 동의해 주세요.',
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
  onViewDocument,
  onWriteDocument,
  onWithdraw,
}: {
  item: SettingsConsentItem
  marketingAgreed: boolean
  onMarketingChange: (next: boolean) => void
  onViewTerms: (item: SettingsConsentItem) => void
  onViewDocument?: (item: SettingsConsentItem) => void
  onWriteDocument?: (item: SettingsConsentItem) => void
  onWithdraw?: (item: SettingsConsentItem) => void
}) {
  const agreed = item.kind === 'toggle' ? marketingAgreed : item.agreed
  const canWithdraw = agreed && item.withdrawable === true && onWithdraw != null
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

      {item.kind === 'terms' && canWithdraw ? (
        <div className={styles.actions}>
          <PFButton size="medium" variant="tertiary" width="100%" onClick={() => onWithdraw?.(item)}>
            동의 철회
          </PFButton>
        </div>
      ) : null}

      {item.kind === 'document' && agreed ? (
        <div className={styles.actions}>
          {canWithdraw ? (
            <PFButton
              size="medium"
              variant="tertiary"
              className={styles.actionButton}
              onClick={() => onWithdraw?.(item)}
            >
              동의 철회
            </PFButton>
          ) : null}
          <PFButton
            size="medium"
            variant="tertiary"
            className={styles.actionButton}
            onClick={() => onViewDocument?.(item)}
          >
            동의서 확인
          </PFButton>
          <PFButton
            size="medium"
            variant="primary"
            className={styles.actionButton}
            onClick={() => onWriteDocument?.(item)}
          >
            동의서 재작성
          </PFButton>
        </div>
      ) : null}

      {item.kind === 'document' && !agreed ? (
        <div className={styles.actions}>
          <PFButton
            size="medium"
            variant="primary"
            width="100%"
            onClick={() => onWriteDocument?.(item)}
          >
            동의서 작성
          </PFButton>
        </div>
      ) : null}
    </article>
  )
}

export function SettingsConsentsView() {
  const navigate = useNavigate()
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
  const [isMarketingSaving, setIsMarketingSaving] = useState(false)
  const [marketingAgreeOpen, setMarketingAgreeOpen] = useState(false)
  const [marketingAgreedAt, setMarketingAgreedAt] = useState<string | null>(null)
  const [notice, setNotice] = useState<{ title: string; description: string } | null>(null)
  const [withdrawComplete, setWithdrawComplete] = useState<{
    id: SettingsConsentItemId
    withdrawnAt: string
  } | null>(null)
  const [documentPreviewItem, setDocumentPreviewItem] = useState<SettingsConsentItem | null>(null)
  const resolveWithdrawCopy = (id: SettingsConsentItemId) =>
    BASIC_WITHDRAW_COPY[id] ?? DOCUMENT_WITHDRAW_COPY[id]

  const withdrawCopy = withdrawTarget ? resolveWithdrawCopy(withdrawTarget.id) : undefined
  const completeCopy = withdrawComplete ? resolveWithdrawCopy(withdrawComplete.id) : undefined

  const handleWriteDocument = (item: SettingsConsentItem) => {
    if (!isSettingsDocumentConsentItemId(item.id)) return
    const consentKey = settingsConsentItemIdToWriteKey(item.id)
    if (!consentKey) return
    navigate(settingsConsentWritePath(consentKey))
  }

  const showWithdrawComplete = (id: SettingsConsentItemId, changedAt?: string | null) => {
    setWithdrawComplete({
      id,
      withdrawnAt: formatConsentDate(changedAt) ?? formatWithdrawnDate(new Date()),
    })
  }

  const refetchConsents = () =>
    queryClient.invalidateQueries({ queryKey: platformQueryKeys.mypage.consents() })

  const basicItems = consents.basicItems.map(item =>
    withdrawnIds.has(item.id) ? { ...item, agreed: false, agreedAt: undefined } : item,
  )

  /** 원격 세션: PUT 후 목록 재조회. 성공 시 철회 일시 반환, 409는 안내 후 동기화 */
  const saveMarketingConsent = async (
    agreed: boolean,
  ): Promise<
    { ok: true; agreedAt?: string | null; withdrawnAt?: string | null } | { ok: false }
  > => {
    if (!consents.isRemoteSession) {
      setMarketingOverride(agreed)
      return { ok: true }
    }
    setIsMarketingSaving(true)
    setMarketingOverride(agreed)
    try {
      const res = await putPortalMarketingConsent({ agreed })
      await refetchConsents()
      return { ok: true, agreedAt: res.agreedAt, withdrawnAt: res.withdrawnAt }
    } catch (error) {
      if (isConflictError(error)) {
        await refetchConsents()
        setNotice({ title: '안내', description: MARKETING_CONFLICT_MESSAGE })
      } else {
        setNotice({ title: '동의 변경 실패', description: MARKETING_FAILED_MESSAGE })
      }
      return { ok: false }
    } finally {
      setMarketingOverride(null)
      setIsMarketingSaving(false)
    }
  }

  const handleMarketingChange = (next: boolean) => {
    if (isMarketingSaving) return
    if (next) {
      setMarketingAgreeOpen(true)
      return
    }
    if (marketingItem) setWithdrawTarget(marketingItem)
  }

  const handleMarketingAgreeConfirm = async () => {
    const result = await saveMarketingConsent(true)
    setMarketingAgreeOpen(false)
    if (result.ok) {
      setMarketingAgreedAt(formatConsentDate(result.agreedAt) ?? formatWithdrawnDate(new Date()))
    }
  }

  const handleWithdrawConfirm = async () => {
    const target = withdrawTarget
    if (!target) return

    if (target.kind === 'toggle') {
      setIsWithdrawing(true)
      const result = await saveMarketingConsent(false)
      setIsWithdrawing(false)
      setWithdrawTarget(null)
      if (result.ok) showWithdrawComplete(target.id, result.withdrawnAt)
      return
    }

    if (!consents.isRemoteSession) {
      setWithdrawnIds(prev => new Set(prev).add(target.id))
      setWithdrawTarget(null)
      showWithdrawComplete(target.id)
      return
    }

    setIsWithdrawing(true)
    try {
      const res = await withdrawConsentItem(target)
      await refetchConsents()
      setWithdrawTarget(null)
      showWithdrawComplete(target.id, res.changedAt)
    } catch {
      setWithdrawTarget(null)
      setNotice({ title: '동의 철회 실패', description: WITHDRAW_FAILED_MESSAGE })
    } finally {
      setIsWithdrawing(false)
    }
  }

  if (consents.isLoading) {
    return (
      <div className={styles.page} role="status" aria-busy="true">
        <PFLoadingSpinner centered label="동의 현황을 불러오는 중" />
      </div>
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
            onViewDocument={item.kind === 'document' ? setDocumentPreviewItem : undefined}
            onWriteDocument={item.kind === 'document' ? handleWriteDocument : undefined}
            onWithdraw={BASIC_WITHDRAW_COPY[item.id] ? setWithdrawTarget : undefined}
          />
        ))}
      </section>

      <section className={styles.section}>
        <PFText as="h2" typo="hl-lg" color="black" className={styles.sectionTitle}>
          동의서·서약서
        </PFText>
        {consents.documentItems.map(item => (
          <ConsentCard
            key={item.id}
            item={item}
            marketingAgreed={marketingAgreed}
            onMarketingChange={handleMarketingChange}
            onViewTerms={next => {
              if (next.termsViewType) terms.open(next.termsViewType)
            }}
            onViewDocument={setDocumentPreviewItem}
            onWriteDocument={handleWriteDocument}
            onWithdraw={resolveWithdrawCopy(item.id) ? setWithdrawTarget : undefined}
          />
        ))}
      </section>

      <ConsentDocumentPreviewOverlay
        open={documentPreviewItem != null}
        item={documentPreviewItem}
        isRemoteSession={consents.isRemoteSession}
        onClose={() => setDocumentPreviewItem(null)}
      />

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

      <ConsentWithdrawConfirm
        open={marketingAgreeOpen}
        mode="agree"
        title={MARKETING_AGREE_COPY.title}
        description={MARKETING_AGREE_COPY.description}
        confirmLoading={isMarketingSaving}
        onCancel={() => setMarketingAgreeOpen(false)}
        onConfirm={() => {
          void handleMarketingAgreeConfirm()
        }}
      />

      <ConsentWithdrawComplete
        open={marketingAgreedAt != null}
        title={MARKETING_AGREE_COPY.completeTitle}
        description={
          marketingAgreedAt
            ? `동의 일자: ${marketingAgreedAt}\n${MARKETING_AGREE_COPY.completeGuide}`
            : null
        }
        onClose={() => setMarketingAgreedAt(null)}
      />

      <PFAlertModal
        open={notice != null}
        title={notice?.title}
        description={notice?.description}
        onConfirm={() => setNotice(null)}
      />
    </div>
  )
}
