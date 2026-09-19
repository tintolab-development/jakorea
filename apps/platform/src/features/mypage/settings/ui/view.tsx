import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  getLoginApiErrorMessage,
  usePortalWithdrawalMutation,
} from '@/features/auth/sign-in'
import {
  clearAuthTokens,
  isRemoteApiConfigured,
  setDevAuthLoggedIn,
} from '@/shared/lib'
import { PFAlertModal, PFButton, PFInfoReview, PFText, PFTextInput } from '@/shared/ui'
import { EMPTY_SETTINGS_VALUE, SETTINGS_WITHDRAW_GUIDE, VOLUNTEER_1365_URL } from '../lib/constants'
import type { SettingsGuardianView, SettingsInfoRow } from '../lib/map-view'
import { SettingsChangePasswordModal } from './change-password-modal'
import styles from './view.module.css'

export type SettingsViewProps = {
  basicRows: SettingsInfoRow[]
  guardian: SettingsGuardianView | null
  onEditBasic?: () => void
}

function EditButton({ onClick }: { onClick?: () => void }) {
  return (
    <PFButton
      size="small"
      variant="primary"
      disabled={!onClick}
      className={styles.editButton}
      onClick={onClick}
    >
      수정하기
    </PFButton>
  )
}

function VolunteerIdValue({ value }: { value: string }) {
  const hasVolunteerId = Boolean(value.trim()) && value !== EMPTY_SETTINGS_VALUE

  return (
    <div className={styles.volunteerRow}>
      <PFText typo="bd-md-sb" color="black">
        {value}
      </PFText>
      <PFButton
        size="small"
        variant="tertiary"
        className={styles.volunteerShortcut}
        disabled={!hasVolunteerId}
        onClick={() => {
          window.open(VOLUNTEER_1365_URL, '_blank', 'noopener,noreferrer')
        }}
      >
        바로가기
      </PFButton>
    </div>
  )
}

function toReviewRows(rows: SettingsInfoRow[]) {
  return rows.map(row => ({
    label: row.label,
    value: row.action === '1365-shortcut' ? <VolunteerIdValue value={row.value} /> : row.value,
  }))
}

export function SettingsView({ basicRows, guardian, onEditBasic }: SettingsViewProps) {
  const navigate = useNavigate()
  const withdrawMutation = usePortalWithdrawalMutation()
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false)
  const [isWithdrawGuideOpen, setIsWithdrawGuideOpen] = useState(false)
  const [withdrawPassword, setWithdrawPassword] = useState('')
  const [withdrawPasswordError, setWithdrawPasswordError] = useState<string | null>(null)
  const [withdrawFormError, setWithdrawFormError] = useState<string | null>(null)

  const closeWithdrawGuide = useCallback(() => {
    if (withdrawMutation.isPending) return
    setIsWithdrawGuideOpen(false)
    setWithdrawPassword('')
    setWithdrawPasswordError(null)
    setWithdrawFormError(null)
  }, [withdrawMutation.isPending])

  const handleWithdrawConfirm = useCallback(async () => {
    if (withdrawMutation.isPending) return

    setWithdrawFormError(null)

    const password = withdrawPassword.trim()
    if (!password) {
      setWithdrawPasswordError('비밀번호를 입력해 주세요.')
      return
    }
    setWithdrawPasswordError(null)

    if (!isRemoteApiConfigured()) {
      clearAuthTokens()
      setDevAuthLoggedIn(false)
      setIsWithdrawGuideOpen(false)
      navigate('/', { replace: true })
      return
    }

    try {
      await withdrawMutation.mutateAsync({
        currentPassword: password,
        reason: SETTINGS_WITHDRAW_GUIDE.reason,
        confirmationText: SETTINGS_WITHDRAW_GUIDE.confirmationText,
      })
      clearAuthTokens()
      setDevAuthLoggedIn(false)
      setIsWithdrawGuideOpen(false)
      navigate('/', { replace: true })
    } catch (error) {
      setWithdrawFormError(
        getLoginApiErrorMessage(error, '회원 탈퇴에 실패했어요. 다시 시도해 주세요.'),
      )
    }
  }, [navigate, withdrawMutation, withdrawPassword])

  return (
    <div className={styles.page}>
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <PFText as="h2" typo="form-section-title" color="black" className={styles.sectionTitle}>
            기본 정보
          </PFText>
          <EditButton onClick={onEditBasic} />
        </div>
        <PFInfoReview rows={toReviewRows(basicRows)} />
      </section>

      {guardian ? (
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <PFText as="h2" typo="form-section-title" color="black" className={styles.sectionTitle}>
              보호자 정보
            </PFText>
            <EditButton />
          </div>
          <PFInfoReview
            rows={[
              { label: '이름', value: guardian.name },
              { label: '휴대폰 번호', value: guardian.phone },
              { label: '가입자의 관계', value: guardian.relationship },
            ]}
          />
        </section>
      ) : null}

      <div className={styles.actions}>
        <PFButton
          size="xlarge"
          width="100%"
          onClick={() => setIsChangePasswordOpen(true)}
        >
          비밀번호 변경하기
        </PFButton>
        <PFButton
          size="xlarge"
          variant="tertiary"
          width="100%"
          className={styles.withdrawAction}
          onClick={() => setIsWithdrawGuideOpen(true)}
        >
          회원 탈퇴하기
        </PFButton>
      </div>

      <SettingsChangePasswordModal
        open={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
      />

      <PFAlertModal
        open={isWithdrawGuideOpen}
        title={SETTINGS_WITHDRAW_GUIDE.title}
        description={SETTINGS_WITHDRAW_GUIDE.description}
        confirmLabel={SETTINGS_WITHDRAW_GUIDE.confirmLabel}
        confirmLoading={withdrawMutation.isPending}
        onDismiss={closeWithdrawGuide}
        onConfirm={() => {
          void handleWithdrawConfirm()
        }}
      >
        <PFTextInput
          size="large"
          label="비밀번호"
          type="password"
          name="withdraw-current-password"
          placeholder="비밀번호를 입력해 주세요"
          autoComplete="current-password"
          autoFocus
          value={withdrawPassword}
          onValueChange={next => {
            setWithdrawPassword(next)
            if (withdrawPasswordError) setWithdrawPasswordError(null)
            if (withdrawFormError) setWithdrawFormError(null)
          }}
          onKeyDown={event => {
            if (event.key === 'Enter') {
              event.preventDefault()
              void handleWithdrawConfirm()
            }
          }}
          error={Boolean(withdrawPasswordError)}
          message={withdrawPasswordError ?? undefined}
          messageStatus="error"
          disabled={withdrawMutation.isPending}
        />
        {withdrawFormError ? (
          <PFText as="p" typo="bd-sm-md" color="error">
            {withdrawFormError}
          </PFText>
        ) : null}
      </PFAlertModal>
    </div>
  )
}
