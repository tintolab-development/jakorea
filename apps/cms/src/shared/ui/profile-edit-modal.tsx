/**
 * 내 정보 확인 모달
 */

import dayjs from 'dayjs'
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { genderBirthView, inlineSegmentsWithDividers, socialView } from '@/features/user/detail/ui/user-basic-info/display'
import { cmsSocialAuthClient } from '@/features/auth/social-auth/cms-client'
import { isSocialAdminSocialApiRemoteEnabled } from '@/features/auth/api/social-auth-remote-capabilities'
import { useAdminLinkedSocialAccounts } from '@/features/auth/hooks/use-admin-linked-social-accounts'
import { EditableField } from '@/features/user/detail/ui/user-basic-info/fields/editable-field'
import { EditableRow } from '@/features/user/detail/ui/user-basic-info/fields/editable-row'
import {
  ADMIN_PERMISSION_TAG_LABEL,
  getAdminPermissionVariant,
} from '@/features/user/shared/lib/admin-permission-display'
import {
  getManagedProgramMetricsParts,
  ManagedProgramCountDisplay,
} from '@/features/user/detail/lib/user-detail-fullpage-helpers'
import {
  buildRegisterSocialConnectPath,
  isSocialConnectAuthFlowPath,
  setRegisterSocialLinkIntent,
} from '@/features/auth/lib/register-social-connect-state'
import { getRedirectPathByRole } from '@/shared/utils/auth-redirect'
import { useAuthStore } from '@/features/auth/model/auth-store'
import {
  cmsIdentityVerificationClient,
  type IdentityChallengeCompleteResult,
} from '@/features/auth/identity-verification'
import { useIdentityVerification as useIdentityVerificationBase } from '@jakorea/identity-verification/react'
import { CmsButton, CmsInput, CmsRadioGroup, ContentModal, useCmsAlert } from '@/shared/ui'
import type { User } from '@/types/user'
import { formatDate } from '@/shared/utils'
import '@/features/user/detail/ui/user-consent-agreement-section.css'
import './profile-edit-modal.css'

interface ProfileEditModalProps {
  open: boolean
  onCancel: () => void
  onSuccess?: () => void
}

type MarketingConsentValue = 'agree' | 'disagree'
type TermsKind = 'SERVICE_TERMS' | 'PERSONAL_INFO' | 'MARKETING'

const MARKETING_RADIO_OPTIONS = [
  { label: '동의', value: 'agree' as const },
  { label: '미동의', value: 'disagree' as const },
]

const SAMPLE_AGREED_AT = '2026.01.15 09:15:42'

const TERMS_TYPE_TO_KIND: Record<string, TermsKind> = {
  SERVICE_TERMS: 'SERVICE_TERMS',
  TERMS_OF_SERVICE: 'SERVICE_TERMS',
  PERSONAL_INFO: 'PERSONAL_INFO',
  PERSONAL_INFO_COLLECTION: 'PERSONAL_INFO',
  MARKETING: 'MARKETING',
  MARKETING_CONSENT: 'MARKETING',
}

function formatTermsAgreedAt(iso?: string): string {
  if (!iso?.trim()) return SAMPLE_AGREED_AT
  const parsed = dayjs(iso)
  return parsed.isValid() ? parsed.format('YYYY.MM.DD HH:mm:ss') : iso
}

function resolveTermsAgreement(
  user: Omit<User, 'password'>,
  kind: TermsKind
): { agreed: boolean; agreedAtDisplay: string } {
  const agreements = user.termsAgreements ?? []
  const record = agreements.find(item => {
    const type = item.termsType?.trim().toUpperCase()
    return type != null && TERMS_TYPE_TO_KIND[type] === kind
  })

  if (!record) {
    return { agreed: true, agreedAtDisplay: SAMPLE_AGREED_AT }
  }

  return {
    agreed: record.agreed ?? false,
    agreedAtDisplay: formatTermsAgreedAt(record.agreedAt),
  }
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
      <DetailInfoForm.TdDivider />
      <CmsButton
        variant="secondary"
        size="small"
        width={100}
        type="button"
        className="profile-edit-modal__field-action-btn"
        disabled={actionDisabled}
        loading={actionLoading}
        onClick={onAction}
      >
        {actionLabel}
      </CmsButton>
    </span>
  )
}

