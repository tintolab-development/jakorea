import { useRef, useState } from 'react'
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
  fetchPortalConsent,
  putPortalMarketingConsent,
  withdrawPortalConsentByType,
  withdrawPortalConsentDocument,
  type PortalConsentMutationResponse,
} from '../api/consents'
import { useSettingsConsents } from '../hooks/use-settings-consents'
import { useSettingsView } from '../hooks/use-settings-view'
import type { SettingsConsentItem, SettingsConsentItemId } from '../lib/consent-catalog'
import {
  canWithdrawConsent,
  CONSENT_WITHDRAW_CONFLICT_MESSAGE,
  CONSENT_WITHDRAW_FAILED_MESSAGE,
  logConsentWithdrawBackendRegression,
  parseConsentWithdrawError,
  resolveConsentWithdrawTarget,
} from '../lib/consent-withdraw'
import { formatConsentDate, SETTINGS_CONSENT_TYPE_BY_ID } from '../lib/map-consents'
import {
  isSettingsDocumentConsentItemId,
  settingsConsentItemIdToWriteKey,
} from '../lib/settings-consent-key'
import { downloadSubmittedCrimeConsent } from '../lib/download-submitted-crime-consent'
import { EMPTY_SETTINGS_VALUE } from '../lib/constants'
import {
  PORTRAIT_GUARDIAN_VERIFICATION_UNAVAILABLE_MESSAGE,
  startPortraitGuardianVerification,
} from '../lib/portrait-guardian-verification'
import {
  formatPortraitGuardianVerifiedDate,
  PORTRAIT_GUARDIAN_CARD_COPY,
  PORTRAIT_GUARDIAN_CONFIRM_COPY,
  PORTRAIT_GUARDIAN_ERROR_TITLE,
  PORTRAIT_GUARDIAN_MISSING_MESSAGE,
  PORTRAIT_GUARDIAN_VERIFIED_COPY,
  validatePortraitGuardianRelation,
} from '../lib/portrait-guardian-verification-copy'
import { ConsentWithdrawComplete, ConsentWithdrawConfirm } from './consent-withdraw-confirm'
import { PortraitGuardianInfoModal } from './portrait-guardian-info-modal'
import { ConsentDocumentPreviewOverlay } from './consent-document-preview-overlay'
import styles from './consents-view.module.css'

const WITHDRAW_REASON = '회원 마이페이지에서 직접 철회'
const DOWNLOAD_FAILED_MESSAGE =
  '업로드한 동의서를 다운로드하지 못했어요. 잠시 후 다시 시도해 주세요.'
const MARKETING_FAILED_MESSAGE =
  '마케팅 정보 수신 동의 변경에 실패했어요. 잠시 후 다시 시도해 주세요.'
const MARKETING_CONFLICT_MESSAGE = CONSENT_WITHDRAW_CONFLICT_MESSAGE

const MARKETING_AGREE_COPY = {
  title: '마케팅 정보 수신에 동의할까요?',
  description: [
    '동의 시 JA Korea의 프로그램·행사 등 홍보 안내를 받을 수 있습니다.',
    '동의는 언제든지 철회할 수 있습니다.',
  ].join('\n'),
  completeTitle: '마케팅 정보 수신에 동의했어요.',
  completeGuide: '수신을 원하지 않으시면 언제든지 동의를 철회할 수 있어요.',
}

function isConflictError(error: unknown): boolean {
  return isAxiosError(error) && error.response?.status === 409
}

function applyLocalWithdrawn(
  items: SettingsConsentItem[],
  withdrawnIds: ReadonlySet<SettingsConsentItemId>,
): SettingsConsentItem[] {
  return items.map(item =>
    withdrawnIds.has(item.id)
      ? { ...item, agreed: false, agreedAt: undefined, withdrawable: false, status: 'WITHDRAWN' }
      : item,
  )
}

