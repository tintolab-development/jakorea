/**
 * 내 정보 확인 모달
 */

import dayjs from 'dayjs'
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { DetailInfoFormTdDivider } from '@/shared/components/detail-info-form'
import { toDisplayGender } from '@/features/user/api/map-member-gender-birth'
import { formatBirthDisplayWithManAge } from '@/features/user/api/format-gender-birth-display'
import {
  ADMIN_PERMISSION_TAG_LABEL,
  getAdminPermissionVariant,
} from '@/features/user/shared/lib/admin-permission-display'
import {
  getManagedProgramMetricsParts,
  ManagedProgramCountDisplay,
} from '@/features/user/detail/lib/user-detail-fullpage-helpers'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { withdrawAdminSelfRemote } from '@/features/user/api/members-api-client'
import { fetchAdminMe, updateAdminMarketingConsent } from '@/features/auth/api/fetch-admin-me'
import { applyAdminMeToSessionUser } from '@/features/auth/lib/apply-admin-me-to-session-user'
import { completeAdminIdentityReverification } from '@/features/auth/api/admin-identity-contact'
import { fetchCurrentTermsDocumentMeta } from '@/features/user/api/fetch-current-terms-document'
import { isMembersRemoteEnabled } from '@/features/user/api/member-remote-capabilities'
import {
  getMemberApiErrorMessage,
  getMemberDeleteCurrentPasswordInvalidAlertOptions,
  isMemberDeleteCurrentPasswordInvalidError,
} from '@/features/user/api/get-member-api-error'
import { isGlobalApiErrorAlertShown } from '@/shared/lib/show-global-api-error-alert'
import {
  cmsIdentityVerificationClient,
  type IdentityChallengeCompleteResult,
} from '@/features/auth/identity-verification'
import { useIdentityVerification as useIdentityVerificationBase } from '@jakorea/identity-verification/react'
import { formatKoreanPhoneNumber } from '@jakorea/domain/shared/korean-phone'
import { CmsButton, ConfirmModal, ContentModal, useCmsAlert } from '@/shared/ui'
import { MemberWithdrawGuideModal } from '@/features/user/shared/ui/member-withdraw-guide-modal'
import { ProfilePasswordChangeModal } from '@/shared/ui/profile-password-change-modal'
import type { User, TermsAgreementRow } from '@/types/user'
import { formatDateDot } from '@/shared/utils'
import '@/features/user/detail/ui/user-consent-agreement-section.css'
import './profile-edit-modal.css'

interface ProfileEditModalProps {
  open: boolean
  onCancel: () => void
  onSuccess?: () => void
}

type MarketingConsentValue = 'agree' | 'disagree'
type TermsKind = 'SERVICE_TERMS' | 'PERSONAL_INFO' | 'MARKETING' | 'MFA_SETUP'

const ADMIN_MARKETING_CONSENT_WITHDRAW_CONFIRM = {
  title: '동의 철회 안내',
  content: [
    '마케팅 정보 수신 동의를 철회하시겠습니까?',
    '철회 시 JA Korea의 홍보 안내를 더 이상 받지 않습니다.',
    '신청 내역, 계정 보안 등 서비스 이용에 필요한 안내는 계속 받을 수 있습니다.',
  ].join('\n'),
  confirmText: '철회하기',
  cancelText: '취소',
}

const ADMIN_MARKETING_CONSENT_AGREE_DONE_TITLE = '동의 완료'

function formatConsentDoneDate(iso?: string): string {
  const parsed = iso?.trim() ? dayjs(iso) : dayjs()
  return (parsed.isValid() ? parsed : dayjs()).format('YYYY.MM.DD')
}

/** 동의 완료 안내 — 동의일은 응답 agreedAt(없으면 오늘) 기준 YYYY.MM.DD */
function buildMarketingAgreeDoneContent(agreedAt?: string): string {
  return [
    '마케팅 정보 수신 동의가 완료되었습니다.',
    '수신 동의는 [내 정보 확인]에서 언제든지 철회할 수 있습니다.',
    `동의일 : ${formatConsentDoneDate(agreedAt)}`,
  ].join('\n')
}