function resolveAdminPermissionLabel(user: Omit<User, 'password'>): string {
  if (user.role !== 'ADMIN') return '-'
  const hasPermissionData =
    user.listMetrics?.adminPermissionVariant != null ||
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
  const navigate = useNavigate()
  const { user, updateUser, logout } = useAuthStore()
  const { showAlert } = useCmsAlert()
  const { linkedLabels, loading: loadingLinkedSocialAccounts } = useAdminLinkedSocialAccounts(open)
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false)
  const [withdrawKeyword, setWithdrawKeyword] = useState('')
  const [withdrawing, setWithdrawing] = useState(false)
  const [marketingConsent, setMarketingConsent] = useState<MarketingConsentValue>('agree')
  const [marketingAgreedAt, setMarketingAgreedAt] = useState(SAMPLE_AGREED_AT)
  const identityVerifyAttemptRef = useRef(false)

  const handleIdentitySuccess = useCallback(
    (result: IdentityChallengeCompleteResult) => {
      identityVerifyAttemptRef.current = false
      const nextPhone = result.verifiedPhone?.trim()
      updateUser({
        ...(nextPhone ? { phone: nextPhone } : {}),
        updatedAt: new Date().toISOString(),
      })
      showAlert({
        title: '인증 완료',
        content: '본인인증 재인증이 완료되었습니다.',
      })
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
    if (!open || !user) return
    const marketing = resolveTermsAgreement(user, 'MARKETING')
    setMarketingConsent(marketing.agreed ? 'agree' : 'disagree')
    setMarketingAgreedAt(marketing.agreedAtDisplay)
  }, [open, user])

  const handleCancel = () => {
    onCancel()
  }

  const handleOpenWithdrawModal = () => {
    setWithdrawKeyword('')
    setWithdrawModalOpen(true)
  }

  const handleCloseWithdrawModal = () => {
    if (withdrawing) return
    setWithdrawModalOpen(false)
    setWithdrawKeyword('')
  }

  const handleWithdraw = async () => {
    if (!user || withdrawKeyword.trim() !== '탈퇴') {
      return
    }

    setWithdrawing(true)
    try {
      updateUser({ isActive: false })
      setWithdrawModalOpen(false)
      onCancel()
      logout()
    } catch (error) {
      console.error('Failed to withdraw account:', error)
    } finally {
      setWithdrawing(false)
      setWithdrawKeyword('')
    }
  }

  const handleSocialConnect = () => {
    const currentPath =
      typeof window !== 'undefined' ? `${window.location.pathname}${window.location.search}` : '/'
    const redirectPath = isSocialConnectAuthFlowPath(currentPath)
      ? getRedirectPathByRole(user)
      : currentPath

    setRegisterSocialLinkIntent(redirectPath)
    onCancel()
    navigate(buildRegisterSocialConnectPath(redirectPath))
  }

  const handleIdentityReverify = async () => {
    if (isVerifying) {
      return
    }

    identityVerifyAttemptRef.current = true
    resetError()
    await verify()
  }

  const handleMarketingChange = (next: MarketingConsentValue) => {
    if (!user || next === marketingConsent) return

    // TODO(api): 마케팅 제공 동의 변경 API 연동 후 서버 반영
    setMarketingConsent(next)
  }

  if (!user) return null

  const serviceTerms = resolveTermsAgreement(user, 'SERVICE_TERMS')
  const personalInfoTerms = resolveTermsAgreement(user, 'PERSONAL_INFO')
  const linkedSocialDisplay =
    isSocialAdminSocialApiRemoteEnabled() && cmsSocialAuthClient.hasAccessToken()
      ? linkedLabels.length > 0
        ? inlineSegmentsWithDividers(linkedLabels)
        : loadingLinkedSocialAccounts
          ? '조회 중...'
          : '-'
      : socialView(user)

  const footer = (
    <div className="profile-edit-modal__footer">
      <button type="button" className="profile-edit-modal__withdraw-button" onClick={handleOpenWithdrawModal}>
        회원탈퇴
      </button>
      <div className="profile-edit-modal__footer-actions">
        <CmsButton
          variant="default"
          size="medium"
          type="button"
          className="profile-edit-modal__close-btn"
          onClick={handleCancel}
        >
          닫기
        </CmsButton>
      </div>
    </div>
  )

  return (
    <ContentModal
      open={open}
      onCancel={handleCancel}
      title="내 정보 확인"
      width={1000}
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
              <EditableRow type="double" className="profile-edit-modal__row profile-edit-modal__row--tall">
                <EditableField
                  label="가입일"
                  readOnlyDisplay
                  view={<span>{formatDate(user.createdAt)}</span>}
                />
                <EditableField
                  label="연동된 소셜 계정"
                  readOnlyDisplay
                  view={
                    <ProfileFieldWithAction
                      value={linkedSocialDisplay}
                      actionLabel="계정 연동/해제"
                      onAction={handleSocialConnect}
                    />
                  }
                />
              </EditableRow>
            </div>

            <div className="profile-edit-modal__basic-info-table profile-edit-modal__basic-info-table--main">
              <EditableRow type="double" className="profile-edit-modal__row">
                <EditableField label="성명" readOnlyDisplay view={<span>{user.name || '-'}</span>} />
                <EditableField
                  label="성별 및 생년월일"
                  readOnlyDisplay
                  view={<span>{genderBirthView(user)}</span>}
                />
              </EditableRow>

              <EditableRow type="double" className="profile-edit-modal__row">
                <EditableField
                  label="연락처"
                  readOnlyDisplay
                  view={
                    <ProfileFieldWithAction
                      value={user.phone?.trim() || '-'}
                      actionLabel="본인인증 재인증"
                      onAction={() => {
                        void handleIdentityReverify()
                      }}
                      actionDisabled={isVerifying}
                      actionLoading={isVerifying}
                    />
                  }
                />
                <EditableField label="이메일" readOnlyDisplay view={<span>{user.email || '-'}</span>} />
              </EditableRow>

              <EditableRow type="double" className="profile-edit-modal__row">
                <EditableField
                  label="권한 유형"
                  readOnlyDisplay
                  view={<span>{resolveAdminPermissionLabel(user)}</span>}
                />
                <EditableField
                  label="담당 프로그램 수"
                  readOnlyDisplay
                  view={
                    <span className="profile-edit-modal__managed-programs">
                      <AdminManagedProgramsView user={user} />
                    </span>
                  }
                />
              </EditableRow>
            </div>
          </div>
        </DetailInfoForm>

        <DetailInfoForm
          title="약관 및 동의"
          mode="view"
          className="profile-edit-modal__section profile-edit-modal__section--terms"
        >
          <div className="profile-edit-modal__terms-table">
            <EditableRow type="double" className="profile-edit-modal__terms-row profile-edit-modal__terms-row--standard">
              <EditableField
                label="서비스 이용약관"
                readOnlyDisplay
                view={consentReadonlyContent(serviceTerms.agreed, serviceTerms.agreedAtDisplay)}
              />
              <EditableField
                label="개인정보 수집·이용 동의"
                readOnlyDisplay
                view={consentReadonlyContent(personalInfoTerms.agreed, personalInfoTerms.agreedAtDisplay)}
              />
            </EditableRow>

            <EditableRow type="single" className="profile-edit-modal__terms-row profile-edit-modal__terms-row--marketing">
              <DetailInfoForm.Field
                label="마케팅 제공 동의"
                labelWidth={200}
                mode="edit"
                view={consentReadonlyContent(marketingConsent === 'agree', marketingAgreedAt)}
                edit={
                  <span className="profile-edit-modal__marketing-consent">
                    <CmsRadioGroup
                      size="medium"
                      options={MARKETING_RADIO_OPTIONS}
                      value={marketingConsent}
                      onChange={event => handleMarketingChange(event.target.value as MarketingConsentValue)}
                    />
                    <DetailInfoForm.TdDivider />
                    <span className="user-consent-agreement-section__value-datetime">{marketingAgreedAt}</span>
                  </span>
                }
              />
            </EditableRow>
          </div>
        </DetailInfoForm>
      </div>

      <ContentModal
        open={withdrawModalOpen}
        onCancel={handleCloseWithdrawModal}
        title="회원 탈퇴 안내"
        width={600}
        className="profile-withdraw-modal"
        footer={
          <>
            <CmsButton variant="secondary" onClick={handleCloseWithdrawModal}>
              취소
            </CmsButton>
            <CmsButton
              variant="delete"
              onClick={handleWithdraw}
              loading={withdrawing}
              disabled={withdrawKeyword.trim() !== '탈퇴'}
            >
              회원 탈퇴
            </CmsButton>
          </>
        }
      >
        <div className="profile-withdraw-modal__content">
          <p className="profile-withdraw-modal__description">
            JA KOREA 서비스에서 탈퇴하시겠습니까?
            <br />
            탈퇴 시 회원님의 계정 정보, 이용 내역 및 저장된 데이터가 모두 영구 삭제됩니다.
            <br />
            삭제된 정보는 복구가 불가능합니다. 정말 탈퇴하시겠습니까?
          </p>

          <CmsInput
            inputSize="large"
            width="100%"
            placeholder="탈퇴하시려면 해당란에 [탈퇴]를 입력해 주세요."
            value={withdrawKeyword}
            onChange={event => setWithdrawKeyword(event.target.value)}
          />
        </div>
      </ContentModal>
    </ContentModal>
  )
}
