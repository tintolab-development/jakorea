/**
 * 내 정보 확인 모달 — CMS ProfileEditModal UI
 */

import dayjs from 'dayjs'
import { Fragment, useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { DetailInfoForm } from '@jakorea/form-template-runtime'
import '@jakorea/form-template-runtime/detail-info-form.css'
import { formatKoreanPhoneNumber } from '@jakorea/domain/shared/korean-phone'
import { useIdentityVerification } from '@jakorea/identity-verification/react'
import {
  fetchCmsAdminMe,
  fetchCmsCurrentTermsDocumentVersion,
  updateCmsAdminIdentityContact,
  updateCmsAdminMarketingConsent,
  withdrawCmsAdminSelf,
  type CmsAdminMeResponse,
  type CmsAdminTermsAgreement,
} from '@/features/auth/api/cms-admin-me'
import {
  adminProfileIdentityClient,
  type IdentityChallengeCompleteResult,
} from '@/features/auth/identity-verification'
import { formatAdminGnbRoleLabel } from '@/features/auth/lib/format-admin-gnb-role-label'
import { ProfilePasswordChangeModal } from '@/features/auth/ui/profile-password-change-modal'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { formatDateDot } from '@/shared/lib/format-display'
import { readApiErrorMessage } from '@/shared/lib/api-error-message'
import {
  CmsButton,
  CmsInput,
  ConfirmModal,
  ContentModal,
  showWithdrawCompletedAlert,
  useCmsAlert,
} from '@/shared/ui'

import './profile-edit-modal.css'

type Props = {
  open: boolean
  onCancel: () => void
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

function formatTermsAgreedAt(iso?: string): string {
  if (!iso?.trim()) return '-'
  const parsed = dayjs(iso)
  return parsed.isValid() ? parsed.format('YYYY.MM.DD HH:mm:ss') : iso
}

function termsKindOf(row: CmsAdminTermsAgreement): TermsKind | undefined {
  const type = (row.termsType ?? row.consentType)?.trim().toUpperCase()
  if (!type) return undefined
  return TERMS_TYPE_TO_KIND[type]
}

function resolveTermsAgreement(
  terms: CmsAdminTermsAgreement[] | undefined,
  kind: TermsKind,
): { agreed: boolean; agreedAtDisplay: string } {
  const record = (terms ?? []).find(item => termsKindOf(item) === kind)
  if (!record) return { agreed: false, agreedAtDisplay: '-' }
  return {
    agreed: record.agreed === true,
    agreedAtDisplay: record.agreed === true ? formatTermsAgreedAt(record.agreedAt) : '-',
  }
}

function toDisplayGender(gender: string | undefined): string {
  const raw = gender?.trim()
  if (!raw) return '-'
  const upper = raw.toUpperCase()
  if (upper === 'M' || upper === 'MALE' || raw === '남성' || raw === '남') return '남성'
  if (upper === 'F' || upper === 'FEMALE' || raw === '여성' || raw === '여') return '여성'
  return raw
}

function formatBirthWithManAge(birthDate: string | undefined): string {
  const raw = birthDate?.trim()
  if (!raw) return '-'
  const parsed = dayjs(raw)
  if (!parsed.isValid()) return raw
  const today = dayjs()
  let age = today.year() - parsed.year()
  if (today.month() < parsed.month() || (today.month() === parsed.month() && today.date() < parsed.date())) {
    age -= 1
  }
  const date = parsed.format('YYYY.MM.DD')
  return age >= 0 ? `${date} (만 ${age}세)` : date
}

/** 값 셀 안 여러 조각 — 조각 사이에 공통 세로 구분선(`TdDivider`) */
function ProfileValueSegments({ children }: { children: ReactNode[] }) {
  const segments = children.filter(child => child != null && child !== false)
  return (
    <span className="profile-edit-modal__value-segments">
      {segments.map((segment, index) => (
        <Fragment key={index}>
          {index > 0 ? <DetailInfoForm.TdDivider /> : null}
          {segment}
        </Fragment>
      ))}
    </span>
  )
}

function GenderBirthView({ me }: { me: CmsAdminMeResponse | null }) {
  const gender = toDisplayGender(me?.gender)
  const birth = formatBirthWithManAge(me?.birthDate)
  if (gender === '-' && birth === '-') return '-'
  return (
    <ProfileValueSegments>
      {[<span key="gender">{gender}</span>, <span key="birth">{birth}</span>]}
    </ProfileValueSegments>
  )
}

function ConsentDatetime({ value }: { value: string }) {
  return <span className="profile-edit-modal__consent-datetime">{value}</span>
}

function consentReadonlyContent(agreed: boolean, agreedAtDisplay?: string) {
  const hasDatetime = agreed && Boolean(agreedAtDisplay) && agreedAtDisplay !== '-'
  return (
    <ProfileValueSegments>
      {[
        <span key="status">{agreed ? '동의' : '미동의'}</span>,
        hasDatetime ? <ConsentDatetime key="datetime" value={agreedAtDisplay!} /> : null,
      ]}
    </ProfileValueSegments>
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
    <ProfileValueSegments>
      {[
        <span key="value">{value}</span>,
        <CmsButton
          key="action"
          variant="secondary"
          size="h32"
          className="profile-edit-modal__field-action-btn"
          type="button"
          disabled={actionDisabled}
          loading={actionLoading}
          onClick={onAction}
        >
          {actionLabel}
        </CmsButton>,
      ]}
    </ProfileValueSegments>
  )
}

async function resolveMarketingConsentVersion(
  termsAgreements: CmsAdminTermsAgreement[] | undefined,
): Promise<string> {
  const fromRow = termsAgreements?.find(row => termsKindOf(row) === 'MARKETING')?.version?.trim()
  if (fromRow) return fromRow

  const fromMarketing = await fetchCmsCurrentTermsDocumentVersion('MARKETING')
  if (fromMarketing) return fromMarketing

  const fromService = await fetchCmsCurrentTermsDocumentVersion('SERVICE_TERMS')
  if (fromService) return fromService

  throw new Error('약관 버전을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.')
}

function ManagedProgramCountView({ me }: { me: CmsAdminMeResponse | null }) {
  const active = me?.activeManagedProgramCount
  const total = me?.totalManagedProgramCount
  if (active == null && total == null) return '-'
  return (
    <ProfileValueSegments>
      {[
        <span key="active">{`진행 중 : ${active ?? 0}건`}</span>,
        <span key="total">{`전체 : ${total ?? 0}건`}</span>,
      ]}
    </ProfileValueSegments>
  )
}

export function ProfileEditModal({ open, onCancel }: Props) {
  const logout = useAuthStore(state => state.logout)
  const { showAlert } = useCmsAlert()
  const [me, setMe] = useState<CmsAdminMeResponse | null>(null)
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false)
  const [withdrawPassword, setWithdrawPassword] = useState('')
  const [passwordChangeModalOpen, setPasswordChangeModalOpen] = useState(false)
  const [withdrawing, setWithdrawing] = useState(false)
  const [marketingConsent, setMarketingConsent] = useState<MarketingConsentValue>('disagree')
  const [marketingAgreedAt, setMarketingAgreedAt] = useState('-')
  const [marketingConsentUpdating, setMarketingConsentUpdating] = useState(false)
  const [marketingWithdrawConfirmOpen, setMarketingWithdrawConfirmOpen] = useState(false)
  const identityVerifyAttemptRef = useRef(false)

  const handleIdentitySuccess = useCallback(
    (result: IdentityChallengeCompleteResult) => {
      identityVerifyAttemptRef.current = false
      void (async () => {
        try {
          if (result.profileToken) {
            await updateCmsAdminIdentityContact({
              identityVerificationSessionId: result.sessionId,
              profileToken: result.profileToken,
            })
            const next = await fetchCmsAdminMe()
            setMe(next)
          } else if (result.verifiedPhone?.trim()) {
            setMe(prev => (prev ? { ...prev, phone: result.verifiedPhone } : prev))
          }
          showAlert({
            title: '인증 완료',
            content: '본인인증 재인증이 완료되었습니다.',
          })
        } catch (error) {
          showAlert({
            title: '본인인증 반영 실패',
            content: readApiErrorMessage(error) ?? '본인인증 결과를 계정에 반영하지 못했습니다.',
          })
        }
      })()
    },
    [showAlert],
  )

  const { verify, isVerifying, errorMessage, resetError } = useIdentityVerification({
    client: adminProfileIdentityClient,
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
    if (!open) {
      setMe(null)
      setMarketingWithdrawConfirmOpen(false)
      setWithdrawModalOpen(false)
      setWithdrawPassword('')
      return
    }

    let cancelled = false
    void (async () => {
      try {
        const next = await fetchCmsAdminMe()
        if (cancelled) return
        setMe(next)
        const marketing = resolveTermsAgreement(next.termsAgreements, 'MARKETING')
        setMarketingConsent(marketing.agreed ? 'agree' : 'disagree')
        setMarketingAgreedAt(marketing.agreedAtDisplay)
      } catch (error) {
        if (cancelled) return
        showAlert({
          title: '내 정보 조회 실패',
          content: readApiErrorMessage(error) ?? '내 정보를 불러오지 못했습니다.',
        })
      }
    })()

    return () => {
      cancelled = true
    }
  }, [open, showAlert])

  const handleCancel = () => {
    onCancel()
  }

  const applyMarketingConsentChange = async (next: MarketingConsentValue): Promise<boolean> => {
    if (next === marketingConsent || marketingConsentUpdating) return false
    setMarketingConsentUpdating(true)
    try {
      const version = await resolveMarketingConsentVersion(me?.termsAgreements)
      const response = await updateCmsAdminMarketingConsent({
        agreed: next === 'agree',
        version,
      })
      const agreed = response.agreed === true
      setMarketingConsent(agreed ? 'agree' : 'disagree')
      setMarketingAgreedAt(agreed ? formatTermsAgreedAt(response.agreedAt) : '-')
      return true
    } catch (error) {
      showAlert({
        title: '마케팅 동의 변경 실패',
        content: readApiErrorMessage(error) ?? '마케팅 제공 동의를 변경하지 못했습니다.',
      })
      return false
    } finally {
      setMarketingConsentUpdating(false)
    }
  }

  const handleMarketingChange = (next: MarketingConsentValue) => {
    if (next === marketingConsent || marketingConsentUpdating) return
    if (next === 'disagree' && marketingConsent === 'agree') {
      setMarketingWithdrawConfirmOpen(true)
      return
    }
    void applyMarketingConsentChange(next)
  }

  const handleWithdraw = async () => {
    const password = withdrawPassword.trim()
    if (!password) {
      showAlert({ title: '안내', content: '비밀번호를 입력해 주세요.' })
      return
    }
    setWithdrawing(true)
    try {
      await withdrawCmsAdminSelf({ confirmationText: '탈퇴', currentPassword: password })
      setWithdrawModalOpen(false)
      showWithdrawCompletedAlert({
        onConfirm: () => {
          onCancel()
          logout()
        },
      })
    } catch (error) {
      showAlert({
        title: '안내',
        content: readApiErrorMessage(error) ?? '회원 탈퇴에 실패했습니다.',
      })
    } finally {
      setWithdrawing(false)
    }
  }

  const serviceTerms = resolveTermsAgreement(me?.termsAgreements, 'SERVICE_TERMS')
  const personalInfoTerms = resolveTermsAgreement(me?.termsAgreements, 'PERSONAL_INFO')
  const mfaSetupTerms = resolveTermsAgreement(me?.termsAgreements, 'MFA_SETUP')
  const marketingAgreed = marketingConsent === 'agree'
  const permissionLabel = me?.roleName?.trim() || formatAdminGnbRoleLabel(me?.roleCode)
  const phone = me?.phone?.trim() ? formatKoreanPhoneNumber(me.phone) : '-'

  const footer = (
    <div className="profile-edit-modal__footer">
      <button
        type="button"
        className="profile-edit-modal__withdraw-button"
        onClick={() => {
          setWithdrawPassword('')
          setWithdrawModalOpen(true)
        }}
      >
        회원탈퇴
      </button>
      <div className="profile-edit-modal__footer-actions">
        <CmsButton variant="default" size="medium" type="button" onClick={handleCancel}>
          닫기
        </CmsButton>
        <CmsButton
          variant="secondary"
          size="medium"
          type="button"
          onClick={() => setPasswordChangeModalOpen(true)}
        >
          비밀번호 변경
        </CmsButton>
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
                  view={<span>{formatDateDot(me?.createdAt)}</span>}
                />
              </DetailInfoForm.Row>
            </div>

            <div className="profile-edit-modal__basic-info-table profile-edit-modal__basic-info-table--main">
              <DetailInfoForm.Row type="double" className="profile-edit-modal__row">
                <DetailInfoForm.Field
                  label="성명"
                  readOnlyDisplay
                  view={<span>{me?.name?.trim() || '-'}</span>}
                />
                <DetailInfoForm.Field
                  label="성별 및 생년월일"
                  readOnlyDisplay
                  view={<GenderBirthView me={me} />}
                />
              </DetailInfoForm.Row>

              <DetailInfoForm.Row type="double" className="profile-edit-modal__row">
                <DetailInfoForm.Field
                  label="연락처"
                  readOnlyDisplay
                  view={
                    <ProfileFieldWithAction
                      value={phone}
                      actionLabel="본인인증 재인증"
                      actionDisabled={isVerifying}
                      actionLoading={isVerifying}
                      onAction={() => {
                        if (isVerifying) return
                        identityVerifyAttemptRef.current = true
                        resetError()
                        void verify()
                      }}
                    />
                  }
                />
                <DetailInfoForm.Field
                  label="이메일"
                  readOnlyDisplay
                  view={<span>{me?.email?.trim() || '-'}</span>}
                />
              </DetailInfoForm.Row>

              <DetailInfoForm.Row type="double" className="profile-edit-modal__row">
                <DetailInfoForm.Field
                  label="권한 유형"
                  readOnlyDisplay
                  view={<span>{permissionLabel}</span>}
                />
                <DetailInfoForm.Field
                  label="담당 프로그램 수"
                  readOnlyDisplay
                  view={<ManagedProgramCountView me={me} />}
                />
              </DetailInfoForm.Row>
            </div>
          </div>
        </DetailInfoForm>

        <DetailInfoForm
          title="약관 및 동의"
          mode="view"
          className="profile-edit-modal__section profile-edit-modal__section--terms"
        >
          <div className="profile-edit-modal__terms-table">
            <DetailInfoForm.Row type="double" className="profile-edit-modal__row">
              <DetailInfoForm.Field
                labelWidth={220}
                label="서비스 이용약관"
                readOnlyDisplay
                view={consentReadonlyContent(serviceTerms.agreed, serviceTerms.agreedAtDisplay)}
              />
              <DetailInfoForm.Field
                label="개인정보 수집·이용 동의"
                readOnlyDisplay
                labelWidth={220}
                view={consentReadonlyContent(
                  personalInfoTerms.agreed,
                  personalInfoTerms.agreedAtDisplay,
                )}
              />
            </DetailInfoForm.Row>

            <DetailInfoForm.Row type="double" className="profile-edit-modal__row">
              <DetailInfoForm.Field
                label="마케팅 제공 동의"
                labelWidth={220}
                readOnlyDisplay
                view={
                  <ProfileValueSegments>
                    {[
                      // 미동의 상태는 상태 문구 없이 [동의하기] 버튼만 노출
                      marketingAgreed ? <span key="status">동의</span> : null,
                      <span key="action" className="profile-edit-modal__action-with-datetime">
                        <CmsButton
                          variant="secondary"
                          size="h32"
                          className="profile-edit-modal__field-action-btn"
                          type="button"
                          disabled={marketingConsentUpdating}
                          loading={marketingConsentUpdating && !marketingWithdrawConfirmOpen}
                          onClick={() =>
                            handleMarketingChange(marketingAgreed ? 'disagree' : 'agree')
                          }
                        >
                          {marketingAgreed ? '동의 철회하기' : '동의하기'}
                        </CmsButton>
                        {marketingAgreed && marketingAgreedAt !== '-' ? (
                          <ConsentDatetime value={marketingAgreedAt} />
                        ) : null}
                      </span>,
                    ]}
                  </ProfileValueSegments>
                }
              />
              <DetailInfoForm.Field
                label="2단계 인증(MFA) 설정 동의"
                labelWidth={220}
                readOnlyDisplay
                view={consentReadonlyContent(mfaSetupTerms.agreed, mfaSetupTerms.agreedAtDisplay)}
              />
            </DetailInfoForm.Row>
          </div>
        </DetailInfoForm>
      </div>

      <ProfilePasswordChangeModal
        open={passwordChangeModalOpen}
        onCancel={() => setPasswordChangeModalOpen(false)}
      />

      <ContentModal
        open={withdrawModalOpen}
        title="회원 탈퇴 안내"
        description={[
          'JA KOREA 서비스를 탈퇴하시겠습니까?',
          '탈퇴 시 개인정보는 관련 법령 및 당사의 개인정보처리방침에 따라 삭제∙처리됩니다.',
          '삭제된 정보는 복구할 수 없습니다. 탈퇴하시려면 로그인 비밀번호를 입력해 주세요.',
        ].join('\n')}
        width={600}
        zIndex={2600}
        onCancel={() => {
          if (withdrawing) return
          setWithdrawModalOpen(false)
        }}
        footer={
          <>
            <CmsButton
              variant="secondary"
              size="medium"
              type="button"
              onClick={() => setWithdrawModalOpen(false)}
              disabled={withdrawing}
            >
              취소
            </CmsButton>
            <CmsButton
              variant="delete"
              size="medium"
              type="button"
              loading={withdrawing}
              onClick={() => {
                void handleWithdraw()
              }}
            >
              회원 탈퇴
            </CmsButton>
          </>
        }
      >
        <CmsInput
          inputSize="large"
          width="100%"
          type="password"
          value={withdrawPassword}
          onChange={e => setWithdrawPassword(e.target.value)}
          placeholder="현재 비밀번호를 입력해 주세요"
          autoComplete="current-password"
        />
      </ContentModal>

      <ConfirmModal
        open={marketingWithdrawConfirmOpen}
        title={ADMIN_MARKETING_CONSENT_WITHDRAW_CONFIRM.title}
        content={ADMIN_MARKETING_CONSENT_WITHDRAW_CONFIRM.content}
        confirmText={ADMIN_MARKETING_CONSENT_WITHDRAW_CONFIRM.confirmText}
        cancelText={ADMIN_MARKETING_CONSENT_WITHDRAW_CONFIRM.cancelText}
        onConfirm={() => {
          void (async () => {
            const succeeded = await applyMarketingConsentChange('disagree')
            if (succeeded) setMarketingWithdrawConfirmOpen(false)
          })()
        }}
        onCancel={() => {
          if (marketingConsentUpdating) return
          setMarketingWithdrawConfirmOpen(false)
        }}
        confirmLoading={marketingConsentUpdating}
        zIndex={2600}
      />
    </ContentModal>
  )
}