const ADMIN_MARKETING_CONSENT_WITHDRAW_DONE_TITLE = '동의 철회 완료'

/** 동의 철회 완료 안내 — 철회일은 응답 withdrawnAt(없으면 오늘) 기준 YYYY.MM.DD */
function buildMarketingWithdrawDoneContent(withdrawnAt?: string): string {
  const date = formatConsentDoneDate(withdrawnAt)
  return [
    '마케팅 정보 수신 동의가 철회되었습니다.',
    '홍보 안내를 받으시려면 [내 정보 확인]에서 다시 동의해 주세요.',
    `동의 철회일 : ${date}`,
  ].join('\n')
}

const SAMPLE_AGREED_AT = '2026.01.15 09:15:42'

const TERMS_TYPE_TO_KIND: Record<string, TermsKind> = {
  SERVICE_TERMS: 'SERVICE_TERMS',
  TERMS_OF_SERVICE: 'SERVICE_TERMS',
  PERSONAL_INFO: 'PERSONAL_INFO',
  PERSONAL_INFO_COLLECTION: 'PERSONAL_INFO',
  PRIVACY_COLLECTION: 'PERSONAL_INFO',
  MARKETING: 'MARKETING',
  MARKETING_CONSENT: 'MARKETING',
  MFA_SETUP: 'MFA_SETUP',
  MFA_SETUP_CONSENT: 'MFA_SETUP',
  TWO_FACTOR_AUTH: 'MFA_SETUP',
  TWO_FACTOR_AUTHENTICATION: 'MFA_SETUP',
}

function formatTermsAgreedAt(iso?: string, emptyFallback = SAMPLE_AGREED_AT): string {
  if (!iso?.trim()) return emptyFallback
  const parsed = dayjs(iso)
  return parsed.isValid() ? parsed.format('YYYY.MM.DD HH:mm:ss') : iso
}

function resolveTermsAgreement(
  termsAgreements: TermsAgreementRow[] | undefined,
  kind: TermsKind,
  options?: { sampleFallback?: boolean }
): { agreed: boolean; agreedAtDisplay: string } {
  const agreements = termsAgreements ?? []
  const record = agreements.find(item => {
    const type = item.termsType?.trim().toUpperCase()
    return type != null && TERMS_TYPE_TO_KIND[type] === kind
  })

  if (!record) {
    // 세션/상세에 약관이 없을 때: mock은 샘플, remote는 미동의로 표시 (마케팅 오표기 방지)
    if (options?.sampleFallback) {
      return { agreed: true, agreedAtDisplay: SAMPLE_AGREED_AT }
    }
    return { agreed: false, agreedAtDisplay: '-' }
  }

  return {
    agreed: record.agreed === true,
    agreedAtDisplay: formatTermsAgreedAt(
      record.agreedAt,
      record.agreed === true ? SAMPLE_AGREED_AT : '-'
    ),
  }
}

function syncMarketingConsentState(
  termsAgreements: TermsAgreementRow[] | undefined,
  sampleFallback: boolean
): { consent: MarketingConsentValue; agreedAt: string } {
  const marketing = resolveTermsAgreement(termsAgreements, 'MARKETING', { sampleFallback })
  return {
    consent: marketing.agreed ? 'agree' : 'disagree',
    agreedAt: marketing.agreedAtDisplay,
  }
}

function findMarketingTermsRow(
  termsAgreements: TermsAgreementRow[] | undefined
): TermsAgreementRow | undefined {
  return termsAgreements?.find(item => {
    const type = item.termsType?.trim().toUpperCase()
    return type != null && TERMS_TYPE_TO_KIND[type] === 'MARKETING'
  })
}

/** PUT /api/admin/me/marketing-consent 필수 `version` — 기존 이력 → MARKETING current → SERVICE_TERMS current */
async function resolveMarketingConsentVersion(
  termsAgreements: TermsAgreementRow[] | undefined
): Promise<string> {
  const fromRow = findMarketingTermsRow(termsAgreements)?.termsVersion?.trim()
  if (fromRow) return fromRow

  const marketingMeta = await fetchCurrentTermsDocumentMeta('MARKETING')
  const fromMarketing = marketingMeta?.version?.trim()
  if (fromMarketing) return fromMarketing

  const serviceMeta = await fetchCurrentTermsDocumentMeta('SERVICE_TERMS')
  const fromService = serviceMeta?.version?.trim()
  if (fromService) return fromService

  throw new Error('약관 버전을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.')
}