/** documentId 있으면 문서 철회, 없으면 유형 철회. DRAFT 오류 시 유형 API로 우회하지 않는다. */
function withdrawConsentItem(
  item: SettingsConsentItem,
  idempotencyKey: string,
): Promise<PortalConsentMutationResponse> {
  const consentType = SETTINGS_CONSENT_TYPE_BY_ID[item.id]
  const target = resolveConsentWithdrawTarget({
    documentId: item.documentId,
    consentType,
  })
  if (target == null) {
    return Promise.reject(new Error(`withdraw not supported: ${consentType}`))
  }
  const options = { reason: WITHDRAW_REASON, idempotencyKey }
  if (target.kind === 'document') {
    return withdrawPortalConsentDocument(target.documentId, options)
  }
  return withdrawPortalConsentByType(target.consentType, options)
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
    description: [
      '철회 시 정산 금액 지급을 위한 정보를 더 이상 수집하거나 활용하지 않아요.',
      '단, 이미 지급된 내역은 세법에 따라 일정 기간 보관돼요.',
      '동의하지 않은 상태에서는 정산 신청 및 지급이 제한돼요.',
    ].join('\n'),
    completeTitle: '지급조서 사전 동의가 철회되었어요.',
    completeGuide: '정산 신청을 원하시면 [내 정보 수정]에서 다시 동의해 주세요.',
  },
  educatorPledge: {
    title: '교육진행자 서약을 철회할까요?',
    description: [
      '철회 시 제출하신 교육진행자 서약서를 더 이상 확인하거나 활용하지 않아요.',
      '서약하지 않은 상태에서는 교육진행자 활동이 제한돼요.',
    ].join('\n'),
    completeTitle: '교육진행자 서약 동의가 철회되었어요.',
    completeGuide: '다시 참여하려면 [약관 및 정책 동의 관리]에서 서약서를 작성해 주세요.',
  },
  administrativeJoint: {
    title: '행정정보 공동이용 사전동의를 철회할까요?',
    description: [
      '철회 시 제출하신 행정정보 공동이용 동의서를 더 이상 확인하지 않아요.',
      '동의하지 않은 상태에서는 교육진행자 활동이 제한돼요.',
    ].join('\n'),
    completeTitle: '행정정보 공동이용 사전동의가 철회되었어요.',
    completeGuide: '다시 참여하려면 [약관 및 정책 동의 관리]에서 동의서를 작성해 주세요.',
  },
  sexOffenseCheck: {
    title: '성범죄경력 조회 동의를 철회할까요?',
    description: [
      '철회 시 제출하신 성범죄경력 조회서를 더 이상 확인하거나 활용하지 않아요.',
      '동의하지 않은 상태에서는 교육진행자 활동이 제한돼요.',
    ].join('\n'),
    completeTitle: '성범죄 경력 조회 동의가 철회되었어요.',
    completeGuide: '다시 참여하려면 [약관 및 정책 동의 관리]에서 동의서를 작성해 주세요.',
  },
}