function ConsentValueDisplay({ value }: { value: ReactNode }) {
  if (typeof value !== 'string') return value
  const idx = value.indexOf('|')
  if (idx === -1) return value
  const status = value.slice(0, idx).trim()
  const datetime = value.slice(idx + 1).trim()
  if (!datetime) return value
  return (
    <span className="user-consent-agreement-section__value-inner">
      <span className="user-consent-agreement-section__value-status">{status}</span>
      <span className="user-consent-agreement-section__value-sep" aria-hidden>
        |
      </span>
      <span className="user-consent-agreement-section__value-datetime">{datetime}</span>
    </span>
  )
}

function consentReadonlyContent(agreed: boolean, agreedAtDisplay?: string) {
  if (!agreed) {
    return (
      <span className="user-consent-agreement-section__value-inner">
        <ConsentValueDisplay value="미동의" />
      </span>
    )
  }
  const text = agreedAtDisplay ? `동의 | ${agreedAtDisplay}` : '동의'
  return (
    <span className="user-consent-agreement-section__value-inner">
      <ConsentValueDisplay value={text} />
    </span>
  )
}

function ProfileFieldWithAction({
  value,
  actionLabel,
  onAction,
  actionDisabled,
  actionLoading,
}: {
  value: ReactNode
  actionLabel: string
  onAction: () => void
  actionDisabled?: boolean
  actionLoading?: boolean
}) {
  return (
    <span className="profile-edit-modal__value-with-action">
      <span className="profile-edit-modal__value-with-action-text">{value}</span>
      <CmsButton
        variant="secondary"
        size="h32" className="profile-edit-modal__field-action-btn"
        type="button"
        disabled={actionDisabled}
        loading={actionLoading}
        onClick={onAction} >
        {actionLabel}
      </CmsButton>
    </span>
  )
}

/** 내 정보 확인 — 생년월일 `YYYY.MM.DD (만 N세)` (공백 없는 점 표기) */
function formatProfileBirthDisplay(user: Omit<User, 'password'>): string {
  const birth = user.birthDate
  const raw =
    birth instanceof Date
      ? dayjs(birth).isValid()
        ? dayjs(birth).format('YYYY-MM-DD')
        : ''
      : birth == null
        ? ''
        : String(birth)
  if (!raw) return '-'
  return formatBirthDisplayWithManAge(raw, { age: user.manAge }).replace(
    /^(\d{4})\. (\d{2})\. (\d{2})/,
    '$1.$2.$3'
  )
}

function ProfileGenderBirthView({ user }: { user: Omit<User, 'password'> }) {
  return (
    <span className="user-basic-info-section__inline-segments">
      <span>{toDisplayGender(user.gender)}</span>
      <DetailInfoFormTdDivider />
      <span>{formatProfileBirthDisplay(user)}</span>
    </span>
  )
}

function resolveAdminPermissionLabel(user: Omit<User, 'password'>): string {
  if (user.role !== 'ADMIN') return '-'
  const hasPermissionData =
    user.listMetrics?.adminPermissionVariant != null ||
    Boolean(user.roleCode?.trim()) ||
    (user.programRoles != null && Object.keys(user.programRoles).length > 0) ||
    user.adminLevel != null
  if (!hasPermissionData) return '-'
  return ADMIN_PERMISSION_TAG_LABEL[getAdminPermissionVariant(user)]
}

function AdminManagedProgramsView({ user }: { user: Omit<User, 'password'> }) {
  if (user.role !== 'ADMIN') return '-'
  if (!getManagedProgramMetricsParts(user)) return '-'
  return <ManagedProgramCountDisplay user={user} />
}

export function ProfileEditModal({ open, onCancel }: ProfileEditModalProps) {
  const { user, updateUser, logout } = useAuthStore()
  const { showAlert } = useCmsAlert()
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false)
  const [passwordChangeModalOpen, setPasswordChangeModalOpen] = useState(false)
  const [withdrawing, setWithdrawing] = useState(false)
  const [marketingConsent, setMarketingConsent] = useState<MarketingConsentValue>('disagree')
  const [marketingAgreedAt, setMarketingAgreedAt] = useState('-')
  const [marketingConsentUpdating, setMarketingConsentUpdating] = useState(false)
  const [marketingWithdrawConfirmOpen, setMarketingWithdrawConfirmOpen] = useState(false)
  /** 철회 성공 후 안내 팝업이 닫힌 뒤 띄울 완료 안내(withdrawnAt) — 팝업 전환 겹침 방지 */
  const pendingWithdrawDoneRef = useRef<{ withdrawnAt?: string } | null>(null)
  /** 약관 표시용 — GET /api/admin/me 응답을 정본으로 사용 */
  const [profileTermsAgreements, setProfileTermsAgreements] = useState<
    TermsAgreementRow[] | undefined
  >(undefined)
  const identityVerifyAttemptRef = useRef(false)

  const handleIdentitySuccess = useCallback(
    (result: IdentityChallengeCompleteResult) => {
      identityVerifyAttemptRef.current = false
      // 서버 반영·유지 정보 불일치 판정은 onSuccess 안에서 일어나므로 실패 팝업도 여기서 직접 띄운다.
      void completeAdminIdentityReverification(result, { updateUser, showAlert })
    },
    [showAlert, updateUser]
  )

  const { verify, isVerifying, errorMessage, resetError } = useIdentityVerificationBase({
    client: cmsIdentityVerificationClient,
    requireBirthGender: false,
    requireName: false,
    onSuccess: handleIdentitySuccess,
  })

  useEffect(() => {
    if (!identityVerifyAttemptRef.current || !errorMessage || isVerifying) {
      return
    }

    identityVerifyAttemptRef.current = false
    showAlert({
      title: '본인인증 실패',
      content: errorMessage,
    })
  }, [errorMessage, isVerifying, showAlert])

  useEffect(() => {
    const currentUser = useAuthStore.getState().user
    if (!open || !currentUser) {
      setProfileTermsAgreements(undefined)
      setMarketingWithdrawConfirmOpen(false)
      return
    }

    const sampleFallback = !isMembersRemoteEnabled()
    const initial = syncMarketingConsentState(currentUser.termsAgreements, sampleFallback)
    setProfileTermsAgreements(currentUser.termsAgreements)
    setMarketingConsent(initial.consent)
    setMarketingAgreedAt(initial.agreedAt)

    if (!isMembersRemoteEnabled()) {
      return
    }

    let cancelled = false
    void (async () => {
      try {
        const me = await fetchAdminMe()
        if (cancelled) return
        const mapped = applyAdminMeToSessionUser(currentUser, me)
        const terms = mapped.termsAgreements
        setProfileTermsAgreements(terms)
        const marketing = syncMarketingConsentState(terms, false)
        setMarketingConsent(marketing.consent)
        setMarketingAgreedAt(marketing.agreedAt)
        updateUser(mapped)
      } catch (error) {
        console.debug('profileEditModal fetchAdminMe failed', error)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [open, user?.id, updateUser])

  const handleCancel = () => {
    onCancel()
  }

  const handleOpenPasswordChangeModal = () => {
    setPasswordChangeModalOpen(true)
  }

  const handleClosePasswordChangeModal = () => {
    setPasswordChangeModalOpen(false)
  }

  const handleOpenWithdrawModal = () => {
    setWithdrawModalOpen(true)
  }

  const handleCloseWithdrawModal = () => {
    if (withdrawing) return
    setWithdrawModalOpen(false)
  }

  const handleWithdraw = async (currentPassword?: string) => {
    if (!user) {
      return
    }

    const password = currentPassword?.trim() ?? ''
    if (!password) {
      showAlert({
        title: '안내',
        content: '비밀번호를 입력해 주세요.',
      })
      return
    }

    setWithdrawing(true)
    try {
      if (isMembersRemoteEnabled()) {
        await withdrawAdminSelfRemote({
          confirmationText: '탈퇴',
          currentPassword: password,
        })
      } else {
        updateUser({ isActive: false })
      }
      setWithdrawModalOpen(false)
      onCancel()
      logout()
    } catch (error) {
      if (isGlobalApiErrorAlertShown(error)) return
      if (isMemberDeleteCurrentPasswordInvalidError(error)) {
        showAlert(getMemberDeleteCurrentPasswordInvalidAlertOptions())
        return
      }
      showAlert({
        title: '안내',
        content: getMemberApiErrorMessage(error, '회원 탈퇴에 실패했습니다.'),
      })
    } finally {
      setWithdrawing(false)
    }
  }

  const handleIdentityReverify = async () => {
    if (isVerifying) {
      return
    }

    identityVerifyAttemptRef.current = true
    resetError()
    await verify()
  }

  /** 성공 시 `{ agreedAt, withdrawnAt }`(완료 안내용), 실패·무시 시 null */
  const applyMarketingConsentChange = async (
    next: MarketingConsentValue
  ): Promise<{ agreedAt?: string; withdrawnAt?: string } | null> => {
    if (!user || next === marketingConsent || marketingConsentUpdating) return null
    if (!isMembersRemoteEnabled()) {
      setMarketingConsent(next)
      return {}
    }

    setMarketingConsentUpdating(true)
    try {
      const previousTerms = profileTermsAgreements ?? user.termsAgreements ?? []
      const version = await resolveMarketingConsentVersion(previousTerms)
      const response = await updateAdminMarketingConsent({
        agreed: next === 'agree',
        version,
      })
      const agreed = response.agreed === true
      const agreedAtDisplay = formatTermsAgreedAt(
        response.agreedAt,
        agreed ? SAMPLE_AGREED_AT : '-'
      )
      const marketingRow: TermsAgreementRow = {
        termsType: response.consentType?.trim() || 'MARKETING',
        termsVersion: response.version?.trim() || version,
        required: false,
        agreed,
        agreedAt: response.agreedAt,
      }
      const nextTerms = previousTerms.some(
        row => TERMS_TYPE_TO_KIND[row.termsType?.trim().toUpperCase() ?? ''] === 'MARKETING'
      )
        ? previousTerms.map(row =>
            TERMS_TYPE_TO_KIND[row.termsType?.trim().toUpperCase() ?? ''] === 'MARKETING'
              ? { ...row, ...marketingRow }
              : row
          )
        : [...previousTerms, marketingRow]

      setMarketingConsent(agreed ? 'agree' : 'disagree')
      setMarketingAgreedAt(agreedAtDisplay)
      setProfileTermsAgreements(nextTerms)
      updateUser({ termsAgreements: nextTerms })
      return { agreedAt: response.agreedAt, withdrawnAt: response.withdrawnAt }
    } catch (error) {
      showAlert({
        title: '마케팅 동의 변경 실패',
        content: getMemberApiErrorMessage(error, '마케팅 정보 수신 동의를 변경하지 못했습니다.'),
      })
      return null
    } finally {
      setMarketingConsentUpdating(false)
    }
  }

  const handleMarketingChange = (next: MarketingConsentValue) => {
    if (!user || next === marketingConsent || marketingConsentUpdating) return
    if (next === 'disagree' && marketingConsent === 'agree') {
      setMarketingWithdrawConfirmOpen(true)
      return
    }
    void (async () => {
      const result = await applyMarketingConsentChange(next)
      if (!result || next !== 'agree') return
      showAlert({
        title: ADMIN_MARKETING_CONSENT_AGREE_DONE_TITLE,
        content: buildMarketingAgreeDoneContent(result.agreedAt),
      })
    })()
  }

  const handleMarketingWithdrawConfirm = () => {
    void (async () => {
      const result = await applyMarketingConsentChange('disagree')
      if (!result) return
      pendingWithdrawDoneRef.current = result
      setMarketingWithdrawConfirmOpen(false)
    })()
  }

  /** 안내 팝업 닫힘 애니메이션 완료 후 완료 안내 표시 */
  const handleMarketingWithdrawConfirmAfterOpenChange = (isOpen: boolean) => {
    const pending = pendingWithdrawDoneRef.current
    if (isOpen || !pending) return
    pendingWithdrawDoneRef.current = null
    showAlert({
      title: ADMIN_MARKETING_CONSENT_WITHDRAW_DONE_TITLE,
      content: buildMarketingWithdrawDoneContent(pending.withdrawnAt),
    })
  }

  const handleMarketingWithdrawCancel = () => {
    if (marketingConsentUpdating) return
    setMarketingWithdrawConfirmOpen(false)
  }

  if (!user) return null

  const isAdminUser = user.role === 'ADMIN'

  const sampleFallback = !isMembersRemoteEnabled()
  const termsForDisplay = profileTermsAgreements ?? user.termsAgreements
  const serviceTerms = resolveTermsAgreement(termsForDisplay, 'SERVICE_TERMS', {
    sampleFallback,
  })
  const personalInfoTerms = resolveTermsAgreement(termsForDisplay, 'PERSONAL_INFO', {
    sampleFallback,
  })
  const mfaSetupTerms = resolveTermsAgreement(termsForDisplay, 'MFA_SETUP', { sampleFallback })

  const footer = (
    <div className="profile-edit-modal__footer">
      <button
        type="button"
        className="profile-edit-modal__withdraw-button"
        onClick={handleOpenWithdrawModal}
      >
        회원 탈퇴
      </button>
      <div className="profile-edit-modal__footer-actions">
        <CmsButton variant="default" size="medium" type="button" onClick={handleCancel}>
          닫기
        </CmsButton>
        {isAdminUser ? (
          <CmsButton
            variant="secondary"
            size="medium"
            type="button"
            className="profile-edit-modal__password-change-btn"
            onClick={handleOpenPasswordChangeModal} >
            비밀번호 변경
          </CmsButton>
        ) : null}
      </div>
    </div>
  )

  return (
    <ContentModal
      open={open}
      onCancel={handleCancel}
      title="내 정보 확인"
      width={1200}
      className="profile-edit-modal"
      footer={footer}
    >
      <div className="profile-edit-modal__body">
        <DetailInfoForm
          title="기본 정보"
          mode="view"
          className="profile-edit-modal__section profile-edit-modal__section--basic-info"
        >
          <div className="profile-edit-modal__basic-info-stack">
            <div className="profile-edit-modal__basic-info-table profile-edit-modal__basic-info-table--top">
              <DetailInfoForm.Row type="single" className="profile-edit-modal__row">
                <DetailInfoForm.Field
                  label="가입일"
                  readOnlyDisplay
                  view={<span>{formatDateDot(user.createdAt)}</span>}
                />
              </DetailInfoForm.Row>
            </div>

            <div className="profile-edit-modal__basic-info-table profile-edit-modal__basic-info-table--main">
              <DetailInfoForm.Row type="double" className="profile-edit-modal__row">
                <DetailInfoForm.Field
                  label="성명"
                  readOnlyDisplay
                  view={<span>{user.name || '-'}</span>}
                />
                <DetailInfoForm.Field
                  label="성별 및 생년월일"
                  readOnlyDisplay
                  view={<ProfileGenderBirthView user={user} />}
                />
              </DetailInfoForm.Row>

              <DetailInfoForm.Row type="double" className="profile-edit-modal__row">
                <DetailInfoForm.Field
                  label="연락처"
                  readOnlyDisplay
                  view={
                    <ProfileFieldWithAction
                      value={user.phone?.trim() ? formatKoreanPhoneNumber(user.phone) : '-'}
                      actionLabel="본인인증 재인증"
                      onAction={() => {
                        void handleIdentityReverify()
                      }}
                      actionDisabled={isVerifying}
                      actionLoading={isVerifying}
                    />
                  }
                />
                <DetailInfoForm.Field
                  label="이메일"
                  readOnlyDisplay
                  view={<span>{user.email || '-'}</span>}
                />
              </DetailInfoForm.Row>

              <DetailInfoForm.Row type="double" className="profile-edit-modal__row">
                <DetailInfoForm.Field
                  label="권한 유형"
                  readOnlyDisplay
                  view={<span>{resolveAdminPermissionLabel(user)}</span>}
                />
                <DetailInfoForm.Field
                  label="담당 프로그램 수"
                  readOnlyDisplay
                  view={
                    <span className="profile-edit-modal__managed-programs">
                      <AdminManagedProgramsView user={user} />
                    </span>
                  }
                />
              </DetailInfoForm.Row>
            </div>
          </div>
        </DetailInfoForm>

        <DetailInfoForm title="약관 및 동의" mode="view">
          <DetailInfoForm.Row type="double">
            <DetailInfoForm.Field
              labelWidth={180}
              label="서비스 이용약관 동의"
              readOnlyDisplay
              view={consentReadonlyContent(serviceTerms.agreed, serviceTerms.agreedAtDisplay)}
            />
            <DetailInfoForm.Field
              label="개인정보 수집·이용 동의"
              readOnlyDisplay
              labelWidth={180}
              view={consentReadonlyContent(
                personalInfoTerms.agreed,
                personalInfoTerms.agreedAtDisplay
              )}
            />
          </DetailInfoForm.Row>

          <DetailInfoForm.Row type="double">
            {/* Figma 16299:623421(미동의) · 8193:140673(동의) — 상태 | 버튼 (+ 동의 일시) */}
            <DetailInfoForm.Field
              label="마케팅 정보 수신 동의"
              labelWidth={180}
              readOnlyDisplay
              view={
                <span className="profile-edit-modal__marketing-consent">
                  <span className="user-consent-agreement-section__value-status">
                    {marketingConsent === 'agree' ? '동의' : '미동의'}
                  </span>
                  <DetailInfoForm.TdDivider />
                  <CmsButton
                    variant="secondary"
                    size="h32"
                    className="profile-edit-modal__field-action-btn"
                    type="button"
                    disabled={marketingConsentUpdating}
                    loading={marketingConsentUpdating && !marketingWithdrawConfirmOpen}
                    onClick={() =>
                      handleMarketingChange(marketingConsent === 'agree' ? 'disagree' : 'agree')
                    }
                  >
                    {marketingConsent === 'agree' ? '동의 철회하기' : '동의하기'}
                  </CmsButton>
                  {marketingConsent === 'agree' && marketingAgreedAt !== '-' ? (
                    <span className="user-consent-agreement-section__value-datetime">
                      {marketingAgreedAt}
                    </span>
                  ) : null}
                </span>
              }
            />
            <DetailInfoForm.Field
              label="2단계 인증 설정 동의"
              labelWidth={180}
              readOnlyDisplay
              view={consentReadonlyContent(mfaSetupTerms.agreed, mfaSetupTerms.agreedAtDisplay)}
            />
          </DetailInfoForm.Row>
        </DetailInfoForm>
      </div>

      <ProfilePasswordChangeModal
        open={passwordChangeModalOpen}
        onCancel={handleClosePasswordChangeModal}
      />

      <MemberWithdrawGuideModal
        open={withdrawModalOpen}
        onCancel={handleCloseWithdrawModal}
        onConfirm={value => void handleWithdraw(value)}
        variant="self_withdraw"
        confirmLoading={withdrawing}
      />

      <ConfirmModal
        open={marketingWithdrawConfirmOpen}
        title={ADMIN_MARKETING_CONSENT_WITHDRAW_CONFIRM.title}
        content={ADMIN_MARKETING_CONSENT_WITHDRAW_CONFIRM.content}
        confirmText={ADMIN_MARKETING_CONSENT_WITHDRAW_CONFIRM.confirmText}
        cancelText={ADMIN_MARKETING_CONSENT_WITHDRAW_CONFIRM.cancelText}
        onConfirm={handleMarketingWithdrawConfirm}
        onCancel={handleMarketingWithdrawCancel}
        confirmLoading={marketingConsentUpdating}
        zIndex={2600}
        afterOpenChange={handleMarketingWithdrawConfirmAfterOpenChange}
      />
    </ContentModal>
  )
}