/** 기본 동의항목 철회 확인·완료 문구 */
const BASIC_WITHDRAW_COPY: Partial<Record<SettingsConsentItemId, WithdrawCopy>> = {
  portrait: {
    title: '초상권 수집·이용 동의를 철회할까요?',
    description: [
      '철회 시 회원님의 사진·영상을 활용하거나 새롭게 수집하지 않아요.',
      '단, 이미 배포된 자료는 회수가 어려울 수 있어요.',
      '동의하지 않은 상태에서는 JA Korea의 프로그램 신청 및 참여가 제한돼요.',
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
      '철회 시 JA Korea의 홍보 안내를 더 이상 받지 않아요.',
      '신청 내역, 계정 보안 등 서비스 이용에 필요한 안내는 계속 받을 수 있어요.',
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
    <PFText
      typo="bd-md-sb"
      color={required ? 'primary-500' : 'neutral-cool-500'}
      className={styles.requirementLabel}
    >
      {required ? '필수' : '선택'}
    </PFText>
  )
}

function ConsentStatusBadge({ agreed }: { agreed: boolean }) {
  return (
    <PFStateBadge
      size="small"
      tone={agreed ? 'progress' : 'disabled'}
      className={styles.statusBadge}
    >
      {agreed ? '동의함' : '미동의'}
    </PFStateBadge>
  )
}

function ConsentCard({
  item,
  marketingAgreed,
  showRequirementLabel = true,
  withdrawPending = false,
  onMarketingChange,
  onViewTerms,
  onViewDocument,
  onWriteDocument,
  onDownloadDocument,
  onWithdraw,
  notAgreedWriteLabel = '동의서 작성',
  notAgreedHint,
}: {
  item: SettingsConsentItem
  marketingAgreed: boolean
  showRequirementLabel?: boolean
  withdrawPending?: boolean
  onMarketingChange: (next: boolean) => void
  onViewTerms: (item: SettingsConsentItem) => void
  onViewDocument?: (item: SettingsConsentItem) => void
  onWriteDocument?: (item: SettingsConsentItem) => void
  onDownloadDocument?: (item: SettingsConsentItem) => void
  onWithdraw?: (item: SettingsConsentItem) => void
  /** 미동의 동의서 버튼 문구 — 기본값: `동의서 작성` */
  notAgreedWriteLabel?: string
  /** 미동의 안내 문구 — 지정 시 `item.hint`(만료 안내 포함) 대신 노출 */
  notAgreedHint?: string
}) {
  const agreed = item.kind === 'toggle' ? marketingAgreed : item.agreed
  const hint = notAgreedHint ?? item.hint
  /** 지정 안내 문구(미성년 초상권) — 두 줄이어도 칩 오른쪽 시작선에 맞춤 */
  const alignHintBesideBadge = !agreed && notAgreedHint != null
  const canWithdraw =
    onWithdraw != null &&
    canWithdrawConsent({
      withdrawable: item.withdrawable,
      status: item.status,
      pending: withdrawPending,
    })
  const isCrimeDocument = item.id === 'sexOffenseCheck'
  const cardClassName = [
    styles.card,
    item.required ? styles.cardRequired : styles.cardOptional,
  ].join(' ')

  return (
    <article className={cardClassName}>
      <div className={styles.cardHeader}>
        <div className={styles.titleGroup}>
          {showRequirementLabel ? <ConsentRequirementLabel required={item.required} /> : null}
          <PFText typo="bd-md-sb" color="black" className={styles.cardTitle}>
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
        <div
          className={
            alignHintBesideBadge
              ? `${styles.statusInfo} ${styles.statusInfoHintBesideBadge}`
              : styles.statusInfo
          }
        >
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
          {!agreed && hint ? (
            <PFText
              typo="bd-sm-rg"
              color="neutral-cool-500"
              className={alignHintBesideBadge ? styles.statusHintBesideBadge : undefined}
            >
              {hint}
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
          <PFButton
            size="medium"
            variant="tertiary"
            width="100%"
            disabled={withdrawPending}
            onClick={() => onWithdraw?.(item)}
          >
            동의 철회
          </PFButton>
        </div>
      ) : null}

      {item.kind === 'document' && agreed ? (
        <div className={styles.actions}>
          {canWithdraw ? (
            <PFButton
              size="large"
              variant="tertiary"
              className={styles.actionButton}
              disabled={withdrawPending}
              onClick={() => onWithdraw?.(item)}
            >
              동의 철회
            </PFButton>
          ) : null}
          {isCrimeDocument ? (
            <PFButton
              size="large"
              variant="tertiary"
              className={styles.actionButton}
              onClick={() => onDownloadDocument?.(item)}
            >
              동의서 다운로드
            </PFButton>
          ) : (
            <PFButton
              size="large"
              variant="tertiary"
              className={styles.actionButton}
              onClick={() => onViewDocument?.(item)}
            >
              동의서 확인
            </PFButton>
          )}
          <PFButton
            size="large"
            variant="primary"
            className={styles.actionButton}
            onClick={() => onWriteDocument?.(item)}
          >
            {isCrimeDocument ? '동의서 제출' : '동의서 재작성'}
          </PFButton>
        </div>
      ) : null}

      {item.kind === 'document' && !agreed ? (
        <div className={styles.actions}>
          <PFButton
            size="large"
            variant="primary"
            width="100%"
            onClick={() => onWriteDocument?.(item)}
          >
            {notAgreedWriteLabel}
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
  const { guardian } = useSettingsView()
  const marketingItem = consents.basicItems.find(item => item.id === 'marketing')
  const [marketingOverride, setMarketingOverride] = useState<boolean | null>(null)
  const marketingAgreed = marketingOverride ?? marketingItem?.agreed ?? false
  const [withdrawTarget, setWithdrawTarget] = useState<SettingsConsentItem | null>(null)
  const [withdrawIdempotencyKey, setWithdrawIdempotencyKey] = useState<string | null>(null)
  const [withdrawnIds, setWithdrawnIds] = useState<ReadonlySet<SettingsConsentItemId>>(
    () => new Set()
  )
  const [isWithdrawing, setIsWithdrawing] = useState(false)
  const withdrawingRef = useRef(false)
  const [isMarketingSaving, setIsMarketingSaving] = useState(false)
  const [marketingAgreeOpen, setMarketingAgreeOpen] = useState(false)
  const [marketingAgreedAt, setMarketingAgreedAt] = useState<string | null>(null)
  const [notice, setNotice] = useState<{ title: string; description: string } | null>(null)
  const [withdrawComplete, setWithdrawComplete] = useState<{
    id: SettingsConsentItemId
    withdrawnAt: string
  } | null>(null)
  const [documentPreviewItem, setDocumentPreviewItem] = useState<SettingsConsentItem | null>(null)
  /** 미성년 초상권 — 보호자 본인인증 단계 (1: confirm, 2: info, 4: verifiedAt) */
  const [portraitGuardianStep, setPortraitGuardianStep] = useState<'confirm' | 'info' | null>(null)
  const [portraitGuardianRelation, setPortraitGuardianRelation] = useState('')
  const [portraitGuardianRelationError, setPortraitGuardianRelationError] = useState<string | null>(
    null
  )
  const [isPortraitGuardianVerifying, setIsPortraitGuardianVerifying] = useState(false)
  const [portraitGuardianVerifiedAt, setPortraitGuardianVerifiedAt] = useState<string | null>(null)
  const resolveWithdrawCopy = (id: SettingsConsentItemId) =>
    BASIC_WITHDRAW_COPY[id] ?? DOCUMENT_WITHDRAW_COPY[id]

  const withdrawCopy = withdrawTarget ? resolveWithdrawCopy(withdrawTarget.id) : undefined
  const completeCopy = withdrawComplete ? resolveWithdrawCopy(withdrawComplete.id) : undefined

  /** 미성년 초상권 카드 — 미동의 문구 (성인·다른 카드는 기본값) */
  const resolvePortraitGuardianCardProps = (item: SettingsConsentItem) =>
    item.id === 'portrait' && consents.isMinor
      ? {
          notAgreedWriteLabel: PORTRAIT_GUARDIAN_CARD_COPY.writeLabel,
          notAgreedHint: PORTRAIT_GUARDIAN_CARD_COPY.notAgreedHint,
        }
      : undefined

  const navigateToWriteDocument = (id: SettingsConsentItemId) => {
    if (!isSettingsDocumentConsentItemId(id)) return
    const consentKey = settingsConsentItemIdToWriteKey(id)
    if (!consentKey) return
    navigate(settingsConsentWritePath(consentKey))
  }

  const handleWriteDocument = (item: SettingsConsentItem) => {
    if (item.id === 'portrait' && consents.isMinor) {
      setPortraitGuardianRelation('')
      setPortraitGuardianRelationError(null)
      setPortraitGuardianStep('confirm')
      return
    }
    navigateToWriteDocument(item.id)
  }

  const handlePortraitGuardianConfirm = () => {
    if (!guardian) {
      setPortraitGuardianStep(null)
      setNotice({
        title: PORTRAIT_GUARDIAN_ERROR_TITLE,
        description: PORTRAIT_GUARDIAN_MISSING_MESSAGE,
      })
      return
    }
    setPortraitGuardianStep('info')
  }

  const handlePortraitGuardianInfoConfirm = async () => {
    if (isPortraitGuardianVerifying) return
    const relationError = validatePortraitGuardianRelation(portraitGuardianRelation)
    setPortraitGuardianRelationError(relationError)
    if (relationError) return
    setIsPortraitGuardianVerifying(true)
    try {
      const result = await startPortraitGuardianVerification({
        relation: portraitGuardianRelation.trim(),
      })
      setPortraitGuardianStep(null)
      setPortraitGuardianVerifiedAt(
        formatPortraitGuardianVerifiedDate(result.verifiedAt) ?? formatWithdrawnDate(new Date())
      )
    } catch (error) {
      setPortraitGuardianStep(null)
      setNotice({
        title: PORTRAIT_GUARDIAN_ERROR_TITLE,
        description:
          error instanceof Error && error.message
            ? error.message
            : PORTRAIT_GUARDIAN_VERIFICATION_UNAVAILABLE_MESSAGE,
      })
    } finally {
      setIsPortraitGuardianVerifying(false)
    }
  }

  const handleDownloadDocument = (item: SettingsConsentItem) => {
    if (item.id !== 'sexOffenseCheck' || item.documentId == null) {
      setNotice({ title: '다운로드 실패', description: DOWNLOAD_FAILED_MESSAGE })
      return
    }
    void downloadSubmittedCrimeConsent(item.documentId).catch(() => {
      setNotice({ title: '다운로드 실패', description: DOWNLOAD_FAILED_MESSAGE })
    })
  }

  const showWithdrawComplete = (id: SettingsConsentItemId, changedAt?: string | null) => {
    setWithdrawComplete({
      id,
      withdrawnAt: formatConsentDate(changedAt) ?? formatWithdrawnDate(new Date()),
    })
  }

  const refetchConsents = async (consentType?: string) => {
    await queryClient.invalidateQueries({ queryKey: platformQueryKeys.mypage.consents() })
    if (!consentType) return
    try {
      await queryClient.fetchQuery({
        queryKey: platformQueryKeys.mypage.consent(consentType),
        queryFn: ({ signal }) => fetchPortalConsent(consentType, signal),
      })
    } catch {
      // 목록 GET이 화면 SSOT. 상세 readback 실패는 철회 성공 UX를 막지 않는다.
    }
  }

  const openWithdrawConfirm = (item: SettingsConsentItem) => {
    if (withdrawingRef.current) return
    setWithdrawTarget(item)
    setWithdrawIdempotencyKey(crypto.randomUUID())
  }

  const closeWithdrawConfirm = () => {
    setWithdrawTarget(null)
    setWithdrawIdempotencyKey(null)
  }

  const basicItems = applyLocalWithdrawn(consents.basicItems, withdrawnIds)
  const documentItems = applyLocalWithdrawn(consents.documentItems, withdrawnIds)

  /** 원격 세션: PUT 후 목록 재조회. 성공 시 철회 일시 반환, 409는 안내 후 동기화 */
  const saveMarketingConsent = async (
    agreed: boolean
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
    if (marketingItem) openWithdrawConfirm(marketingItem)
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
    if (!target || withdrawingRef.current) return
    withdrawingRef.current = true

    if (target.kind === 'toggle') {
      setIsWithdrawing(true)
      const result = await saveMarketingConsent(false)
      setIsWithdrawing(false)
      withdrawingRef.current = false
      closeWithdrawConfirm()
      if (result.ok) showWithdrawComplete(target.id, result.withdrawnAt)
      return
    }

    if (!consents.isRemoteSession) {
      setWithdrawnIds(prev => new Set(prev).add(target.id))
      withdrawingRef.current = false
      closeWithdrawConfirm()
      showWithdrawComplete(target.id)
      return
    }

    const consentType = SETTINGS_CONSENT_TYPE_BY_ID[target.id]
    const idempotencyKey = withdrawIdempotencyKey ?? crypto.randomUUID()
    setIsWithdrawing(true)
    try {
      const res = await withdrawConsentItem(target, idempotencyKey)
      await refetchConsents(consentType)
      closeWithdrawConfirm()
      showWithdrawComplete(target.id, res.changedAt)
    } catch (error) {
      const parsed = parseConsentWithdrawError(error, consentType)
      if (parsed.backendRegression) {
        logConsentWithdrawBackendRegression(parsed.code, consentType)
      }
      if (parsed.refetch) {
        await refetchConsents(consentType)
      }
      closeWithdrawConfirm()
      setNotice({
        title: parsed.refetch ? '안내' : '동의 철회 실패',
        description: parsed.message || CONSENT_WITHDRAW_FAILED_MESSAGE,
      })
    } finally {
      withdrawingRef.current = false
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
            withdrawPending={isWithdrawing}
            onMarketingChange={handleMarketingChange}
            onViewTerms={next => {
              if (next.termsViewType) terms.open(next.termsViewType)
            }}
            onViewDocument={item.kind === 'document' ? setDocumentPreviewItem : undefined}
            onWriteDocument={item.kind === 'document' ? handleWriteDocument : undefined}
            onWithdraw={BASIC_WITHDRAW_COPY[item.id] ? openWithdrawConfirm : undefined}
            {...resolvePortraitGuardianCardProps(item)}
          />
        ))}
      </section>

      <section className={styles.section}>
        <PFText as="h2" typo="hl-lg" color="black" className={styles.sectionTitle}>
          동의서·서약서
        </PFText>
        {documentItems.map(item => (
          <ConsentCard
            key={item.id}
            item={item}
            marketingAgreed={marketingAgreed}
            showRequirementLabel={false}
            withdrawPending={isWithdrawing}
            onMarketingChange={handleMarketingChange}
            onViewTerms={next => {
              if (next.termsViewType) terms.open(next.termsViewType)
            }}
            onViewDocument={setDocumentPreviewItem}
            onWriteDocument={handleWriteDocument}
            onDownloadDocument={handleDownloadDocument}
            onWithdraw={resolveWithdrawCopy(item.id) ? openWithdrawConfirm : undefined}
            {...resolvePortraitGuardianCardProps(item)}
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
        onCancel={closeWithdrawConfirm}
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

      <ConsentWithdrawConfirm
        open={portraitGuardianStep === 'confirm'}
        mode="agree"
        title={PORTRAIT_GUARDIAN_CONFIRM_COPY.title}
        description={PORTRAIT_GUARDIAN_CONFIRM_COPY.description}
        confirmLabel={PORTRAIT_GUARDIAN_CONFIRM_COPY.confirmLabel}
        mobileFullPage
        onCancel={() => setPortraitGuardianStep(null)}
        onConfirm={handlePortraitGuardianConfirm}
      />

      <PortraitGuardianInfoModal
        open={portraitGuardianStep === 'info'}
        guardianName={guardian?.name ?? EMPTY_SETTINGS_VALUE}
        guardianPhone={guardian?.phone ?? EMPTY_SETTINGS_VALUE}
        relation={portraitGuardianRelation}
        relationError={portraitGuardianRelationError}
        confirmLoading={isPortraitGuardianVerifying}
        onRelationChange={value => {
          setPortraitGuardianRelation(value)
          if (portraitGuardianRelationError) setPortraitGuardianRelationError(null)
        }}
        onCancel={() => setPortraitGuardianStep(null)}
        onConfirm={() => {
          void handlePortraitGuardianInfoConfirm()
        }}
      />

      <ConsentWithdrawComplete
        open={portraitGuardianVerifiedAt != null}
        title={PORTRAIT_GUARDIAN_VERIFIED_COPY.title}
        description={
          portraitGuardianVerifiedAt
            ? `${PORTRAIT_GUARDIAN_VERIFIED_COPY.dateLabel} : ${portraitGuardianVerifiedAt}\n${PORTRAIT_GUARDIAN_VERIFIED_COPY.guide}`
            : null
        }
        confirmLabel={PORTRAIT_GUARDIAN_VERIFIED_COPY.confirmLabel}
        showCloseButton={false}
        onConfirm={() => {
          setPortraitGuardianVerifiedAt(null)
          navigateToWriteDocument('portrait')
        }}
        onClose={() => setPortraitGuardianVerifiedAt(null)}
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
